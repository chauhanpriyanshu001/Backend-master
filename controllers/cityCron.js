const cronJob = require("cron").CronJob;
const cityModel = require("../models/stateWiseCity");
const stateModel = require("../models/selectedState");
const { City } = require("country-state-city");

const fetchDataAndSaveCities = async () => {
  try {
    const findCity = await cityModel.find().exec();

    if (findCity.length === 0) {
      const findState = await stateModel.find().exec();

      for (const state of findState) {
        const getCity = await City.getCitiesOfState("IN", state.isoCode);

        if (getCity.length === 0) {
        } else {
          const citiesToSave = getCity.map((city) => ({
            cityName: city.name,
            countryCode: city.countryCode,
            stateCode: city.stateCode,
            latitude: city.latitude,
            longitude: city.longitude,
          }));
          await cityModel.insertMany(citiesToSave); // Use insertMany to insert an array
         
        }
      }
    } else {
      console.log("Cities are already present in the database.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

// Schedule the cron job to run fetchDataAndSaveCities every 10 seconds
// new cronJob("*/10 * * * * *", fetchDataAndSaveCities, null, true).start();
