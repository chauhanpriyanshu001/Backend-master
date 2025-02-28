const mongoose = require("mongoose");
let objectId = mongoose.Schema.Types.ObjectId;
const rideRatingSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      require: true,
    },
    comment: {
      type: String,
    },
    userId: {
      type: objectId,
      ref: "user",
      require: true,
    },
    driverId: {
      type: objectId,
      res: "driver",
      require: true,
    },
    rideId: {
      type: objectId,
      ref: "rideRequest",
      require: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("rideRating", rideRatingSchema);
