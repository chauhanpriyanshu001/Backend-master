const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const geoFencingSchema = new Schema({
  lat: {
    type: Number,
  },
  lng: {
    type: Number,
  },
});

const citySchema = new Schema({
  cityName: { type: String, unique: true },
  geoFencing: [geoFencingSchema],
});

const stateSchema = new Schema({
  Cities: [
    {
      city: citySchema,
      default: {},
    },
  ],
  stateName: {
    type: String,
    required: [true, "state Name is required"],
    unique: true,
  },
});

const StateCity = mongoose.model("cityState", stateSchema);

module.exports = StateCity;
