const mongoose = require("mongoose");

const driverAllActivityDateAndTimeSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "driver",
    },
    activeDate: {
      type: String,
      default: new Date(),
    },
    activeTimes: {
      type: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AllDriverActivityDateAndTime",
  driverAllActivityDateAndTimeSchema
);
