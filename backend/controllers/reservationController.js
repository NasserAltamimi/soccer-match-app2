const Reservation = require("../models/Reservation");
const Stadium = require("../models/Stadium");

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

function getTodayDateString() {
  return getDateString(new Date());
}

function getMaxSlotDateString() {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  return getDateString(maxDate);
}

function validateSlotForReservation(slot) {
  if (!slot) {
    return "Slot not found";
  }

  const slotDate = getSlotDateString(slot.date);
  const startTime = slot.startTime ? slot.startTime.trim() : "";
  const endTime = slot.endTime ? slot.endTime.trim() : "";
  const today = getTodayDateString();
  const maxDate = getMaxSlotDateString();

  if (!slotDate || !isValidTime(startTime) || !isValidTime(endTime)) {
    return "Slot must include date, start time, and end time";
  }

  if (slotDate < today) {
    return "Cannot reserve a slot in the past";
  }

  if (slotDate > maxDate) {
    return "Cannot reserve a slot more than 7 days ahead";
  }

  if (endTime <= startTime) {
    return "Cannot reserve a slot with end time before or equal to start time";
  }

  return "";
}

const createReservation = async (req, res) => {
  try {
    if (req.user.role === "owner") {
      return res.status(403).json({ message: "Owners cannot reserve stadium slots" });
    }

    const { stadiumId, slotId } = req.body;

    if (!stadiumId || !slotId) {
      return res.status(400).json({ message: "Stadium and slot are required" });
    }

    const stadium = await Stadium.findById(stadiumId);

    if (!stadium) {
      return res.status(404).json({ message: "Stadium not found" });
    }

    const slot = stadium.reservationSlots.id(slotId);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.isReserved) {
      return res.status(400).json({ message: "Slot is already reserved" });
    }

    const validationMessage = validateSlotForReservation(slot);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const updatedStadium = await Stadium.findOneAndUpdate(
      {
        _id: stadiumId,
        reservationSlots: {
          $elemMatch: {
            _id: slotId,
            isReserved: false,
          },
        },
      },
      {
        $set: {
          "reservationSlots.$.isReserved": true,
        },
      },
      { new: true }
    );

    if (!updatedStadium) {
      return res.status(400).json({ message: "Slot is already reserved" });
    }

    let reservation;

    try {
      reservation = await Reservation.create({
        user: req.user.id,
        stadium: stadium._id,
        slotId: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    } catch (error) {
      await Stadium.updateOne(
        { _id: stadiumId, "reservationSlots._id": slotId },
        { $set: { "reservationSlots.$.isReserved": false } }
      );

      throw error;
    }

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id }).populate(
      "stadium",
      "name location reservationSlots"
    );

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own reservations" });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({ message: "Reservation already cancelled" });
    }

    const stadium = await Stadium.findById(reservation.stadium);

    if (!stadium) {
      return res.status(404).json({ message: "Stadium not found" });
    }

    await Stadium.updateOne(
      { _id: reservation.stadium, "reservationSlots._id": reservation.slotId },
      { $set: { "reservationSlots.$.isReserved": false } }
    );

    reservation.status = "cancelled";
    await reservation.save();

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReservation,
  getReservations,
  cancelReservation,
};
