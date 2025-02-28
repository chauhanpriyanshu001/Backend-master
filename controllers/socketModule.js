const userModel = require("../models/userModel"); 
const driverModel = require("../models/driverModel"); 
 
 async function updateUserSocketId(userId, userType, socketId) {
    try {
      if(userType == "driver") {
        const updatedUser = await driverModel.findByIdAndUpdate(
        { _id: userId },
        { socketId: socketId },
        { new: true }
      );
  
      if (updatedUser) {
        console.log('driver socketId updated:', updatedUser);
      } else {
        console.error('User not found or socketId not updated.');
      }
    }

    if(userType == "user") {
        const updatedUser = await userModel.findByIdAndUpdate(
        { _id: userId },
        { socketId: socketId },
        { new: true }
      );
  
      if (updatedUser) {
        console.log('User socketId updated:', updatedUser);
      } else {
        console.error('User not found or socketId not updated.');
      }
    }


    } catch (error) {
      console.error('Error updating user socketId:', error);
    }
  }
  
  module.exports = { updateUserSocketId };