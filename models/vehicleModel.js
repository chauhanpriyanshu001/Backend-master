const mongoose = require("mongoose");
const schema = mongoose.Schema;

const createVehicleSchema = new mongoose.Schema(
  {
    vehicleName: {
      type: String,
      require: true,
    },
    driverId: [
      {
        type: schema.Types.ObjectId,
        ref: "driver",
      },
    ],
    vehiclePic: {
      type: String,
    },
    tax: {
      type: Number,
    },
    commission: {
      type: Number,
    },
    totalCommission: {
      type: Number,
    },
    driverCommission: {
      type: Number,
    },
    order: {
      type: Number,
    },
    commissionType: {
      type: String,
      enum: ["FLAT", "PERCENTAGE"],
      require: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DELETE", "BLOCK"],
      default: "ACTIVE",
    },
    bookingType: {
      type: String,
      enum: ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"],
      default: "BOTH",
    },
    deleteStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("vehicle", createVehicleSchema);
