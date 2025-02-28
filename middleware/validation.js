const mongoose = require("mongoose");
const contactUsModel = require("../models/contactUsModel");

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

const isValidBody = function (requestBody) {
  return Object.keys(requestBody).length > 0;
};

const isValidObjectId = (ObjectId) => {
  return mongoose.Types.ObjectId.isValid(ObjectId);
};

const isValidEmail = function (value) {
  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
    return false;
  }
  return true;
};

const isValidNumber = function (value) {
  if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(value)) {
    return false;
  }
  return true;
};

const isValidName = function (value) {
  if (!/^[A-Za-z ]+$/.test(value.trim())) {
    return false;
  }
  return true;
};
const validContactUs = async function (req, res, next) {
  try {
    let body = JSON.parse(JSON.stringify(req.body));
    if (Object.keys(body).length == 0) {
      return res
        .status(400)
        .send({ status: false, msg: "Plz Enter Data Inside Body !!!" });
    }

    const { phone, email } = body;

    const findPhone = await contactUsModel.findOne({ phone: phone });
    if (findPhone) {
      return res.status(400).send({
        status: false,
        msg: "Contact Number is Already Exists, Plz Enter Another One !!!",
      });
    }
    if (!phone) {
      return res
        .status(400)
        .send({ status: false, msg: "Plz Enter phone In Body !!!" });
    }

    if (!email) {
      return res.status(400).send({
        status: false,
        msg: "Plz Enter Email In Body !!!",
      });
    }

    next();
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};

module.exports = {
  isValid,
  isValidBody,
  isValidObjectId,
  isValidEmail,
  isValidNumber,
  isValidName,
  validContactUs,
};
