const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const DocumentSchema = schema(
  {
    rideId: {
      type: mongoose.Schema.ObjectId,
      ref: "rideRequest",
    },
    orderPlace: {
      type: String,
    },
    bookingConfirm: {
      typ: String,
    },
    startLocation: {
      type: String,
    },
    endLocation: {
      type: String,
    },
    currentLocation: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    destinationLocation: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "DELETE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("rideSummary", DocumentSchema);
