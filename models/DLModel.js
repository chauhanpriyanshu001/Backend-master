const mongoose = require("mongoose");
//test
const DLSchema = new mongoose.Schema(
  {
    DLNumber: {
      type: String,
    },
    DLNumberStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    DLFrontPic: {
      type: String,
    },
    DLFrontPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    DLBackPic: {
      type: String,
    },
    DLBackPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    DLSelfieWithID: {
      type: String,
    },
    DLSelfieWithIDStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    DLExpireDate: {
      type: Date,
    },
    DLExpireDateStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    DLDocumentUpload: {
      type: Boolean,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "driver",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("DrivingLicense", DLSchema);
