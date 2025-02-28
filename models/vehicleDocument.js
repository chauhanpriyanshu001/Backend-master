const mongoose = require("mongoose");
const vehicleDocumentSchema = new mongoose.Schema(
  {
    vehicleBrand: {
      type: String,
    },
    vehicleBrandStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    vehicleColor: {
      type: String,
    },
    vehicleColorStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    vehicleNumber: {
      type: String,
    },
    vehicleNumberStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    vehicleFrontPic: {
      type: String,
    },
    vehicleFrontPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    vehicleRightPic: {
      type: String,
    },
    vehicleRightPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    vehicleLeftPic: {
      type: String,
    },
    vehicleLeftPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    registrationCertificateFrontPic: {
      type: String,
    },
    RCFrontPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    registrationCertificateBackPic: {
      type: String,
    },
    RCBackPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    vehicleModel: {
      type: String,
    },
    vehicleModelStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    permitFirstPagePic: {
      type: String,
    },
    permitFirstPagePicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    permitSecondPagePic: {
      type: String,
    },
    permitSecondPagePicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    bookingType: {
      type: String,
      enum: ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"],
    },
    serviceVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vehicle",
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "driver",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("vehicleDocument", vehicleDocumentSchema);
