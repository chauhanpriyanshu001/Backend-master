const mongoose = require("mongoose");
const schema = mongoose.Schema;
require("mongoose-double")(mongoose);
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
var SchemaTypes = mongoose.Schema.Types;

var driverSchema = new schema(
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
      default: 0.0,
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
    agreement: {
      type: Boolean,
      default: true,
    },
    bioText: {
      type: String,
      default: "",
    },
    rides: [
      {
        type: schema.Types.ObjectId,
        ref: "RideRequest",
      },
    ],
    documentId: {
      type: schema.Types.ObjectId,
      ref: "vehicleDocument",
    },
    aadharDocumentId: {
      type: schema.Types.ObjectId,
      ref: "aadharDocument",
    },
    vehicleType: {
      type: schema.Types.ObjectId,
      ref: "vehicle",
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
      enum: ["application", "website"],
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "MALE",
    },
    userType: {
      type: String,
      enum: "PROVIDER",
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
      default: "NO",
    },
    currentLocation: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [SchemaTypes.Double],
        default: [0.0, 0.0],
        set: function (val) {
          return val.map((coord) => Number(coord.toFixed(7)));
        },
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
    requestRides: {
      type: [schema.Types.ObjectId],
      ref: "rideRequest",
    },
    cancelRideCount: {
      type: Number,
      default: 0,
    },
    InRideStatus: {
      type: String,
      enum: ["ONGOING", "WAITFORRIDE"],
      default: "WAITFORRIDE",
    },
    // freight and later ride list
    LaterRideTime: {
      type: [
        {
          rideId: {
            type: schema.Types.ObjectId,
            ref: "rideRequest",
          },
          rideStartTime: {
            type: Date,
          },
          rideEndTime: {
            type: Date,
          },
        },
      ],
    },
    socketId: {
      type: String,
    },
  },

  { timestamps: true }
);

driverSchema.index({ location: "2dsphere" });
driverSchema.plugin(mongoosePaginate);
driverSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("driver", driverSchema);
