const mongoose = require("mongoose");
const schema = mongoose.Schema;
const DocumentSchema = schema(
  {
    amount: { type: Number },
    payment_id: { type: String },
    status: {
      type: String,
      enum: ["PAID", "PENDING", "FAILED", "SUCCESS"],
      default: "PENDING",
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      default: "CREDIT",
    },
    driverId: { type: mongoose.Schema.ObjectId, ref: "driver" },
    
  },
  { timestamps: true }
);
module.exports = mongoose.model("driverTransaction", DocumentSchema);
