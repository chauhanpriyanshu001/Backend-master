const mongoose = require("mongoose");
let objectId= mongoose.Schema.Types.ObjectId;
const userRideRatingSchema = new mongoose.Schema(
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
      ref: "driver",
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
module.exports= mongoose.model("userRideRAting", userRideRatingSchema);