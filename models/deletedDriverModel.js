const mongoose = require("mongoose");
const schema = mongoose.Schema;
var deleteDriverSchema = new schema(
  {
    name: {
      type: String,
    },
    country: {
      type: String,
    },
    email: {
      type: String,
    },
    DOB: {
      type: String,
    },

    driverEmergencyNumber: {
      type: String,
    },
    license: {
      type: String,
    },
    licenseFrontPic: {
      type: String,
    },
    licenseBackPic: {
      type: String,
    },
    dateOfExpirationLicense: {
      type: String,
    },
    driverPicWithIdentity: {
      type: String,
    },
    city: {
      type: String,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    countryCode: {
      type: String,
    },
    mobileNumber: {
      type: String,
    },
    profilePic: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
    },
    otpTimeExpire: {
      type: Number,
    },
    completeProfile: {
      type: Boolean,
      default: false,
    },
    accountVerify: {
      type: Boolean,
      default: false,
    },
    notification: {
      type: Boolean,
      default: true,
    },
    bioText: {
      type: String,
      default: "",
    },
    documentId: [
      {
        type: schema.Types.ObjectId,
        ref: "vehicleDocument",
      },
    ],
    aadharDocumentId: {
      type: schema.Types.ObjectId,
      ref: "aadharDocument",
    },
    aadharDocumentUpload: {
      type: Boolean,
      default: false,
    },
    DrivingLicenseId: {
      type: schema.Types.ObjectId,
      ref: "DrivingLicense",
    },
    DLDocumentUpload: {
      type: Boolean,
      default: false,
    },
    documentVerified: {
      type: String,
      enum: ["APPROVED", "PENDING", "REJECT"],
      default: "PENDING",
    },
    documentUpload: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
    },
    referredId: {
      type: schema.Types.ObjectId,
      ref: "user",
    },
    deviceToken: {
      type: String,
    },
    SharedContact: [
      {
        type: schema.Types.ObjectId,
        ref: "user",
      },
    ],
    deviceType: {
      type: String,
      enum: ["android", "ios"],
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "MALE",
    },
    userType: {
      type: String,
      enum: ["ADMIN", "CUSTOMER", "PROVIDER"],
      default: "PROVIDER",
    },
    bookingBlock: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCK", "DELETE"],
      default: "ACTIVE",
    },
    bookingAcceptType: {
      type: String,
      enum: ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"],
      default: "BOTH",
    },
    online: {
      type: String,
      enum: ["YES", "NO"],
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
    bookingBlock: {
      type: String,
      enum: ["UNBLOCKED", "BLOCKED"],
      default: "UNBLOCKED",
    },
    docsStatus: {
      type: String,
      enum: ["APPROVED", "PENDING"],
      default: "PENDING",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("deletedDriver", deleteDriverSchema);
