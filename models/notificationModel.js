const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

var notificationModel = new Schema(
  {
    userId: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    requestId: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "rideRequest",
    },
    driverId: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    notificationType: {
      type: String,
    },
    date: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "DELETE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

notificationModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("notification", notificationModel);
