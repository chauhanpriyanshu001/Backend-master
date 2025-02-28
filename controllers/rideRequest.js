const rideModel = require("../models/rideRequest");
const userModel = require("../models/userModel");
const driverModel = require("../models/driverModel");
const rideRequestModel = require("../models/rideRequest");
const selectedCity = require("../models/selectedCity");
const commonFunction = require("../helper/commonFunction");
const { ErrorCode, SuccessCode } = require("../helper/statusCode");
const { SuccessMessage, ErrorMessage } = require("../helper/message");
const { commonResponse: response } = require("../helper/commonResponseHandler");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const vehicleModel = require("../models/vehicleModel");
const cashInHand = require("../models/cashInHand");
const transaction = require("../models/transaction");
const bookingPayment = require("../models/bookingPayment");
const userTransaction = require("../models/transaction");
const {
  broadcastMessage,
  updateBidToDriver,
  updateBidToOtherDriver,
  fetchOngoingRideDriver,
  updateRideStatus,
  newRideComing,
} = require("./socketHandler");

module.exports = {
  getRideByRideId: async function (req, res) {
    try {
      const rideId = req.params.rideId;
      const ride = await rideRequestModel
        .findOne({
          _id: rideId,
        })
        .populate({
          path: "driversWithFares.driverId",
          select: "-rides",
          populate: {
            path: "documentId",
            model: "vehicleDocument",
          },
        })
        .populate({
          path: "userId",
          select:"name profilePic mobileNumber"
          // Populate the userId field
        });
      if (!ride) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "",
        });
      }
      return res.status(200).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.DATA_FOUND,
        result: ride,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  acceptRideByRideId: async function (req, res) {
    try {
      const driverNumber = req.body.driverNumber;
      const driverName = req.body.driverName;
      const userId = req.userId;
      const rideId = req.params.rideId;
      const driverId = req.body.driverId;
      const acceptedFare = req.body.acceptedFare;
      const user = await userModel.findById({ _id: userId });
      if (!user) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "User Not found",
          result: error.message,
        });
      }

      const randomNumber = Math.floor(Math.random() * 9000) + 1000;
      const update = {
        rideOtp: randomNumber,
        auctionStatus: "CLOSED",
        acceptedDriver: driverId,
        acceptedFare,
        driverName: driverName,
        driverNumber: driverNumber,
      };
      // Find and update the ride
      const updatedRide = await rideRequestModel
        .findOneAndUpdate({ _id: rideId }, { $set: update }, { new: true })
        .populate("acceptedDriver");

      if (!updatedRide) {
        return res.status(500).json({
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          ErrorCode: ErrorCode.SOMETHING_WRONG,
        });
      }
      // Push the ride into the driver's rides array at the top
      const updatedDriver = await driverModel.findByIdAndUpdate(
        driverId,
        { $push: { rides: { $each: [rideId], $position: 0 } } },
        { new: true }
      );

      if (updatedDriver) {
        const message = "BidAccepted";
        const io = req.app.get("socketio");
        updateBidToDriver(io, message, updatedDriver.socketId);
        fetchOngoingRideDriver(io, "ONGOINGRIDE", updatedDriver.socketId);
      }

      if (updatedRide && updatedRide.driversWithFares) {
        // Iterate through driversWithFares and emit message to each driver's socket
        for (const driverWithFare of updatedRide.driversWithFares) {
          const driverId = driverWithFare.driverId;
          const message = "OtherDriverBidAccepted";
          const io = req.app.get("socketio");
          // Check if the driverId has a valid socketId in your user model
          const driverData = await driverModel.findById(driverId);
          if (driverData && driverData.socketId) {
            updateBidToOtherDriver(io, message, driverData.socketId);
            console.log(`Sent bid message to driver with ID ${driverId}`);
          } else {
            console.log(`No valid socket found for driver with ID ${driverId}`);
          }
        }
      }

      // Ride add to driver and user with start and end time
      if (updatedRide?.bookingType !== "BOOKNOW") {
        const extendedTime = updatedRide?.returnDateTime
          ? updatedRide?.returnDateTime
          : new Date(Date.now() + 2 * 60 * 60 * 1000);
        const rideObject = {
          rideId: updatedRide?._id,
          rideStartTime: updatedRide?.requestDateTime,
          rideEndTime: extendedTime,
        };
        await driverModel.findByIdAndUpdate(driverId, {
          $push: rideObject,
        });
        await userModel.findByIdAndUpdate(userId, {
          $push: rideObject,
        });
      }
      if (!updatedDriver) {
        return res.status(500).json({
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          ErrorCode: ErrorCode.SOMETHING_WRONG,
        });
      }
      if (!updatedDriver) {
        return res.status(500).json({
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          ErrorCode: ErrorCode.SOMETHING_WRONG,
        });
      }
      return res.status(200).json({
        SuccessMessage: SuccessMessage.UPDATE_SUCCESS,
        SuccessCode: SuccessCode.UPDATE_SUCCESS,
        result: updatedRide,
      });
    } catch (error) {
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  getRideForDriver: async function (req, res) {
    try {
      const driverId = req.driverId;
      const currentTime = new Date();
      const thirtyMinutesLater = new Date(currentTime.getTime() + 30 * 60000);

      let ride = await rideRequestModel
        .findOne({
          acceptedDriver: driverId,
          rideStatus: { $ne: "COMPLETED" },
          auctionStatus: { $ne: "CLOSE" },
          $or: [
            {
              bookingType: "BOOKNOW",
            },
            {
              bookingType: { $in: ["BOOKLATER", "FREIGHT"] },
              requestDateTime: { $lte: currentTime, $gt: thirtyMinutesLater },
            },
          ],
        })
        .sort({ requestDateTime: 1 }); // Sort by requestDateTime to get the earliest relevant ride

      if (!ride) {
        // Fetch the last ride details if no BOOKLATER or FREIGHT ride is available
        let lastRide = await rideRequestModel
          .findOne({
            acceptedDriver: driverId,
            rideStatus: { $ne: "COMPLETED" },
          })
          .sort({ createdAt: -1 });

        if (!lastRide) {
          return res.status(404).json({
            responseCode: ErrorCode.NOT_FOUND,
            responseMessage: ErrorMessage.NOT_FOUND,
          });
        }

        return res.status(200).json({
          message:
            "Last ride details as no BOOKLATER or FREIGHT ride available",
          rideId: lastRide._id,
          rideDetails: lastRide,
        });
      }

      return res.status(200).json({
        rideId: ride._id,
        rideDetails: ride,
      });
    } catch (error) {
      console.error("Error in getRideForDriver:", error);
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
      });
    }
  },
  getMyOnGoingRide: async function (req, res) {
    try {
      const driverId = req.driverId;
      const currentTime = moment();
      const timeThreshold = 15;
      const ride = await rideRequestModel
        .findOne({
          acceptedDriver: driverId,
          rideStatus: {
            $in: ["PENDING", "ARRIVED", "ONTHEWAY", "STARTED", "ONGOING"],
          },
          // $or: [
          //   { bookingType: "BOOKLATER" },
          //   { bookingType: "FREIGHT" },
          // ],
          // $and: [
          //   {
          //     $or: [
          //       { bookingType: { $ne: "BOOKNOW" } },
          //       { rideStartDateTime: { $exists: false } },
          //     ],
          //   },
          //   {
          //     rideStartDateTime: {
          //       $gte: currentTime,
          //       $lte: currentTime.clone().add(timeThreshold, 'minutes'),
          //     },
          //   },
          // ],
        })
        .populate({
          path: "driversWithFares.driverId",
          select: "-rides",
          populate: {
            path: "documentId",
            model: "vehicleDocument",
          },
        }).populate({
          path: "userId",
          select:"name profilePic mobileNumber"
          // Populate the userId field
        });
      if (!ride) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "",
        });
      }
      return res.status(200).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.DATA_FOUND,
        result: ride,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },

  getRideForUser: async function (req, res) {
    try {
      const userId = req.userId;
      const ride = await rideRequestModel
        .findOne({
          $and: [
            { acceptedUser: userId },
            { rideStatus: { $ne: "COMPLETED" } },
          ],
        })
        .sort({ createdAt: -1 });
      if (!ride) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
        });
      }
      return res.status(200).json({
        rideId: ride._id,
        rideDetails: ride,
      });
    } catch (error) {
      console.log("Error in getRideForUser:", error);
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
      });
    }
  },
  getUserRideHistory: async function (req, res) {
    try {
      const userId = req.userId;
      const ride = await rideRequestModel
        .find({
          userId: userId,
        })
        .sort({ createdAt: -1 });
      if (!ride) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
        });
      }
      return res.status(200).json({
        rideList: ride,
      });
    } catch (error) {
      console.log("Error in getHistory:", error);
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
      });
    }
  },
  getDriverRideHistory: async function (req, res) {
    try {
      const driverId = req.driverId;
      const ride = await rideRequestModel
        .findOne({
          acceptedDriver: driverId,
        })
        .sort({ createdAt: -1 });
      if (!ride) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
        });
      }
      return res.status(200).json({
        rideList: ride,
      });
    } catch (error) {
      console.log("Error in getHistory:", error);
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
      });
    }
  },
  startDriverJourney: async function (req, res) {
    try {
      const driverId = req.body.driverId;
      const rideId = req.body.rideId;
      const rideStatusUpdate = req.body.rideStatus;
      const updatedRide = await rideRequestModel.findOneAndUpdate(
        { _id: rideId, acceptedDriver: driverId },
        { $set: { rideStatus: rideStatusUpdate } },
        { new: true }
      );

      if (!updatedRide) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Ride not found or not assigned to the driver",
        });
      }

      if (updatedRide) {
        const userData = await userModel.findById(updatedRide.userId);
        const message = rideStatusUpdate;
        const io = req.app.get("socketio");
        updateRideStatus(io, message, userData.socketId);
      }

      return res.status(200).json({
        SuccessMessage: SuccessMessage.UPDATE_SUCCESS,
        SuccessCode: SuccessCode.UPDATE_SUCCESS,
        result: updatedRide,
      });
    } catch (error) {
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  cancelRideByUser: async function (req, res) {
    try {
      const rideId = req.body.rideId;
      const data = req.body;
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          responseCode: 404,
          responseMessage: "User Does not exist",
        });
      }
      if (user?.cancelRideCount >= 2) {
        await userModel.findByIdAndUpdate(userId, {
          $set: { blockStatus: "BLOCKED", cancelRideCount: 0 },
        });
      }
      unblockUserAfterDelay(userId);
      const rideUpdate = {
        feedback: data.feedback,
        BookingStatus: "CANCELLED",
        cancelMessage: data.cancelMessage,
      };
      const ride = await rideModel.findByIdAndUpdate(
        rideId,
        {
          $set: rideUpdate,
        },
        { new: true }
      );
      if (!ride) {
        return res.status(404).json({
          responseCode: 404,
          responseMessage:
            "Ride does't exist or Something went wrong on update ",
        });
      }

      if (updatedRide) {
        const userData = await driverModel.findById(ride.acceptedDriver);
        const message = "Cancelled";
        const io = req.app.get("socketio");
        updateRideStatus(io, message, userData.socketId);
      }

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Ride Updated successfully",
        result: ride,
      });
    } catch (error) {
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  cancelRideByDriver: async function (req, res) {
    try {
      const rideId = req.body.rideId;
      const data = req.body;
      const driverId = req.driverId;
      const driver = await driverModel.findById(driverId);
      if (!driver) {
        return res.status(404).json({
          responseCode: 404,
          responseMessage: "driver Does not exist",
        });
      }
      if (driver?.cancelRideCount >= 2) {
        await driverModel.findByIdAndUpdate(userId, {
          $set: { bookingBlock: "BLOCKED", cancelRideCount: 0 },
        });
      }
      unblockDriverAfterDelay(driverId);
      const rideUpdate = {
        feedback: data.feedback,
        BookingStatus: "CANCELLED",
        cancelMessage: data.cancelMessage,
      };
      const ride = await driverModel.findByIdAndUpdate(
        rideId,
        {
          $set: rideUpdate,
        },
        { new: true }
      );
      if (!ride) {
        return res.status(404).json({
          responseCode: 404,
          responseMessage:
            "Ride does't exist or Something went wrong on update ",
        });
      }
      if (updatedRide) {
        const userData = await userModel.findById(ride.userId);
        const message = "Cancelled";
        const io = req.app.get("socketio");
        updateRideStatus(io, message, userData.socketId);
      }
      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Ride Updated successfully",
        result: ride,
      });
    } catch (error) {
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  otpVerification: async function (req, res) {
    try {
      const rideId = req.body.rideId;
      const otp = req.body.otp;

      const ride = await rideRequestModel.findById(rideId);
      if (!ride) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: `Ride not found with ${rideId}`,
        });
      }

      if (otp === ride.rideOtp) {
        // OTP is verified, update ride status to ONGOING
        const updatedRide = await rideRequestModel
          .findOneAndUpdate(
            { _id: rideId },
            {
              otpVerified: true,
              rideStatus: "ONGOING",
            },
            { new: true }
          )
          .populate("acceptedDriver");

        // Update driver model with the ongoing ride status
        const updatedDriver = await driverModel.findOneAndUpdate(
          { _id: ride.acceptedDriver },
          { $set: { InRideStatus: "ONGOING" } },
          { new: true }
        );

        return res.status(200).json({
          SuccessMessage: SuccessMessage.UPDATE_SUCCESS,
          result: updatedRide,
        });
      }

      return res.status(ErrorCode.WENT_WRONG).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: `Your ${otp} is invalid`,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },

  completeRideReq: async function (req, res) {
    try {
      const driverId = req.driverId;
      const rideId = req.params.rideId;

      const check = await driverModel.findById(driverId);
      if (!check) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Driver not found",
        });
      }

      const update = {
        rideStatus: "COMPLETED",
        BookingStatus: "INACTIVE",
      };

      const updatedRide = await rideRequestModel.findOneAndUpdate(
        {
          _id: rideId,
          rideStatus: "ONGOING",
        },
        { $set: update },
        { new: true }
      );

      if (!updatedRide) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: "Unable to update ride ",
        });
      }

      // Update driver model with the WAITFORRIDE status
      const updatedDriver = await driverModel.findOneAndUpdate(
        { _id: driverId },
        { $set: { InRideStatus: "WAITFORRIDE" } },
        { new: true }
      );

      if (updatedRide) {
        const userData = await userModel.findById(updatedRide.userId);
        const message = "Completed";
        const io = req.app.get("socketio");
        updateRideStatus(io, message, userData.socketId);
      }

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Ride completed successfully",
        result: updatedRide,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },

  updatePayment: async function (req, res) {
    try {
      const userId = req.userId;
      const rideId = req.params.rideId;

      const check = await userModel.findById(userId);
      if (!check) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "User not found",
        });
      }

      const update = {
        paymentStatus: "SUCCESS",
      };

      const updatedRide = await rideRequestModel.findOneAndUpdate(
        {
          _id: rideId,
          
        },
        { $set: update },
        { new: true }
      );

      if (!updatedRide) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: "Unable to update ride ",
        });
      }

  
     
      if (updatedRide) {
        const userData = await driverModel.findById(updatedRide.acceptedDriver);
        const message = "PAYED";
        const io = req.app.get("socketio");
        updateRideStatus(io, message, userData.socketId);
      }

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Payed successfully",
        result: updatedRide,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  
  createRideRequest: async function (req, res) {
    try {
      let data = req.body;
      data.userId = req.userId;

      // Modify to include bookingNumber logic
      let lastRide = await rideModel.findOne().sort({ createdAt: -1 });
      let lastBookingNumber = lastRide ? lastRide.bookingNumber : 1000;

      // Increment bookingNumber for the current ride
      data.bookingNumber = lastBookingNumber + 1;

      let currentDate = new Date();
      currentDate.setMinutes(currentDate.getMinutes() + 5);
      data.rideStartDateTime = currentDate;
      let checkBlock = await userModel.findById(data.userId);
      if (!checkBlock) {
        return res.status(404).json({ message: " user not found " });
      }
      if (checkBlock.status === "BLOCK") {
        return res.status(403).json({
          responseCode: 403,
          responseMessage:
            "You are blocked due to canceling 3 rides. You will be unblocked tomorrow.",
        });
      }

      let createdData = await rideRequestModel.create(data);

      if (!createdData) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      }

      // Update user model with the last ride details
      let updatedUser = await userModel.findByIdAndUpdate(
        data.userId,
        {
          $push: {
            rides: {
              $each: [createdData._id],
              $position: 0,
            },
          },
        },
        { new: true }
      );


      // vehicleType
      const vehicleType = createdData.vehicleType;
      try{
       
        const drivers = await driverModel.find({
          vehicleType: vehicleType
        });
       
        drivers.forEach(driver => {
          const message = "New Ride is Coming";
          const io = req.app.get("socketio");
          // Broadcast the message to all connected drivers
          newRideComing(io, message,driver.socketId);
        });

      } catch(error) {

      }



      setInactiveAfterDelay(createdData._id);
   



      
      return res.json({
        responseCode: SuccessCode.CREATION,
        responseMessage: "Your ride has been created successfully",
        result: createdData,
      });
    } catch (error) {
      return res.json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getRide: async function (req, res) {
    try {
      let userId = req.params.userId;

      let arr = [
        {
          $match: { userId: userId, status: { $ne: "DELETE" } },
        },

        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDataWithRide",
          },
        },
        {
          $unwind: {
            path: "$userDataWithRide",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];
      let finalData = await rideRequestModel.aggregate(arr);
      if (finalData.length === 0) {
        finalData = await rideRequestModel.aggregate(arr);
        if (finalData !== 0) {
          return res.status(ErrorCode.NOT_FOUND).json({
            responseCode: ErrorCode.NOT_FOUND,
            responseMessage: ErrorMessage.NOT_FOUND,
            result: "",
          });
        }
      }
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        result: finalData,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  updateRideRequest: async function (req, res) {
    try {
      let requestAmount = req.body.requestAmount;
      let userId = req.userId;

      let updatedData = await rideRequestModel.findOneAndUpdate(
        { userId: userId, status: { $ne: "DELETE" } },
        {
          $set: {
            requestAmount,
            driverId: mongoose.Types.ObjectId("654c84a2a127d52cc7e39c5b"),
          },
        },
        { new: true }
      );

      if (!updatedData) {
        response(
          res,
          ErrorCode.WENT_WRONG,
          { error },
          ErrorMessage.SOMETHING_WRONG
        );
      }
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        result: updatedData,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  deleteRideRequestAndCancel: async function (req, res) {
    try {
      let userId = req.userId;

      let updatedData = await rideRequestModel.findOneAndUpdate(
        { userId: userId },
        { status: "DELETE" }
      );
      if (updatedData.status != "DELETE") {
        response(
          res,
          ErrorCode.WENT_WRONG,
          { error },
          ErrorMessage.SOMETHING_WRONG
        );
      }
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        result: "Ride successfully delete",
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  serviceAvailable: async (req, res) => {
    try {
      let userData = await userModel.findOne({
        _id: req.userId,
        userType: "CUSTOMER",
      });
      if (!userData) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      } else {
        let city, city1, state;
        let smsResult = await commonFunction.findLocation(
          req.body.latitude,
          req.body.longitude
        );
        for (
          let i = 0;
          i < smsResult.results[0].address_components.length;
          i++
        ) {
          if (
            smsResult.results[0].address_components[i].types[0] === "locality"
          ) {
            city = smsResult.results[0].address_components[i].long_name;
            console.log("===========>", city);
          }
          if (
            smsResult.results[0].address_components[i].types[0] ===
            "administrative_area_level_2"
          ) {
            city1 = smsResult.results[0].address_components[i].long_name;
            console.log("===========>", city1);
          }
          if (
            smsResult.results[0].address_components[i].types[0] ===
            "administrative_area_level_1"
          ) {
            state = smsResult.results[0].address_components[i].long_name;
          }
        }
        console.log("============>", state);
        let findSelected = await selectedCity.findOne({ stateName: state });
        if (!findSelected) {
          response(
            res,
            ErrorCode.NOT_FOUND,
            {},
            "Service not available in your state."
          );
        } else {
          if (findSelected.city.length > 0) {
            for (let i = 0; i < findSelected.city.length; i++) {
              if (
                findSelected.city[i].cityName == city ||
                findSelected.city[i].cityName == city1
              ) {
                let obj;
                if ((findSelected.city[i].cityName == city) == true) {
                  obj = city;
                } else {
                  obj = city1;
                }
                response(
                  res,
                  SuccessCode.SUCCESS,
                  obj,
                  "Service available in your city"
                );
              }
            }
            response(
              res,
              ErrorCode.NOT_FOUND,
              {},
              "Service not available in your city."
            );
          } else {
            let obj = state;
            response(
              res,
              SuccessCode.SUCCESS,
              obj,
              "Service available in your state"
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },
  findLocation: async (req, res) => {
    try {
      let smsResult = await commonFunction.findLocation(
        req.body.latitude,
        req.body.longitude
      );
      console.log(
        "1645==================>",
        smsResult.results[1].address_components
      );
      for (let i = 0; i < smsResult.results[0].address_components.length; i++) {
        if (
          smsResult.results[0].address_components[i].types[0] === "locality"
        ) {
          let city = smsResult.results[0].address_components[i].long_name;
          console.log("===========================>", city);
        }
        if (
          smsResult.results[0].address_components[i].types[0] ===
          "administrative_area_level_1"
        ) {
          let state = smsResult.results[0].address_components[i].long_name;
          console.log("===========================>", state);
        }
        if (
          smsResult.results[0].address_components[i].types[0] ===
          "administrative_area_level_2"
        ) {
          let city1 = smsResult.results[0].address_components[i].long_name;
          console.log("===========>", city1);
        }
      }
      response(
        res,
        SuccessCode.SUCCESS,
        smsResult,
        "Service available in your city"
      );
    } catch (error) {
      console.log(error);
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },

  //****************************Ride Section For Admin Panel****************************//
  getAllRideForAllCondition: async function (req, res) {
    try {
      const data = req.query;
      const condition = {};

      if (data.search && data.search !== "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const numericSearch = parseInt(data.search);

        condition.$or = [
          {
            $or: [
              { bookingNumber: new RegExp(data.search, "i") },
              { userName: new RegExp(data.search, "i") },
              { driverName: new RegExp(data.search, "i") },
            ],
          },
          {
            $or: [
              { userNumber: isNaN(numericSearch) ? null : numericSearch },
              { driverNumber: isNaN(numericSearch) ? null : numericSearch },
            ],
          },
        ];
      }

      if (data.dateTime) {
        const specificDateTime = new Date(data.dateTime);
        if (isNaN(specificDateTime.getTime())) {
          throw new Error("Invalid date-time format");
        }
        specificDateTime.setSeconds(0);
        specificDateTime.setMilliseconds(0);
        const nextDateTime = new Date(specificDateTime);
        nextDateTime.setMinutes(nextDateTime.getMinutes() + 1);
        condition.createdAt = {
          $gte: specificDateTime,
          $lt: nextDateTime,
        };
      } else if (data.startDate && data.endDate) {
        const startDateTime = new Date(data.startDate);
        const endDateTime = new Date(data.endDate);
        endDateTime.setHours(0, 0, 0, 0);
        endDateTime.setDate(endDateTime.getDate() + 1);
        endDateTime.setMilliseconds(endDateTime.getMilliseconds() - 1);
        condition.createdAt = {
          $gte: startDateTime,
          $lt: endDateTime,
        };
      }

      if (
        data.rideStatus &&
        ["STARTED", "PENDING", "COMPLETED", "ONGOING"].includes(
          data.rideStatus.toUpperCase()
        )
      ) {
        condition.rideStatus = data.rideStatus.toUpperCase();
      }

      if (
        data.bookingType &&
        ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"].includes(
          data.bookingType.toUpperCase()
        )
      ) {
        condition.bookingType = data.bookingType.toUpperCase();
      }

      const statusCondition = {};
      if (
        data.BookingStatus &&
        ["CANCELLED", "ACTIVE", "INACTIVE"].includes(
          data.BookingStatus.toUpperCase()
        )
      ) {
        statusCondition.BookingStatus = data.BookingStatus.toUpperCase();
      }

      Object.assign(condition, statusCondition);

      let totalCount = await rideRequestModel.countDocuments(condition);
      totalCount = Math.ceil(totalCount / (Number(data.limit) || 10));
      const allData = await rideRequestModel.aggregate([
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: (Number(data.offset) || 0) * (Number(data.limit) || 100),
        },
        {
          $limit: Number(data.limit) || 100,
        },
      ]);

      if (!allData) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.WENT_WRONG,
          result: "",
        });
      }

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        pages: totalCount,
        count: allData.length,
        result: allData,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },

  //****************************Book Now Ride Section For Admin Panel****************************//
  todayBookingsBOOKNOW: async (req, res) => {
    try {
      const todayStart = moment().startOf("day"); // Today's start time
      const todayEnd = moment().endOf("day"); // Today's end time
      const condition = {
        rideStartDateTime: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        bookingType: "BOOKNOW",
      };

      const todayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 });

      // Separate bookings based on their status
      const totalBookings = todayBookings.length;
      const completedBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = todayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        todayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  yesterdayBookingsBOOKNOW: async (req, res) => {
    try {
      const yesterdayStart = moment().subtract(1, "days").startOf("day");
      const yesterdayEnd = moment().subtract(1, "days").endOf("day");

      const page = req.query.page || 1;
      const itemsPerPage = 10;

      const condition = {
        rideStartDateTime: {
          $gte: yesterdayStart,
          $lte: yesterdayEnd,
        },
        bookingType: "BOOKNOW",
      };

      const totalBookings = await rideRequestModel.countDocuments(condition);
      const yesterdayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

      // Separate bookings based on their status
      const completedBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = yesterdayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        yesterdayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  beforeYesterdayBookingsBOOKNOW: async (req, res) => {
    try {
      const beforeYesterdayStart = moment().subtract(2, "days").startOf("day");
      const beforeYesterdayEnd = moment().subtract(2, "days").endOf("day");

      const page = req.body.page || 1;
      const itemsPerPage = 10;

      const condition = {
        rideStartDateTime: {
          $gte: beforeYesterdayStart,
          $lte: beforeYesterdayEnd,
        },
        bookingType: "BOOKNOW",
      };

      const beforeYesterdayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

      // Separate bookings based on their status
      const totalBookings = beforeYesterdayBookings.length;
      const completedBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = beforeYesterdayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        beforeYesterdayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },

  //****************************Book Later Ride Section For Admin Panel duplicate, status change****************************//
  todayBookingsBOOKLATER: async (req, res) => {
    try {
      const todayStart = moment().startOf("day");
      const todayEnd = moment().endOf("day");

      const page = req.query.page || 1;
      const itemsPerPage = 10;

      const condition = {
        rideStartDateTime: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        bookingType: "BOOKLATER",
      };

      const todayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

      const totalBookings = todayBookings.length;
      const completedBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = todayBookings.filter(
        (booking) => booking.BookingStatus === "STARTED"
      );
      const canceledBookings = todayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        todayBookings,
        completedBookings: {
          count: completedBookings,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  yesterdayBookingsBOOKLATER: async (req, res) => {
    try {
      const yesterdayStart = moment().subtract(1, "days").startOf("day");
      const yesterdayEnd = moment().subtract(1, "days").endOf("day");

      const page = req.query.page || 1;
      const itemsPerPage = 10;
      const condition = {
        rideStartDateTime: {
          $gte: yesterdayStart,
          $lte: yesterdayEnd,
        },
        bookingType: "BOOKNOW",
      };
      const yesterdayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

      const totalBookings = yesterdayBookings.length;
      const completedBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = yesterdayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        yesterdayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  beforeYesterdayBookingsBOOKLATER: async (req, res) => {
    try {
      const beforeYesterdayStart = moment().subtract(2, "days").startOf("day");
      const beforeYesterdayEnd = moment().subtract(2, "days").endOf("day");

      const page = req.query.page || 1;
      const itemsPerPage = 10;

      const condition = {
        rideStartDateTime: {
          $gte: beforeYesterdayStart,
          $lte: beforeYesterdayEnd,
        },
        bookingType: "BOOKNOW",
      };

      const beforeYesterdayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

      // Separate bookings based on their status
      const totalBookings = beforeYesterdayBookings.length;
      const completedBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = beforeYesterdayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        beforeYesterdayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  //****************************Freight Ride Section For Admin Panel****************************//

  todayBookingsFreight: async (req, res) => {
    try {
      const todayStart = moment().startOf("day"); // Today's start time
      const todayEnd = moment().endOf("day"); // Today's end time
      const condition = {
        rideStartDateTime: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        bookingType: "FREIGHT",
      };

      const todayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 });

      // Separate bookings based on their status
      const totalBookings = todayBookings.length;
      const completedBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = todayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = todayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        todayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  yesterdayBookingsFreight: async (req, res) => {
    try {
      const yesterdayStart = moment().subtract(1, "days").startOf("day");
      const yesterdayEnd = moment().subtract(1, "days").endOf("day");

      const page = req.query.page || 1;
      const itemsPerPage = 10;
      const condition = {
        rideStartDateTime: {
          $gte: yesterdayStart,
          $lte: yesterdayEnd,
        },
        bookingType: "Freight",
      };
      const yesterdayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 });

      const totalBookings = yesterdayBookings.length;
      const completedBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = yesterdayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = yesterdayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        yesterdayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  beforeYesterdayBookingsFreight: async (req, res) => {
    try {
      const beforeYesterdayStart = moment().subtract(2, "days").startOf("day");
      const beforeYesterdayEnd = moment().subtract(2, "days").endOf("day");
      const condition = {
        rideStartDateTime: {
          $gte: beforeYesterdayStart,
          $lte: beforeYesterdayEnd,
        },
        bookingType: "BOOKNOW",
      };

      const beforeYesterdayBookings = await rideRequestModel
        .find(condition)
        .sort({ createdAt: -1 });

      // Separate bookings based on their status
      const totalBookings = beforeYesterdayBookings.length;
      const completedBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "COMPLETED"
      );
      const startedBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "STARTED"
      );
      const canceledBookings = beforeYesterdayBookings.filter(
        (booking) => booking.BookingStatus === "CANCELLED"
      );
      const pendingBookings = beforeYesterdayBookings.filter(
        (booking) => booking.rideStatus === "PENDING"
      );

      return res.status(200).json({
        responseCode: 200,
        responseMessage: "Success",
        totalBookings,
        beforeYesterdayBookings,
        completedBookings: {
          count: completedBookings.length,
          data: completedBookings,
        },
        startedBookings: {
          count: startedBookings.length,
          data: startedBookings,
        },
        canceledBookings: {
          count: canceledBookings.length,
          data: canceledBookings,
        },
        pendingBookings: {
          count: pendingBookings.length,
          data: pendingBookings,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        responseCode: 500,
        responseMessage: "Internal Server Error",
        result: {},
      });
    }
  },
  //**************************************booking payment transaction **************************************//
  bookingPaymentList: async (req, res) => {
    try {
      let userData = await userModel.findOne({ _id: req.userId });
      if (!userData) {
        res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.USER_NOT_FOUND,
          result: {},
        });
      } else {
        let query = {
          $or: [{ user: userData._id }, { driverId: userData._id }],
        };
        var options = {
          sort: { createAt: -1 },
          populate: { path: "bookingId" },
        };
        bookingPayment.paginate(query, options, (err, result) => {
          if (err) {
            res.status(ErrorCode.WENT_WRONG).json({
              responseCode: ErrorCode.WENT_WRONG,
              responseMessage: ErrorMessage.INTERNAL_ERROR,
              result: {},
            });
          } else if (result.docs.length == 0) {
            response(res, ErrorCode.NOT_FOUND, [], ErrorMessage.NOT_FOUND);
          } else {
            response(
              res,
              SuccessCode.SUCCESS,
              result.docs,
              SuccessMessage.DATA_FOUND
            );
          }
        });
      }
    } catch (error) {
      response(res, ErrorCode.WENT_WRONG, [], ErrorMessage.SOMETHING_WRONG);
    }
  },
  viewBookingPayment: async (req, res) => {
    try {
      let data = await bookingPayment
        .findOne({ _id: req.params._id })
        .populate({
          path: "driverId user",
          select: "name userType profilePic",
        });
      if (!data) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.NOT_FOUND);
      } else {
        response(res, SuccessCode.SUCCESS, data, SuccessMessage.DATA_FOUND);
      }
    } catch (error) {
      console.log(error);
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },
  ridePayment: async function (req, res) {
    try {
      let userData = await userModel.findOne({ _id: req.body.userId });
      if (!userData) {
        return response(
          res,
          ErrorCode.NOT_FOUND,
          {},
          ErrorMessage.USER_NOT_FOUND
        );
      }

      let bookingDetails = await rideRequestModel.findOne({
        _id: req.body._id,
        BookingStatus: { $ne: "CANCELLED" },
        paymentStatus: { $ne: "SUCCESS" },
      });

      if (!bookingDetails) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "Booking not found or already paid.",
        });
      }

      let vehicleDetails = await vehicleModel.findOne({
        _id: bookingDetails.vehicleType,
      });
      if (!vehicleDetails) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "Vehicle details not found.",
        });
      }

      if (req.body.paymentMode === "CASH") {
        await processCashPayment(vehicleDetails, bookingDetails, userData);
        return response(
          res,
          SuccessCode.SUCCESS,
          {},
          "Thanks for your Payment."
        );
      } else if (req.body.paymentMode === "WALLET") {
        if (userData.walletBalance >= bookingDetails.amount) {
          await processWalletPayment(vehicleDetails, bookingDetails, userData);
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: "Thanks for your Payment.",
            result: {},
          });
        } else {
          return res.status(ErrorCode.NOT_FOUND).json({
            responseCode: ErrorCode.NOT_FOUND,
            responseMessage: ErrorMessage.NOT_FOUND,
            result: "Insufficient balance in wallet.",
          });
        }
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  addMoneyToWallet: async (req, res) => {
    try {
      let user = await userModel.findOne({
        _id: req.userId,
        userType: "CUSTOMER",
        status: "ACTIVE",
      });

      if (!user) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      } else {
        if (req.body.amount > 0) {
          const options = {
            amount: req.body.amount,
            currency: "INR",
            receipt: `wallet_recharge_${Date.now()}`,
          };

          const payment = await commonFunction.razorpay.orders.create(options);

          const currDate = new Date();
          const dateTime = await dateTimeCalculate(
            currDate.getDate(),
            currDate.getMonth(),
            currDate.getFullYear(),
            currDate.getHours(),
            currDate.getMinutes(),
            currDate.getSeconds()
          );

          const transaction = new userTransaction({
            userId: user._id,
            amount: req.body.amount,
            dateTime: dateTime,
            status: "PENDING",
            transactionType: "DEPOSIT",
            payment_id: payment.id,
          });
          const savedTransaction = await transaction.save();

          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: "Payment is Process.",
            result: savedTransaction,
          });
        } else {
          response(
            res,
            ErrorCode.WENT_WRONG,
            {},
            "Amount should be greater than 0."
          );
        }
      }
    } catch (error) {
      return res.status(ErrorCode.WENT_WRONG).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: error.message,
      });
    }
  },

  paymentVerify: async (req, res, next) => {
    try {
      let user = await userModel.findOne({ _id: req.userId, status: "ACTIVE" });
      if (!user) {
        return response(
          res,
          ErrorCode.NOT_FOUND,
          {},
          ErrorMessage.USER_NOT_FOUND
        );
      }

      let data = await transaction.findOne({
        userId: user._id,
        transactionType: "DEPOSIT",
        status: "PENDING",
      });

      if (!data) {
        return response(
          res,
          ErrorCode.NOT_FOUND,
          {},
          "Pending transaction not found."
        );
      }

      if (req.body.status === "PAID") {
        const transactionUpdate = {
          status: req.body.status,
          transactionId: req.body.transactionId,
          paymentId: req.body.payment_id, // Razorpay ID
        };

        const updatedTransaction = await transaction.findByIdAndUpdate(
          { _id: data._id },
          { $set: transactionUpdate },
          { new: true }
        );

        if (!updatedTransaction) {
          return response(
            res,
            ErrorCode.INTERNAL_ERROR,
            {},
            "Failed to update transaction."
          );
        }

        const wallet = await userModel.findOne({ _id: data.userId });
        if (!wallet) {
          return response(
            res,
            ErrorCode.NOT_FOUND,
            {},
            "Wallet not found for user."
          );
        }

        const amount = Number(data.amount) + wallet.walletBalance;
        const updatedWallet = await userModel.findByIdAndUpdate(
          { _id: wallet._id },
          { $set: { walletBalance: amount } },
          { new: true }
        );

        return res.send({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Money added successfully.",
          result: updatedTransaction,
        });
      } else if (req.body.status === "FAILED") {
        req.body.transactionId =
          `pay_${commonFunction.paymentId()}` || req.body.transactionId;

        const transactionUpdate = {
          status: req.body.status,
          transactionId: req.body.transactionId,
        };

        const updatedTransaction = await transaction.findByIdAndUpdate(
          { _id: data._id },
          { $set: transactionUpdate },
          { new: true }
        );

        return res.send({
          responseCode: ErrorCode.REQUEST_FAILED,
          responseMessage: "Transaction failed.",
          result: updatedTransaction,
        });
      }
    } catch (error) {
      return next(error);
    }
  },
  checkWalletBalance: async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: "Invalid request data",
          result: "",
        });
      }
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "User not found",
          result: "",
        });
      }
      const walletBalance = user.walletBalance;
      res.status(200).json({ walletBalance });
    } catch (error) {
      console.error("Error checking wallet balance:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllTransactions: async (req, res) => {
    try {
      const data = req.query;
      const condition = {};
      const sort = {};

      condition.userType = { $ne: "ADMIN" };

      if (data.search && data.search !== "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [{ status: new RegExp(data.search, "i") }];
      }

      if (data.dateTime) {
        const specificDateTime = new Date(data.dateTime);
        if (isNaN(specificDateTime.getTime())) {
          throw new Error("Invalid date-time format");
        }
        specificDateTime.setSeconds(0);
        specificDateTime.setMilliseconds(0);
        const nextDateTime = new Date(specificDateTime);
        nextDateTime.setMinutes(nextDateTime.getMinutes() + 1);
        condition.createdAt = {
          $gte: specificDateTime,
          $lt: nextDateTime,
        };
      } else if (data.startDate && data.endDate) {
        const startDateTime = new Date(data.startDate);
        const endDateTime = new Date(data.endDate);
        endDateTime.setHours(0, 0, 0, 0);
        endDateTime.setDate(endDateTime.getDate() + 1);
        endDateTime.setMilliseconds(endDateTime.getMilliseconds() - 1);
        condition.createdAt = {
          $gte: startDateTime,
          $lt: endDateTime,
        };
      }

      if (
        data.status &&
        ["PAID", "PENDING", "FAILED", "SUCCESS"].includes(
          data.status.toUpperCase()
        )
      ) {
        condition.status = data.status.toUpperCase();
      }
      if (
        data.paymentMethod &&
        ["GOOGLE_PAY", "BANK", "PAYTM"].includes(
          data.paymentMethod.toUpperCase()
        )
      ) {
        condition.paymentMethod = data.paymentMethod.toUpperCase();
      }

      if (data.userId) {
        condition.userId = mongoose.Types.ObjectId(data.userId);
      }

      let totalCount = await userTransaction.countDocuments(condition);
      let totalTransactions = await userTransaction.countDocuments();

      totalCount = Math.ceil(totalCount / (Number(data.limit) || 10));
      const allData = await userTransaction.aggregate([
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: (Number(data.offset) || 0) * (Number(data.limit) || 10),
        },
        {
          $limit: Number(data.limit) || 10,
        },
      ]);

      if (!allData) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.WENT_WRONG,
          result: "",
        });
      }

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        Total_Transactions: totalTransactions,
        Total_Page_Count: totalCount,
        Entry_Count: allData.length,
        result: allData,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  // ==================================================commision========================================
  bookingAmount: async (req, res) => {
    // search=req.
  },
};

