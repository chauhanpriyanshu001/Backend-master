const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const DocumentSchema = schema(
  {
    userId: {
      type: schema.Types.ObjectId,
      ref: "user",
    },
    driverCash: {
      type: Number,
      default: 0,
    },
    adminCash: {
      type: Number,
      default: 0,
    },
    totalCash: {
      type: Number,
      default: 0,
    },
    totalCashbooking: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "DELETE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("cashInHand", DocumentSchema);
