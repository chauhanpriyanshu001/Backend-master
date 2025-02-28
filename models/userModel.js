const mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
require("mongoose-double")(mongoose);
var SchemaTypes = mongoose.Schema.Types;
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

var userSchema = new schema(
  {
    name: {
      type: String,
      trim: true,
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
    email: {
      type: String,
      lowerCase: true,
      trim: true,
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
    walletBalance: {
      type: Number,
      default: 0.0,
    },
    password: {
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
    rides: [
      {
        type: schema.Types.ObjectId,
        ref: "RideRequest", 
      },
    ],
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
    deviceToken: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "MALE",
    },
    userType: {
      type: String,
      enum: ["ADMIN", "CUSTOMER", "PROVIDER"],
      default: "CUSTOMER",
    },
    agreement: {
      type: Boolean,
      default: true,
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
    blockStatus: {
      type: String,
      enum: ["UNBLOCKED", "BLOCKED"],
      default: "UNBLOCKED",
    },
    bookingType: {
      type: String,
      enum: ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"],
      default: "BOOKNOW",
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
        type: [SchemaTypes.Double],
        default: [0.0, 0.0],
        set: function (val) {
          return val.map((coord) => Number(coord.toFixed(7)));
        },
      },
    },

    cancelRideCount: {
      type: Number,
      default: 0,
    },
    rideConfirmation: {
      type: String,
      enum: ["ACCEPTED", "INPROGRESS", "COMPLETED", "CANCEL", "NORIDE"],
    },
    userCreateDate: {
      type: String,

      default: function () {
        let date = new Date().toLocaleDateString();
        let time = new Date().toLocaleTimeString();
        return `${date},${time}`;
      },
    },
    socketId: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });
userSchema.plugin(mongoosePaginate);
userSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("user", userSchema);

mongoose
  .model("user", userSchema)
  .find({ userType: "ADMIN" }, (err, result) => {
    if (err) {
      console.log({
        responseCode: 500,
        responseMessage: "Internal server error",
        err,
      });
    } else if (result.length != 0) {
      console.log("Admin already created");
    } else {
      
      var object2 = {
        name: "Phool Singh Sotha",
        countryCode: "+91",
        mobileNumber: "9050419449",
        userType: "ADMIN",
        password: bcrypt.hashSync("PhoolSinghTexly@9449"),
        profilePic:
          "https://upendra73.s3.ap-south-1.amazonaws.com/texly/images.jpeg",
        walletBalance: 0.0,
        accountVerify: true,
        completeProfile: true,
        documentVerified: "APPROVED",
        otp: "1008",
        referralCode: "ADMINWEB",
        location: {
          type: "Point",
          coordinates: [28.5223897, 77.2849876],
        },
      };
      var object3 = {
        name: "Vijay",
        countryCode: "+91",
        mobileNumber: "9728690951",
        userType: "ADMIN",
        password: bcrypt.hashSync("VijatTexly@0951"),
        profilePic:
          "https://upendra73.s3.ap-south-1.amazonaws.com/texly/images.jpeg",
        walletBalance: 0.0,
        accountVerify: true,
        completeProfile: true,
        documentVerified: "APPROVED",
        otp: "1008",
        referralCode: "ADMINWEB",
        location: {
          type: "Point",
          coordinates: [28.5223897, 77.2849876],
        },
      };
      var object4 = {
        name: "Suresh",
        countryCode: "+91",
        mobileNumber: "9991339024",
        userType: "ADMIN",
        password: bcrypt.hashSync("SureshTexly@9024"),
        profilePic:
          "https://upendra73.s3.ap-south-1.amazonaws.com/texly/images.jpeg",
        walletBalance: 0.0,
        accountVerify: true,
        completeProfile: true,
        documentVerified: "APPROVED",
        otp: "1008",
        referralCode: "ADMINWEB",
        location: {
          type: "Point",
          coordinates: [28.5223897, 77.2849876],
        },
      };
      var object5 = {
        name: "Jasbir Singh",
        countryCode: "+91",
        mobileNumber: "81949551",
        userType: "ADMIN",
        password: bcrypt.hashSync("JasbirSingtTexly@9024"),
        profilePic:
          "https://upendra73.s3.ap-south-1.amazonaws.com/texly/images.jpeg",
        walletBalance: 0.0,
        accountVerify: true,
        completeProfile: true,
        documentVerified: "APPROVED",
        otp: "1008",
        referralCode: "ADMINWEB",
        location: {
          type: "Point",
          coordinates: [28.5223897, 77.2849876],
        },
      };
      mongoose
        .model("user", userSchema)
        .create(
          object2,
          object3,
          object4,
          object5,
          (adminErr, adminResult) => {
            if (adminErr) {
              console.log({
                responseCode: 500,
                responseMessage: "Internal server error",
                adminErr,
              });
            } else {
              console.log({
                responseCode: 200,
                responseMessage: "Admin created successfully",
                adminResult,
              });
            }
          }
        );
    }
  });
