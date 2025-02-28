const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const DocumentSchema = schema(
  {
    bookingType: {
      type: String,
    },
    driverNumber: {
      type: Number,
    },
    userNumber: {
      type: Number,
    },
    userName: {
      type: String,
    },
    driverName: {
      type: String,
    },
    driverId: {
      type: schema.Types.ObjectId,
      ref: "driverId",
    },
    userId: {
      type: schema.Types.ObjectId,
      ref: "user",
      required: [true, "user Id  is required."],
    },
    acceptedFare: {
      type: Number,
    },
    paymentMethodType: {
      type: String,
      enum: ["CASH", "ONLINE"],
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    vehicleType: {
      type: schema.Types.ObjectId,
      ref: "vehicle",
      require: [true, " Please provide vehicle type id"],
    },
    bookingNumber: {
      type: Number,
    },
  },
  { timestamps: true }
);
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("commission", DocumentSchema);
