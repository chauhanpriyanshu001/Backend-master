const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const DocumentSchema = schema(
  {
    cityName: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    stateCode: {
      type: String,
    },
    latitude: {
      type: String,
    },
    longitude: {
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
module.exports = mongoose.model("stateCity", DocumentSchema);
