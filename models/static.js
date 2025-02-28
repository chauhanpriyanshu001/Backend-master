const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");
const staticSchema = new mongoose.Schema(
  {
    Type: {
      type: String,
      enum: ["T&C", "PRIVACY", "ABOUTUS"],
      default: "T&C",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "DELETE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);
const staticschema = mongoose.model("static", staticSchema);
module.exports = { staticschema };
staticschema.find({}, (staticErr, staticResult) => {
  if (staticErr) {
    console.log("Default static error:", staticErr);
  } else if (staticResult.length != 0) {
    console.log("Default static content already created.");
  } else {
    var object1 = {
      Type: "T&C",
      title: "Terms of Use",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget.",
    };
    var object2 = {
      Type: "PRIVACY",
      title: "Privacy Policy",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget.",
    };
    var object3 = {
      Type: "ABOUTUS",
      title: "About Us",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget.",
    };
    mongoose
      .model("static", staticSchema)
      .create(object1, object2, object3, (staticErr1, staticResult1) => {
        if (staticErr1) {
          console.log("Default static content creation error:", staticErr1);
        } else {
          console.log(
            "Default static content created successfully:",
            staticResult1
          );
        }
      });
  }
});
