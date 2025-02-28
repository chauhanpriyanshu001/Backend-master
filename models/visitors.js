const mongoose = require("mongoose");
const visitorsCount = new mongoose.Schema({
  website: { type: Number },
  android: { type: Number },
  ios: { type: Number },
});

module.exports = mongoose.model("visitorCount", visitorsCount);
