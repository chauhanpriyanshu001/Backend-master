const mongoose = require("mongoose");
const schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
var contactUsSchema = new schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please provide a valid email address.",
      ],
    },
    phone: {
      type: Number,
      required: [true, "Phone number is required."],
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: "Phone number must be a 10-digit numeric value.",
      },
    },
    subject: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

contactUsSchema.plugin(mongoosePaginate);
contactUsSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("contactUs", contactUsSchema);
