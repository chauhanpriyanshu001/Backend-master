const mongoose = require("mongoose");
const schema = mongoose.Schema;
require("mongoose-double")(mongoose);
var SchemaTypes = mongoose.Schema.Types;
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const DocumentSchema = schema(
  {
    userId: {
      type: schema.Types.ObjectId,
      ref: "user",
      required: [true, "user Id  is required."],
    },
    driverId: {
      type: schema.Types.ObjectId,
      ref: "driverId",
    },
    userName: {
      type: String,
    },
    userNumber: {
      type: Number,
    },
    driverName: {
      type: String,
    },
    driverNumber: {
      type: Number,
    },
    userFares: {
      type: Number,
    },
    acceptedFare: {
      type: Number,
    },
    driversWithFares: {
      type: [
        {
          driverId: {
            type: schema.Types.ObjectId,
            ref: "driver",
          },
          fare: {
            type: Number,
          },
        },
      ],
      default: [],
    },
    rideStartDateTime: {
      type: Date,
    },
    //request date time mean The time which  book later or freight he want go
    requestDateTime: {
      type: Date,
      default: new Date(),
    },
    description: {
      type: String,
    },
    acceptedDriver: {
      type: schema.Types.ObjectId,
      ref: "driver",
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
        type: [SchemaTypes.Double],
        default: [0.0, 0.0],
        set: function (val) {
          return val.map((coord) => parseFloat(coord.toFixed(7)));
        },
      },
    },
    destinationLocation: {
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
    auctionStatus: {
      type: String,
      enum: ["START", "CLOSED"],
      default: "START",
    },
    paymentMethodType: {
      type: String,
      enum: ["CASH", "ONLINE"],
    },
    //Pending ride status mean ride yet not started
    //started mean driver start to move toward user
    rideStatus: {
      type: String,
      enum: [
        "PENDING",
        "ONTHEWAY",
        "ARRIVED",
        "STARTED",
        "ONGOING",
        "COMPLETED",
      ],
      default: "PENDING",
    },
    //inactive means eighter automatic inactive or ride completed
    BookingStatus: {
      type: String,
      enum: ["CANCELLED", "ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    requestAmount: {
      type: Number,
    },
    bookingType: {
      type: String,
      enum: ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"],
      default: "BOOKNOW",
    },
    returnDateTime: {
      type: String,
    },
    passengerMore: {
      type: Number,
    },
    vehicleType: {
      type: schema.Types.ObjectId,
      ref: "vehicle",
      require: [true, " Please provide vehicle type id"],
    },
    vehicleName: {
      type: String,
    },
    goodsPic: {
      type: String,
    },
    rideOtp: {
      type: String,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    bookingNumber: {
      type: Number,
    },
    rating: {
      type: Number,
    },
    comment: {
      type: String,
    },
    feedback: {
      type: String,
    },
    cancelMessage: {
      type: String,
    },
    //***********************************Freight***********************************//
    goodsType: {
      type: String,
      validate: {
        validator: function (value) {
          const validGoodsTypes = [
            "LIVEANIMALS", // Asses, cows, sheep, goats, poultry, etc.
            "MEAT", //Fresh and frozen meat of sheep, cows, goats, pigs, horses, etc.
            "FISH", //Fresh or frozen fish
            "NATURALPRODUCTS", //Honey, fresh and pasteurized milk, cheese, eggs, etc.
            "TREES&PLANTS", //Bulbs, roots, flowers, foliage, etc.
            "VEGETABLES", //	Tomatoes, potatoes, onions, etc.
            "FRUITS", //Bananas, grapes, apples, etc.
            "DRYFRUITS", //Cashew nuts, walnuts, etc.
            "TEA", //tea leaves, etc.
            "COFFEE", //Coffee beans,
            "SPICES", //  turmeric, ginger,
            "GRAINS", // Wheat, rice, oats, barley, etc.
            "MILLING", // Flours of different types
            "SEEDS", // 	Flower seeds, oil seeds, cereal husks, etc.
            "SUGAR", // Sugar, jaggery, etc.
            "WATER", // Mineral water, tender coconut water, etc.
            "BAKED", // Bread, pizza base, puffed rice, etc.
            "FOSSILFUELS", // Electrical energy
            "DRUGS&PHARMACEUTICALS", // Human blood, contraceptives, etc.
            "FERTILIZERS", // Goods and organic manure
            "BEAUTYPRODUCTS", //Bindi, kajal, kumkum, etc.
            "WASTE", // Sewage sludge, municipal waste, etc.
            "ORNAMENTS", // Plastic and glass bangles, etc.
            "NEWSPRINT", // Judicial stamp paper, envelopes, rupee notes, etc.
            "PRINTEDITENS", // Printed books, newspapers, maps, etc.
            "FABRICS", // Raw silk, silkworm cocoon, khadi, etc.
            "HANDTOOLS", // Spade, hammer, etc.
            "POTTERY", // Earthen pots, clay lamps, etc
            "other",
          ];
          if (!validGoodsTypes.includes(value)) {
            // User can enter a custom string if not in enum
            return typeof value === "string";
          }
          return true;
        },
        message: "Invalid goods type",
      },
    },

    goodsWeight: {
      type: String,
    },
    //***********************************Freight***********************************//

    //***********************************Payment Field***********************************//
    paymentMode: {
      type: String,
      enum: ["CASH", "WALLET"],
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    //***********************************Payment Field***********************************//
  },
  { timestamps: true }
);
DocumentSchema.plugin(mongoosePaginate);
DocumentSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("rideRequest", DocumentSchema);
