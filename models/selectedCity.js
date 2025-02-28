const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const DocumentSchema = schema(
  {
    city: [
      {
        cityName: { type: String },
      },
    ],
    state: {
      type: schema.Types.ObjectId,
      ref: "selectedState",
    },
    stateName: {
      type: String,
    },
    cityName: {
      type: String,
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
module.exports = mongoose.model("selectedCity", DocumentSchema);
