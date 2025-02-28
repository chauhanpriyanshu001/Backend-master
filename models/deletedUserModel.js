const mongoose = require("mongoose");
const schema = mongoose.Schema;
var deleteUserSchema = new schema(
  {
    name: {
      type: String,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    address: {
      type: String,
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
      type: String,
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
      enum: ["android", "ios", "web", "windows", "mac", "linux"],
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "MALE",
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
    bookingType: {
      type: String,
      enum: ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"],
      default: "BOTH",
    },
    online: {
      type: Boolean,
      default: true,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("deletedUser", deleteUserSchema);
