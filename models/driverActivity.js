const mongoose = require("mongoose");

const driverActivitySchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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

module.exports = mongoose.model("driverActivity", driverActivitySchema);
