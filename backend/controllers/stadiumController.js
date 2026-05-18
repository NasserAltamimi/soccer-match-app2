const Stadium = require("../models/Stadium");
const User = require("../models/User");
const Reservation = require("../models/Reservation");

function getDateString(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSlotDateString(dateValue) {
  let dateText = "";

  if (typeof dateValue === "string") {
    dateText = dateValue.slice(0, 10);
  } else {
    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    dateText = getDateString(parsedDate);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return "";
  }

  const parsedDate = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  if (getDateString(parsedDate) !== dateText) {
    return "";
  }

  return dateText;
}

function isValidTime(timeValue) {
  return typeof timeValue === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue.trim());
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function timesOverlap(firstSlot, secondSlot) {
  return firstSlot.startTime < secondSlot.endTime && secondSlot.startTime < firstSlot.endTime;
}

function getTodayDateString() {
  return getDateString(new Date());
}

function getMaxSlotDateString() {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  return getDateString(maxDate);
}

function validateReservationSlots(reservationSlots) {
  if (!Array.isArray(reservationSlots) || reservationSlots.length === 0) {
    return "Please add at least one reservation slot";
  }

  const today = getTodayDateString();
  const maxDate = getMaxSlotDateString();

  for (let index = 0; index < reservationSlots.length; index++) {
    const slot = reservationSlots[index];
    const slotNumber = index + 1;
    const startTime = slot && typeof slot.startTime === "string" ? slot.startTime.trim() : "";
    const endTime = slot && typeof slot.endTime === "string" ? slot.endTime.trim() : "";
    const slotDate = getSlotDateString(slot ? slot.date : "");

    if (!slotDate || !isValidTime(startTime) || !isValidTime(endTime)) {
      return `Reservation slot ${slotNumber} must include date, start time, and end time`;
    }

    if (slotDate < today) {
      return `Reservation slot ${slotNumber} date cannot be in the past`;
    }

    if (slotDate > maxDate) {
      return `Reservation slot ${slotNumber} must be within the upcoming 7 days`;
    }

    if (endTime <= startTime) {
      return `Reservation slot ${slotNumber} end time must be after start time`;
    }

    for (let previousIndex = 0; previousIndex < index; previousIndex++) {
      const previousSlot = reservationSlots[previousIndex];
      const previousSlotDate = getSlotDateString(previousSlot ? previousSlot.date : "");
      const cleanSlot = { startTime, endTime };
      const cleanPreviousSlot = {
        startTime: previousSlot.startTime ? previousSlot.startTime.trim() : "",
        endTime: previousSlot.endTime ? previousSlot.endTime.trim() : "",
      };

      if (slotDate === previousSlotDate && timesOverlap(cleanSlot, cleanPreviousSlot)) {
        return `Reservation slot ${slotNumber} overlaps with another slot`;
      }
    }
  }

  return "";
}

function cleanReservationSlots(reservationSlots) {
  return reservationSlots.map((slot) => {
    return {
      date: getSlotDateString(slot.date),
      startTime: slot.startTime.trim(),
      endTime: slot.endTime.trim(),
      isReserved: false,
    };
  });
}

const createStadium = async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user.id);

    if (!loggedInUser || loggedInUser.role !== "owner") {
      return res.status(403).json({ message: "Only owners can create stadiums" });
    }

    const name = trimText(req.body.name);
    const description = trimText(req.body.description);
    const location = trimText(req.body.location);
    const images = Array.isArray(req.body.images)
      ? req.body.images.map((image) => trimText(image)).filter((image) => image !== "")
      : [];
    const reservationSlots = req.body.reservationSlots;

    if (!name || !description || !location) {
      return res.status(400).json({
        message: "Please fill in stadium name, description, and location",
      });
    }

    const validationMessage = validateReservationSlots(reservationSlots);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const stadium = await Stadium.create({
      name,
      description,
      location,
      images,
      reservationSlots: cleanReservationSlots(reservationSlots),
      owner: loggedInUser._id,
    });

    res.status(201).json(stadium);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStadiums = async (req, res) => {
  try {
    const stadiums = await Stadium.find().populate("owner", "name email role");

    res.json(stadiums);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStadiumById = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id).populate(
      "owner",
      "name email role"
    );

    if (!stadium) {
      return res.status(404).json({ message: "Stadium not found" });
    }

    res.json(stadium);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyStadiums = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can view owner stadiums" });
    }

    const stadiums = await Stadium.find({ owner: req.user.id }).populate(
      "owner",
      "name email role"
    );

    res.json(stadiums);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStadium = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);

    if (!stadium) {
      return res.status(404).json({ message: "Stadium not found" });
    }

    if (stadium.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own stadiums" });
    }

    const hasActiveReservations = stadium.reservationSlots.some((slot) => {
      return slot.isReserved;
    });

    if (hasActiveReservations && req.body.confirmDelete !== true) {
      return res.status(400).json({
        message: "This stadium has active reservations. Confirm before deleting.",
      });
    }

    await Reservation.updateMany(
      { stadium: stadium._id, status: "reserved" },
      { $set: { status: "cancelled" } }
    );
    await stadium.deleteOne();

    res.json({ message: "Stadium deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStadium,
  getStadiums,
  getMyStadiums,
  getStadiumById,
  deleteStadium,
};
