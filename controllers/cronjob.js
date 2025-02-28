let State= require('country-state-city');
const cronJob= require('cron').CronJob;
let stateModel=require("../models/selectedState");



const job = new cronJob('*/10 * * * * *', async function () {
    try {
      const findState = await stateModel.find();
      
      if (findState.length === 0) {
        const getState = await State.getStatesOfCountry("IN");
        
        if (getState.length === 0) {
          console.log("No states found");
        } else {
          for (let i = 0; i < getState.length; i++) {
            const obj = {
              state: getState[i].name,
              isoCode: getState[i].isoCode,
              countryCode: getState[i].countryCode,
              latitude: getState[i].latitude,
              longitude: getState[i].longitude
            };
            await stateModel.create(obj);
          }
        }
      } else {
        console.log("States already exist");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  });
  
  job.start();
  