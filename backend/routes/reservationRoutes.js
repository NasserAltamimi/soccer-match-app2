const express = require("express");
const {
  getReservations,
  createReservation,
  cancelReservation,
} = require("../controllers/reservationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getReservations);
router.post("/", protect, createReservation);
router.delete("/:id", protect, cancelReservation);
router.put("/:id/cancel", protect, cancelReservation);

module.exports = router;
