const mongoose = require("mongoose");

const reservationSlotSchema = mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
  },
  isReserved: {
    type: Boolean,
    default: false,
  },
});

const stadiumSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reservationSlots: [reservationSlotSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Stadium", stadiumSchema);
