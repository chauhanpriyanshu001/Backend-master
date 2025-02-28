const stateCityModel = require("../models/StateCity");
module.exports = {
  createStateCity: async function (req, res) {
    try {
      const stateName = req.body.state;
      const cityName = req.body.city.cityName;
      const cityData = req.body.city.geoFencing;

      const result = await stateCityModel.findOneAndUpdate(
        { stateName },
        { $push: { Cities: { city: { cityName, geoFencing: cityData } } } },
        { new: true, upsert: true }
      );

      console.log(`your result ${result}`);
      return res.status(200).json({
        result,
        created: "success",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "something went wrong ",
        error: error,
      });
    }
  },

  getStateAndCityWithFencing: async function (req, res) {
    try {
      const data = await stateCityModel.find();
      if (!data) {
        return res.status(404).json({
          message: "No data found",
        });
      }
      return res.status(200).json({
        result: data,
      });
    } catch (error) {
      return res.status(500).json({
        message: "something went wrong ",
        error,
      });
    }
  },
  deleteStateAndCity: async function (req, res) {
    const stateCityId = req.body.stateCityId;
    const cityIdToDelete = req.body.cityIdToDelete;
    try {
      await stateCityModel.findOneAndUpdate(
        { _id: stateCityId },
        { $pull: { Cities: { _id: cityIdToDelete } } },
        { new: true }
      );
      return res.status(200).json({
        successMessage: "deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "something went wrong ",
        error,
      });
    }
  },
};