async function unblockUserAfterDelay(userId) {
  setTimeout(async () => {
    try {
      const updateUser = await userModel.findByIdAndUpdate(userId, {
        $set: { blockStatus: "UNBLOCKED" },
      });
      if (!updateUser) {
        console.log("Went wrong in update");
      }
      console.log(`Update user Successfully with User Id ${userID}`);
    } catch (error) {
      console.error(`Error updating BookingStatus: ${error}`);
    }
  }, 24 * 60 * 60 * 1000); //20 second  in milliseconds
}
async function unblockDriverAfterDelay(driverId) {
  setTimeout(async () => {
    try {
      const updateUser = await driverModel.findByIdAndUpdate(driverId, {
        $set: { bookingBlock: "UNBLOCKED" },
      });
      if (!updateUser) {
        console.log("Went wrong in update");
      }
      console.log(`Update Driver Successfully with User Id ${userID}`);
    } catch (error) {
      console.error(`Error updating BookingStatus: ${error}`);
    }
  }, 24 * 60 * 60 * 1000);
}
async function setInactiveAfterDelay(bookingId) {
  setTimeout(async () => {
    try {
      const booking = await rideRequestModel.findByIdAndUpdate(bookingId, {
        $set: { BookingStatus: "INACTIVE" },
      });
      console.log(`auto inactive success of ride with id ${bookingId}`);
    } catch (error) {
      console.log(error);
    }
  }, 30 * 60 * 1000);
}
const getDistanceFromLatLonInKm = async (lat1, lon1, lat2, lon2) => {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
const dateTimeCalculate = async (date, month, year, hr, min, sec) => {
  let date1, hr1, min1, sec1;
  if (date < 10) {
    date1 = "" + 0 + date;
  } else {
    date1 = date;
  }
  if (hr < 10) {
    hr1 = "" + 0 + hr;
  } else {
    hr1 = hr;
  }
  if (min < 10) {
    min1 = "" + 0 + min;
  } else {
    min1 = min;
  }
  if (sec < 10) {
    sec1 = "" + 0 + sec;
  } else {
    sec1 = sec;
  }
  let fullDate = `${date1}-${month}-${year} ${hr1}:${min1}:${sec1}`;
  return fullDate;
};

async function processCashPayment(vehicleDetails, bookingDetails, userData) {
  let totalCommission = 0,
    driverCommission = 0;
  if (vehicleDetails.commissionType === "FLAT") {
    totalCommission = vehicleDetails.totalCommission || 0;
    driverCommission = vehicleDetails.driverCommission || 0;
  } else if (vehicleDetails.commissionType === "PERCENTAGE") {
    totalCommission =
      ((vehicleDetails.totalCommission || 0) * bookingDetails.amount) / 100;
    ((vehicleDetails.driverCommission || 0) * bookingDetails.amount) / 100;
  }

  let cashTransaction = await cashInHand.findOne({
    userId: bookingDetails.driverId,
  });
  if (!cashTransaction) {
    cashTransaction = new cashInHand({
      userId: bookingDetails.driverId,
      adminCash: 0,
      driverCash: 0,
      totalCash: 0,
    });
  }

  cashTransaction.adminCash += totalCommission;
  cashTransaction.driverCash += driverCommission;
  cashTransaction.totalCash += totalCommission + driverCommission;

  await cashTransaction.save();

  await new bookingPayment({
    user: bookingDetails.userId,
    driverId: bookingDetails.driverId,
    bookingId: bookingDetails._id,
    amount: bookingDetails.amount,
    paymentMode: "CASH",
    transactionStatus: "SUCCESS",
  }).save();

  await rideRequestModel.findByIdAndUpdate(bookingDetails._id, {
    paymentStatus: "SUCCESS",
    paymentMode: "CASH",
  });
}
async function processWalletPayment(vehicleDetails, bookingDetails, userData) {
  let totalCommission = 0,
    driverCommission = 0;
  if (vehicleDetails.commissionType === "FLAT") {
    totalCommission = vehicleDetails.totalCommission;
  } else if (vehicleDetails.commissionType === "PERCENTAGE") {
    totalCommission =
      (vehicleDetails.totalCommission * bookingDetails.amount) / 100;
    driverCommission =
      (vehicleDetails.driverCommission * bookingDetails.amount) / 100;
  }

  userData.walletBalance -= bookingDetails.amount;
  await userModel.findByIdAndUpdate(userData._id, {
    walletBalance: userData.walletBalance,
  });

  let driverData = await userModel.findById(bookingDetails.driverId);
  if (!driverData) {
    throw new Error("Driver not found.");
  }
  driverData.walletBalance += driverCommission;
  await userModel.findByIdAndUpdate(driverData._id, {
    walletBalance: driverData.walletBalance,
  });

  let adminData = await userModel.findOne({ userType: "ADMIN" });
  if (!adminData) {
    throw new Error("Admin not found.");
  }
  adminData.walletBalance += totalCommission;
  await userModel.findByIdAndUpdate(adminData._id, {
    walletBalance: adminData.walletBalance,
  });

  await new bookingPayment({
    user: bookingDetails.userId,
    driverId: bookingDetails.driverId,
    bookingId: bookingDetails._id,
    amount: bookingDetails.amount,
    paymentMode: "WALLET",
    transactionStatus: "SUCCESS",
  }).save();

  await rideRequestModel.findByIdAndUpdate(bookingDetails._id, {
    paymentStatus: "SUCCESS",
    paymentMode: "WALLET",
  });
}
