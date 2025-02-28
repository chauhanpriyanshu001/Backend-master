const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
var EmergencyContactSchema = new schema(
  {
    firstPhone: {
      type: Number,
      required: [true, "Phone number is required."],
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: "Phone number must be a 10-digit numeric value.",
      },
    },
    secondPhone: {
      type: Number,
    },
  },
  { timestamps: true }
);

EmergencyContactSchema.plugin(mongoosePaginate);
EmergencyContactSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("EmergencyContact", EmergencyContactSchema);
