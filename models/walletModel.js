const mongoose = require("mongoose");
const schema = mongoose.Schema;
const DocumentSchema = schema(
  {
    amount: { type: Number },
    driverId: { type: mongoose.Schema.ObjectId, ref: "driver" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("wallet", DocumentSchema);
