const mongoose = require("mongoose");

const reservationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stadium: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stadium",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["reserved", "cancelled"],
      default: "reserved",
    },
  },
  {
    timestamps: true,
  }
);

reservationSchema.index(
  { stadium: 1, slotId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "reserved" },
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);
