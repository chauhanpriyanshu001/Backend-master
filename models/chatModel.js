const mongoose = require("mongoose");
const schema = mongoose.Schema;
const chatSchema = new schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
    },
    driverId: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
    },
    rideId: {
      type: mongoose.Schema.ObjectId,
      ref: "rideRequest",
    },
    messageDetail: [
      {
        sender: {
          type: String,
        },
        userName: {
          type: String,
        },
        Type: {
          type: String,
          enum: ["TEXT", "AUDIO", "VIDEO", "DOCS", "IMAGES"],
          default: "TEXT",
        },
        message: {
          type: String,
        },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCK", "DELETE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("chat", chatSchema);
