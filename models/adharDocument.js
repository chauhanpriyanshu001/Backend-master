const mongoose = require("mongoose");
const aadharSchema = new mongoose.Schema(
  {
    aadharNumber: {
      type: String,
    },
    aadharNumberStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    aadharFrontPic: {
      type: String,
    },
    aadharFrontPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    aadharBackPic: {
      type: String,
    },
    aadharBackPicStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    aadharDocumentUpload: {
      type: Boolean,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "driver",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("aadharDocument", aadharSchema);
