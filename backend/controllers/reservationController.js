const Reservation = require("../models/Reservation");
const Stadium = require("../models/Stadium");

const createReservation = async (req, res) => {
  try {
    if (req.user.role === "owner") {
      return res.status(403).json({ message: "Owners cannot reserve stadium slots" });
    }

    const { stadiumId, slotId } = req.body;

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

    slot.isReserved = true;
    await stadium.save();

    const reservation = await Reservation.create({
      user: req.user.id,
      stadium: stadium._id,
      slotId: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

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
      return res.status(401).json({ message: "Not authorized" });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({ message: "Reservation already cancelled" });
    }

    const stadium = await Stadium.findById(reservation.stadium);

    if (!stadium) {
      return res.status(404).json({ message: "Stadium not found" });
    }

    const slot = stadium.reservationSlots.id(reservation.slotId);

    if (slot) {
      slot.isReserved = false;
      await stadium.save();
    }

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
