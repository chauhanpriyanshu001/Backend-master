const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const { Schema } = mongoose;

const transactionStatus = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "driver",
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
    },
    id: {
      type: String,
    },
    amount: {
      type: Number,
    },
    paymentMode: {
      type: String,
      enum: ["CASH", "WALLET"],
    },
    transactionStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);
transactionStatus.plugin(mongoosePaginate);
module.exports = mongoose.model("bookingPayment", transactionStatus);
