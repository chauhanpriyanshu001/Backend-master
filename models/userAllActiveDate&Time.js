const mongoose = require("mongoose");

const userAllActivityDateAndTimeSchema = new mongoose.Schema(
  {
    userId: {
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

module.exports = mongoose.model(
  "AllUserActivityDateAndTime",
  userAllActivityDateAndTimeSchema
);
