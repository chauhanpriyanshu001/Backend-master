const driverModel = require("../models/driverModel");
const vehicleModel = require("../models/vehicleDocument");
const aadharModel = require("../models/adharDocument");
const deletedDriver = require("../models/deletedDriverModel");
const EmergencyContact = require("../models/EmergencyContact");
const DLModel = require("../models/DLModel");
const commonFunction = require("../helper/commonFunction");
const driverAllActiveDateAndTime = require("../models/driverAllActiveDate&Time");
const { commonResponse: response } = require("../helper/commonResponseHandler");
const { ErrorCode, SuccessCode } = require("../helper/statusCode");
const { SuccessMessage, ErrorMessage } = require("../helper/message");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../middleware/aws");
const { default: mongoose } = require("mongoose");
const driverActivity = require("../models/driverActivity");
const { rmSync } = require("fs");
const rideRequest = require("../models/rideRequest");
const vehicleDocument = require("../models/vehicleDocument");
const serviceVehicle = require("../models/vehicleModel");
const driverTransaction = require("../models/driverTransaction");
const { sendBidFareToUser, documentUpdateDriver } = require('./socketHandler');
const userModel = require("../models/userModel");
// const driverWallet = require("../models/walletModel");


module.exports = {
  driverLogin: async (req, res, next) => {
    try {
      query = {
        mobileNumber: req.body.mobileNumber,
        userType: "PROVIDER",
        status: { $ne: "DELETE" },
      };
      let user = await driverModel.findOne(query);
      if (user) {
        if (user.status == "ACTIVE") {
          req.body.otp = commonFunction.randomOTPGenerate();
          req.body.otpTimeExpire = Date.now();
          var Number = "91";
          var mobileNumber = Number.concat(req.body.mobileNumber);
          commonFunction
            .sendMobileOtp(mobileNumber, req.body.otp)
            .then((smsResult) => {
              driverModel.findByIdAndUpdate(
                { _id: user._id },
                {
                  $set: {
                    otp: req.body.otp,
                    otpTimeExpire: req.body.otpTimeExpire,
                    accountVerify: false,
                  },
                },
                { new: true },
                (err, result) => {
                  if (err) {
                    console.log(err);
                    response(
                      res,
                      ErrorCode.INTERNAL_ERROR,
                      err,
                      ErrorMessage.INTERNAL_ERROR
                    );
                  } else {
                    let obj = {
                      mobileNumber: result.mobileNumber,
                      otp: result.otp,
                      accountVerify: result.accountVerify,
                    };
                    response(
                      res,
                      SuccessCode.SUCCESS,
                      obj,
                      SuccessMessage.OTP_SEND
                    );
                  }
                }
              );
            })
            .catch((err) => {
              response(
                res,
                ErrorCode.INTERNAL_ERROR,
                err,
                ErrorMessage.INTERNAL_ERROR
              );
            });
        } else if (user.status === "BLOCK") {
          response(
            res,
            ErrorCode.INTERNAL_ERROR,
            err,
            ErrorMessage.BLOCKED_BY_ADMIN
          );
        } else if (user.status === "DELETE") {
          response(
            res,
            ErrorCode.INTERNAL_ERROR,
            err,
            ErrorMessage.DELETED_BY_ADMIN
          );
        }
      } else {
        req.body.otp = commonFunction.randomOTPGenerate();
        req.body.otpTimeExpire = Date.now();
        var Number = "+91";
        var mobileNumber = Number.concat(req.body.mobileNumber);
        commonFunction
          .sendMobileOtp(mobileNumber, req.body.otp)
          .then((smsResult) => {
            new driverModel(req.body).save((err, result) => {
              if (err) {
                response(
                  res,
                  ErrorCode.INTERNAL_ERROR,
                  err,
                  ErrorMessage.INTERNAL_ERROR
                );
              } else {
                let obj = {
                  mobileNumber: result.mobileNumber,
                  otp: result.otp,
                  accountVerify: result.accountVerify,
                };
                response(
                  res,
                  SuccessCode.SUCCESS,
                  obj,
                  SuccessMessage.OTP_SEND
                );
              }
            });
          })
          .catch((err) => {
            response(
              res,
              ErrorCode.INTERNAL_ERROR,
              err,
              ErrorMessage.INTERNAL_ERROR
            );
          });
      }
    } catch (error) {
      console.log("error", error);
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },
  verifyOtp: (req, res) => {
    try {
      driverModel.findOne(
        {
          mobileNumber: req.body.mobileNumber,
          status: { $ne: "DELETE" },
          userType: "PROVIDER",
        },
        async (err, result) => {
          if (err) {
            response(
              res,
              ErrorCode.INTERNAL_ERROR,
              {},
              ErrorMessage.INTERNAL_ERROR
            );
          } else if (!result) {
            response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.NOT_FOUND);
          } else {
            const jwtDriverSignature = process.env.JWT_DRIVER_SIGNATURE;
            var token = jwt.sign(
              { _id: result._id, mobileNumber: result.mobileNumber },
              jwtDriverSignature,
              { expiresIn: "1y" }
            );

            if (result.accountVerify == false) {
              if (result.otp == req.body.otp) {
                var newTime = Date.now();
                var difference = newTime - result.otpTimeExpire;
                if (difference <= 60 * 1000) {
                  result.accountVerify = true;
                  result.deviceToken = req.body.deviceToken;
                  result.deviceType = req.body.deviceType;

                  try {
                    const updateResult = await result.save();
                    if (updateResult) {
                      let obj = {
                        _id: updateResult._id,
                        userType: updateResult.userType,
                        token: token,
                      };
                      response(
                        res,
                        SuccessCode.SUCCESS,
                        obj,
                        SuccessMessage.LOGIN_SUCCESS
                      );
                    } else {
                      response(
                        res,
                        ErrorCode.INTERNAL_ERROR,
                        {},
                        ErrorMessage.INTERNAL_ERROR
                      );
                    }
                  } catch (updateErr) {
                    response(
                      res,
                      ErrorCode.INTERNAL_ERROR,
                      updateErr,
                      ErrorMessage.INTERNAL_ERROR
                    );
                  }
                } else {
                  response(
                    res,
                    ErrorCode.INVALID_CREDENTIAL,
                    {},
                    ErrorMessage.OTP_EXPIRED
                  );
                }
              } else {
                response(
                  res,
                  ErrorCode.INVALID_CREDENTIAL,
                  {},
                  ErrorMessage.INVALID_OTP
                );
              }
            } else {
              result.deviceToken = req.body.deviceToken;
              result.deviceType = req.body.deviceType;

              try {
                const updateResult = await result.save();

                if (updateResult) {
                  let obj = {
                    _id: updateResult._id,
                    userType: updateResult.userType,
                    token: token,
                  };
                  response(
                    res,
                    SuccessCode.SUCCESS,
                    obj,
                    SuccessMessage.CUSTOMER_ALREADY_VERIFY
                  );
                } else {
                  response(
                    res,
                    ErrorCode.INTERNAL_ERROR,
                    {},
                    ErrorMessage.INTERNAL_ERROR
                  );
                }
              } catch (updateErr) {
                response(
                  res,
                  ErrorCode.INTERNAL_ERROR,
                  updateErr,
                  ErrorMessage.INTERNAL_ERROR
                );
              }
            }
          }
        }
      );
    } catch (error) {
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },
  updateDriverProfile: async function (req, res) {
    try {
      let driverId = req.driverId;
      let query = {
        _id: driverId,
        userType: { $in: ["CUSTOMER", "PROVIDER"] },
        status: { $ne: "DELETE" },
      };
      let driverData = await driverModel.findOne(query);
      if (driverData) {
        let data = req.body;
        let updateData = {};
        let files = req.files;
        if (files?.length > 0) {
          const validImageMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/jpeg2000",
            "image/png",
            "image/heic",
          ];
          for (let i = 0; i < files.length; i++) {
            if (!validImageMimeTypes.includes(files[i].mimetype)) {
              return res.status(ErrorCode.BAD_REQUEST).json({
                responseCode: ErrorCode.BAD_REQUEST,
                responseMessage: `Please provide a correct image of ${files[i].fieldname} with a valid extension (jpg, jpeg, jpeg2000, png, heic).`,
                result: "",
              });
            }
          }
          let profilePic = files.filter(
            (img) => img.fieldname === "profilePic"
          );
          if (profilePic.length > 0) {
            updateData.profilePic = await uploadFile(profilePic[0]);
          }
          let license = files.filter(
            (img) => img.fieldname == "licenseFrontPic"
          );
          if (license.length > 0) {
            updateData.licenseFrontPic = await uploadFile(license[0]);
          }
          let licenseBackPic = files.filter(
            (img) => img.fieldname === "licenseBackPic"
          );
          if (licenseBackPic.length > 0) {
            updateData.licenseBackPic = await uploadFile(licenseBackPic[0]);
          }
          let driverPicWithIdentity = files.filter(
            (img) => img.fieldname === "driverPicWithIdentity"
          );
          if (driverPicWithIdentity.length > 0) {
            updateData.driverPicWithIdentity = await uploadFile(
              driverPicWithIdentity[0]
            );
          }
        }
        if (data.email) {
          updateData.email = data.email;
        }
        if (data.name) {
          updateData.name = data.name;
        }
        if (data.gender) {
          updateData.gender = data.gender;
        }
        if (data.DOB) {
          updateData.DOB = data.DOB;
        }
        if (data.license) {
          updateData.license = data.license;
        }
        if (data.country) {
          updateData.country = data.country;
        }
        if (data.city) {
          updateData.city = data.city;
        }
        if (data.address) {
          updateData.address = data.address;
        }
        if (data.walletBalance) {
          updateData.walletBalance = data.walletBalance;
        }
        if (data.countryCode) {
          updateData.countryCode = data.countryCode;
        }
        if (data.bioText) {
          updateData.bioText = data.bioText;
        }
        if (data.driverEmergencyNumber) {
          updateData.driverEmergencyNumber = data.driverEmergencyNumber;
        }
        if (data.dateOfExpirationLicense) {
          updateData.dateOfExpirationLicense = data.dateOfExpirationLicense;
        }
        if (data.driverPicWithIdentity) {
          updateData.driverPicWithIdentity = data.driverPicWithIdentity;
        }
        if (data.address) {
          updateData.address = data.address;
        }
        // Add currentLocation updates
        if (data.currentLocation && data.currentLocation.coordinates) {
          updateData.currentLocation = {
            type: "Point",
            coordinates: [
              parseFloat(data.currentLocation.coordinates[0]),
              parseFloat(data.currentLocation.coordinates[1]),
            ],
          };
        }
        let updateProfile = await driverModel.findOneAndUpdate(
          { _id: driverData._id, mobileNumber: driverData.mobileNumber },
          { $set: updateData },
          { new: true }
        );
        if (updateProfile) {
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: SuccessMessage.UPDATE_SUCCESS,
            result: updateProfile,
          });
        } else {
          return res.status(ErrorCode.WENT_WRONG).json({
            responseCode: ErrorCode.WENT_WRONG,
            responseMessage: ErrorMessage.WENT_WRONG,
            result: "",
          });
        }
      } else {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  updateDriverDocStatus: async function (req, res) {
    try {
      const driverId = req.params.driverId;
      const query = {
        _id: driverId,
        userType: "PROVIDER",
        status: { $ne: "DELETE" },
      };

      const updateData = {
        documentVerified: req.body.documentVerified,
      };

      const updatedProfile = await driverModel.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true }
      );

      if (updatedProfile) {
        const driver = await driverModel.findById(driverId);
        const message = "APPROVED";
        const io = req.app.get("socketio");
        documentUpdateDriver(io, message, driver.socketId);
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.UPDATE_SUCCESS,
          result: updatedProfile,
        });
      } else {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.WENT_WRONG,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  viewDriverProfile: async (req, res) => {
    try {
      let driverData = await driverModel
        .findOne({
          _id: req.driverId,
          userType: "PROVIDER",
        })
        .populate("aadharDocumentId")
        .populate("DrivingLicenseId")
        .populate("documentId");

        let drivingLicenceData = await DLModel
      .findOne({
        driverId: req.driverId,
      });

      let vehicleData = await vehicleModel
      .findOne({
        driverId: req.driverId,
      });
     
      

      if (!driverData) {
        res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.DRIVER_NOT_FOUND,
          result: {},
        });
        return;
      }
      let driverDataObj = driverData.toObject();
      if(drivingLicenceData){
        driverDataObj.licence = drivingLicenceData;
      }

      if(vehicleData){
        driverDataObj.vehicleData = vehicleData;
      }
   
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.DATA_FOUND,
        result: driverDataObj,
      });
    } catch (error) {
      res.status(ErrorCode.WENT_WRONG).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: { error },
      });
    }
  },
  createTodayActiveDriverData: async function (req, res) {
    try {
      let driverId = req.driverId;
      let data = {};
      data.driverId = driverId;
      const currentDate = new Date();
      data.activeDate = currentDate.toLocaleDateString();
      data.activeTimes = [currentDate.toLocaleTimeString()];

      let findActiveDate = await driverAllActiveDateAndTime.findOne({
        driverId: driverId,
        activeDate: currentDate.toLocaleDateString(),
      });

      if (
        findActiveDate &&
        findActiveDate.activeDate == currentDate.toLocaleDateString()
      ) {
        findActiveDate.activeTimes.push(currentDate.toLocaleTimeString());

        let setData = await driverAllActiveDateAndTime.findOneAndUpdate(
          { driverId: driverId, activeDate: currentDate.toLocaleDateString() },
          findActiveDate,
          { new: true }
        );

        if (setData) {
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: SuccessMessage.SUCCESS,
            result: setData,
          });
        }
      } else {
        let resultDat = await driverAllActiveDateAndTime.create(data);
        if (resultDat) {
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: SuccessMessage.SUCCESS,
            result: resultDat,
          });
        }
      }

      return res.status(ErrorCode.WENT_WRONG).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.WENT_WRONG,
        result: "",
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  onlineStatusUpdate: async function (req, res) {
    try {
      let update = req.body.online;
      let driverId = req.driverId;
      let updateOnline = await driverModel.findOneAndUpdate(
        { _id: driverId },
        { $set: { online: update } },
        { new: true }
      );
      if (updateOnline) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.UPDATE_SUCCESS,
          result: updateOnline,
        });
      } else {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  getAllDriverAndSearchFilter: async function (req, res) {
    try {

      const data = req.query;
      const condition = {};
      const sort = {};

      if (data.search && data.search !== "") {
        const searchRegex = new RegExp(
          data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        );
        condition.$or = [
          { mobileNumber: searchRegex },
          { name: searchRegex },
          { status: searchRegex },
        ];
      }
     
      if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        endDate.setHours(23, 59, 59, 999);
        condition.createdAt = { $gte: startDate, $lte: endDate };
      }

      if (
        data.bookingBlock &&
        ["BLOCKED", "UNBLOCKED"].includes(data.bookingBlock.toUpperCase())
      ) {
        condition.bookingBlock = data.bookingBlock.toUpperCase();
      }
      if (
        data.status &&
        ["ACTIVE", "DELETE", "BLOCK"].includes(data.status.toUpperCase())
      ) {
        condition.status = data.status.toUpperCase();
      }

      let totalDocumentsCount = await driverModel.countDocuments(condition);

      let totalDriverCount = await driverModel.countDocuments();

      const limit = Number(data.limit) || 100;
      const offset = (Number(data.offset) || 0) * limit;
      totalDocumentsCount = Math.ceil(totalDocumentsCount / limit);

      const allData = await driverModel.aggregate([
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: offset,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleType',
            foreignField: '_id',
            as: 'vehicleType',
          }
        },
      ]);
      // {
      //   $lookup: {
      //     from: "vehicles",
      //     let: { vehicleTypeId: "$vehicleType" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: ["$_id", "$$vehicleTypeId"],
      //           },
      //         },
      //       },
      //     ],
      //     as: "vehicleType",
      //   },
      // },
      // {
      //   $unwind: "$vehicleType",
      // },
      // {
      //   $project: {
      //     _id: 1,
      //     name: 1,
      //     country: 1,
      //     email: 1,
      //     DOB: 1,
      //     driverEmergencyNumber: 1,
      //     license: 1,
      //     licenseFrontPic: 1,
      //     licenseBackPic: 1,
      //     dateOfExpirationLicense: 1,
      //     driverPicWithIdentity: 1,
      //     city: 1,
      //     walletBalance: 1,
      //     countryCode: 1,
      //     walletBalance: 1,
      //     mobileNumber: 1,
      //     profilePic: 1,
      //     otp: 1,
      //     otpTimeExpire: 1,
      //     completeProfile: 1,
      //     accountVerify: 1,
      //     notification: 1,
      //     agreement: 1,
      //     bioText: 1,
      //     rides: 1,
      //     documentId: 1,
      //     aadharDocumentId: 1,
      //     vehicleType: 1,
      //     aadharDocumentUpload: 1,
      //     DrivingLicenseId: 1,
      //     DLDocumentUpload: 1,
      //     documentVerified: 1,
      //     documentUpload: 1,
      //     referralCode: 1,
      //     referredId: 1,
      //     deviceToken: 1,
      //     SharedContact: 1,
      //     deviceType: 1,
      //     gender: 1,
      //     userType: 1,
      //     bookingBlock: 1,
      //     status: 1,
      //     bookingAcceptType: 1,
      //     online: 1,
      //     currentLocation: 1,
      //     coordinates: 1,
      //     bookingBlock: 1,
      //     docsStatus: 1,
      //     requestRides: 1,
      //     cancelRideCount: 1,
      //     InRideStatus: 1,
      //     LaterRideTime: 1,
      //     createdAt: 1,
      //     updatedAt: 1,
      //     vehicleType: {
      //       _id: 1,
      //       vehicleName: 1,
      //     },
      //   },
      // },
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        Total_Driver_Count: totalDriverCount,
        Total_Page_Count: totalDocumentsCount,
        Entry_Count: allData.length,
        result: allData,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  deleteDriver: async function (req, res) {
    try {
      let driverId = req.driverId;
      let driverData = await driverModel.findById(driverId);
      if (driverData) {
        let data = await deletedDriver.findOneAndUpdate(
          { _id: driverId },
          driverData,
          { new: true, upsert: true }
        );

        if (!data) {
          return res.status(ErrorCode.WENT_WRONG).json({
            responseCode: ErrorCode.WENT_WRONG,
            responseMessage: ErrorMessage.WENT_WRONG,
            result: "",
          });
        } else {
          let checkDeleted = await driverModel.findByIdAndDelete(driverId);
          if (checkDeleted) {
            return res.status(SuccessCode.SUCCESS).json({
              responseCode: SuccessCode.SUCCESS,
              responseMessage: SuccessMessage.SUCCESS,
              result: "Your Account Deleted Successfully",
            });
          } else {
            return res.status(ErrorCode.WENT_WRONG).json({
              responseCode: ErrorCode.WENT_WRONG,
              responseMessage: ErrorMessage.WENT_WRONG,
              result: "",
            });
          }
        }
      } else {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ERRORCODE.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  deleteDriverByAdmin: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      let driverData = await driverModel.findById(driverId);
      if (driverData) {
        let data = await deletedDriver.findOneAndUpdate(
          { _id: driverId },
          driverData,
          { new: true, upsert: true }
        );
        if (!data) {
          return res.status(ErrorCode.WENT_WRONG).json({
            responseCode: ErrorCode.WENT_WRONG,
            responseMessage: ErrorMessage.WENT_WRONG,
            result: "",
          });
        } else {
          let checkDeleted = await driverModel.findByIdAndDelete(driverId);
          if (checkDeleted) {
            return res.status(SuccessCode.SUCCESS).json({
              responseCode: SuccessCode.SUCCESS,
              responseMessage: SuccessMessage.SUCCESS,
              result: "Your Account Deleted Successfully",
            });
          } else {
            return res.status(ErrorCode.WENT_WRONG).json({
              responseCode: ErrorCode.WENT_WRONG,
              responseMessage: ErrorMessage.WENT_WRONG,
              result: "",
            });
          }
        }
      } else {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ERRORCODE.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  updateDriverStatus: async function (req, res) {
    try {
      const driverId = req.params.driverId;
      const newStatus = req.body.status;
      const newBookingBlock = req.body.bookingBlock;
      const validStatusOptions = ["ACTIVE", "BLOCK", "DELETE"];
      if (newStatus && !validStatusOptions.includes(newStatus)) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage:
            "Invalid status provided. Please provide a valid status.",
          result: "",
        });
      }
      const validBookingBlockStatusOptions = ["UNBLOCKED", "BLOCKED"];
      if (
        newBookingBlock &&
        !validBookingBlockStatusOptions.includes(newBookingBlock)
      ) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage:
            "Invalid bookingBlock provided. Please provide a valid bookingBlock.",
          result: "",
        });
      }
      const driver = await driverModel.findOne({ _id: driverId });
      if (driver) {
        if (newStatus) {
          driver.status = newStatus;
        }
        if (newBookingBlock) {
          driver.bookingBlock = newBookingBlock;
        }
        const updatedDriver = await driver.save();
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.UPDATE_SUCCESS,
          result: updatedDriver,
        });
      } else {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  verifyTokenAndDriver: async (req, res, next) => {
    try {
      const driverId = req.driverId;
      const driver = await driverModel.findById(driverId);
      if (!driver) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Driver does not found",
        });
      }
      return res.status(200).json({
        responseCode: ErrorCode.DATA_FOUND,
        responseMessage: "Driver Exist",
      });
    } catch (error) {
      res.status(501).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: error,
      });
    }
  },
  driverLogout: async function (req, res) {
    try {
      const token = req.headers.token;
      if (!token) {
        return response(res, ErrorCode.BAD_REQUEST, {}, "Token not provided");
      }
      const jwtDriverSignature = process.env.JWT_DRIVER_SIGNATURE;
      jwt.verify(token, jwtDriverSignature, async (err, decoded) => {
        if (err) {
          return response(res, ErrorCode.UNAUTHORIZED, err, "Invalid token");
        }
        const user = await driverModel.findOne({ _id: decoded._id });
        if (!user) {
          return response(res, ErrorCode.NOT_FOUND, {}, "Driver not found");
        }
        return response(
          res,
          SuccessCode.SUCCESS,
          {},
          "Your Account has been Logout Successfully"
        );
      });
    } catch (error) {
      console.error(error);
      return response(res, ErrorCode.WENT_WRONG, error, "Something went wrong");
    }
  },

  //===============================Driver Activation Section for Admin Panel===============================//
  getOnlineDriver: async (req, res) => {
    try {
      const onlineStatus = "YES";
      const condition = {
        online: onlineStatus,
      };
      const onlineDrivers = await driverModel
        .find(condition)
        .sort({ createdAt: -1 })
        .limit(10);
      if (onlineDrivers.length === 0) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Online Driver Not Found",
          count: 0,
          result: [],
        });
      }
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.DRIVER_FOUND,
        count: onlineDrivers.length,
        result: onlineDrivers,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },

  //===============================Ride Request Section===============================//
  getAllRideListNearDriver: async function (req, res) {
    try {
      const driverId = req.driverId;
      const driver = await driverModel.findById({ _id: driverId });
      if (!driver) {
        return res.status(404).json({
          responseMessage: "Driver does not exist",
          responseCode: ErrorCode.NOT_FOUND,
        });
      }
      if (driver.bookingBlock == "BLOCKED") {
        return res.status(400).json({
          responseCode: 400,
          responseMessage: " You are blocked for cancelling rides  ",
        });
      }
      let queryBookingType = null;
      if (driver.bookingAcceptType == "BOOKNOW") {
        queryBookingType = { bookingType: "BOOKNOW" };
      } else if (driver.bookingAcceptType == "FREIGHT") {
        queryBookingType = { bookingType: "FREIGHT" };
      } else if (driver.bookingAcceptType == "BOOKLATER") {
        queryBookingType = { bookingType: "BOOKLATER" };
      }

      const fifteenMinAgo = new Date(new Date().getTime() - 15 * 60000);
      const queryForRides = {
        vehicleType: driver.vehicleType,
        ...(queryBookingType && { ...queryBookingType }),
        rideStatus: "PENDING",
        BookingStatus: "ACTIVE",
        auctionStatus: "START",
        createdAt: { $gte: fifteenMinAgo },
      };
      const rideList = await rideRequest
        .find({ ...queryForRides })
        .sort({ createdAt: -1 });

      let rideArray = [];
      if (driver.bookingBlock == "BLOCKED") {
        return res.status(400).json({
          responseCode: 400, //bad request
          responseMessage: " You are blocked for cancelling rides  ",
        });
      }

      if (!rideList) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "No Rides are available",
        });
      } else {
        for (let i = 0; i < rideList.length; i++) {
          let a = await rideRequest
            .findById({
              _id: rideList[i]._id,
            })
            .populate({
              path: "userId",
              select: "-rides",
            });
          let distance2 = await getDistanceFromLatLonInKm(
            a.currentLocation.coordinates[0],
            a.currentLocation.coordinates[1],
            driver.currentLocation.coordinates[0],
            driver.currentLocation.coordinates[1]
          );
          if (distance2 <= 15000) {
            rideArray.push(a);
          }
        }
        if (rideArray.length > 0) {
          return res.status(200).json({
            responseCode: SuccessCode.DATA_FOUND,
            result: rideArray,
            responseMessage: SuccessMessage.DATA_FOUND,
          });
        } else {
          return res.status(500).json({
            message: "Ride  not found near you",
            responseCode: ErrorCode.WENT_WRONG,
          });
        }
      }
    } catch (error) {
      return res.status(500).json({
        message: ErrorMessage.INTERNAL_ERROR,
        responseCode: ErrorCode.INTERNAL_ERROR,
      });
    }
  },
  sendFareToRideRequest: async function (req, res) {
    try {
      const rideId = req.body.rideId;
      const driverId = req.driverId;
      const fare = req.body.fare;

      const ride = await rideRequest.findById(rideId);
      const userData = await userModel.findById(ride.userId);
      if (!ride) {
        return res.status(404).json({
          ErrorCode: ErrorCode.NOT_FOUND,
          ErrorMessage: "Ride does't exist",
        });
      }

      const driver = await driverModel.findById(driverId);
      if (!driver) {
        return res.status(404).json({
          ErrorCode: ErrorCode.NOT_FOUND,
          ErrorMessage: "Driver does not exist",
        });
      }

      const isFareAlreadySent = ride.driversWithFares.some((dwf) =>
        dwf.driverId.equals(driverId)
      );
      if (isFareAlreadySent) {
        return res.status(400).json({
          ErrorMessage: "Driver has already sent the fare for this ride",
          ErrorCode: ErrorCode.ALREADY_EXIST,
        });
      }

      const update = {
        $addToSet: {
          driversWithFares: {
            driverId,
            fare,
          },
        },
      };

      const updatedRide = await rideRequest.findByIdAndUpdate(rideId, update, {
        new: true,
      });
      if (!updatedRide) {
        return res.status(500).json({
          ErrorMessage: "Something went wrong while updating ride",
          ErrorCode: ErrorCode.SOMETHING_WRONG,
        });
      }
      
      // send to user
        const message = 'NEWBID'; 
        const io = req.app.get('socketio');    
        sendBidFareToUser(io, message,userData.socketId);

      res.status(200).json({
        responseMessage: "Fare updated successfully",
        responseCode: 200,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ErrorMessage: ErrorMessage.WENT_WRONG,
        ErrorCode: ErrorCode.WENT_WRONG,
      });
    }
  },

  viewRideChatForProvider: async (req, res) => {
    try {
      let userData = await userModel.findOne({
        _id: req.userId,
        userType: "PROVIDER",
      });
      if (!userData) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      } else {
        let findChat = await rideChat.findOne({
          driverId: userData._id,
          auctionStatus: "START",
          rideId: req.query.rideId,
        });
        if (!findChat) {
          response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.NOT_FOUND);
        } else {
          response(
            res,
            SuccessCode.SUCCESS,
            findChat,
            SuccessMessage.DATA_FOUND
          );
        }
      }
    } catch (error) {
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },
  acceptProposalFromDriverSide: async (req, res) => {
    try {
      let userData = await userModel.findOne({
        _id: req.userId,
        userType: "PROVIDER",
      });
      if (!userData) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      } else {
        let findRideChat = await rideChat.find({ rideId: req.body.rideId });
        if (findRideChat.length == 0) {
          response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
        } else {
          for (let i = 0; i < findRideChat.length; i++) {
            const findChatId = findRideChat[i]._id;
            if (findChatId == req.body.chatId) {
              let findRequest = await rideChat.findOne({
                _id: req.body.chatId,
              });
              if (findRequest) {
                for (let i = 0; i < findRequest.commentHistory.length; i++) {
                  const element = findRequest.commentHistory[i]._id;
                  if (element == req.body.commentId) {
                    let updateRequest = await rideChat.findOneAndUpdate(
                      {
                        _id: findRequest._id,
                        "commentHistory._id": req.body.commentId,
                      },
                      {
                        $set: {
                          "commentHistory.$.bidStatus": "ACCEPTED",
                          bidStatus: "ACCEPTED",
                          auctionStatus: "CLOSE",
                        },
                      },
                      { new: true }
                    );
                    let driverId = updateRequest.driverId;
                    let driverData = await userModel.findOne({
                      _id: driverId,
                      userType: "PROVIDER",
                    });
                    let customerData = await userModel.findOne({
                      _id: findRequest.userId,
                      userType: "CUSTOMER",
                    });
                    let price = findRequest.commentHistory[i].comment;
                    let obj = {
                      driverId: driverId,
                      userId: findRequest.userId,
                      rideId: findRequest.rideId,
                      messageDetail: [
                        {
                          sender: driverId,
                          userName: driverData.name,
                          Type: "TEXT",
                          message:
                            "Thank you, for choosing my service for ride.",
                          time: Date.now(),
                        },
                      ],
                    };
                    let rideData = await rideRequest.findOne({
                      _id: findRequest.rideId,
                    });
                    let vehicleDetails = await vehicleType.findOne({
                      _id: rideData.vehicleType,
                    });
                    let rideGenId = rideData._id.toString();
                    let first = rideGenId.substr(6, 10);
                    let vehicle = vehicleDetails.vehicleName;
                    let Second = vehicle.substr(0, 3);
                    let bookingId = `B${first}${Second}`;
                    let bookingObj = {
                      userId: findRequest.userId,
                      drivers: driverId,
                      rideId: rideData._id,
                      dateTime: rideData.dateTime,
                      bookingId: bookingId,
                      amount: price,
                      vehicleType: rideData.vehicleType,
                      description: rideData.description || "",
                      startLocation: rideData.startLocation,
                      endLocation: rideData.endLocation,
                      currentLocation: rideData.currentLocation,
                      destinationLocation: rideData.destinationLocation,
                    };
                    let bookingSave = await bookingModel(bookingObj).save();
                    if (bookingSave) {
                      let subject = "Accept request.";
                      let body = `Dear ${driverData.name} your have request has been accepted by user.`;
                      if (
                        driverData.deviceToken != null ||
                        driverData.deviceToken != undefined
                      ) {
                        let result = await commonFunction.pushNotification(
                          driverData.deviceToken,
                          driverData.deviceType,
                          subject,
                          body
                        );
                        if (result) {
                          let obj2 = {
                            userId: findRequest.userId,
                            title: subject,
                            body: body,
                            requestId: findRequest._id,
                            driverId: bookingSave.drivers,
                            notificationType: "SMS",
                          };
                          var notif = await notification.create(obj2);
                          if (!notif) {
                            response(
                              ErrorCode.WENT_WRONG,
                              {},
                              ErrorMessage.SOMETHING_WRONG
                            );
                          } else {
                            let chatData = await chatModel(obj).save();
                            if (chatData) {
                              let messageDetail = [
                                {
                                  sender: customerData._id,
                                  userName: customerData.name,
                                  Type: "TEXT",
                                  message: customerData.mobileNumber,
                                  time: Date.now(),
                                },
                                {
                                  sender: driverId,
                                  userName: driverData.name,
                                  Type: "TEXT",
                                  message: driverData.mobileNumber,
                                  time: Date.now(),
                                },
                              ];
                              for (let i = 0; i < messageDetail.length; i++) {
                                await chatModel.findByIdAndUpdate(
                                  { _id: chatData._id },
                                  {
                                    $push: { messageDetail: messageDetail[i] },
                                  },
                                  { new: true }
                                );
                              }
                            }
                          }
                        }
                      } else {
                        let obj2 = {
                          userId: findRequest.userId,
                          title: subject,
                          body: body,
                          requestId: findRequest._id,
                          driverId: bookingSave.drivers,
                          notificationType: "SMS",
                        };
                        var notif = await notification.create(obj2);
                        if (!notif) {
                          response(
                            ErrorCode.WENT_WRONG,
                            {},
                            ErrorMessage.SOMETHING_WRONG
                          );
                        } else {
                          let chatData = await chatModel(obj).save();
                          if (chatData) {
                            let messageDetail = [
                              {
                                sender: customerData._id,
                                userName: customerData.name,
                                Type: "TEXT",
                                message: customerData.mobileNumber,
                                time: Date.now(),
                              },
                              {
                                sender: driverId,
                                userName: driverData.name,
                                Type: "TEXT",
                                message: driverData.mobileNumber,
                                time: Date.now(),
                              },
                            ];
                            for (let i = 0; i < messageDetail.length; i++) {
                              await chatModel.findByIdAndUpdate(
                                { _id: chatData._id },
                                { $push: { messageDetail: messageDetail[i] } },
                                { new: true }
                              );
                            }
                          }
                        }
                      }
                    }
                  } else {
                    await rideChat.findOneAndUpdate(
                      { _id: findRequest._id, "commentHistory._id": element },
                      {
                        $set: {
                          "commentHistory.$.bidStatus": "REJECTED",
                          auctionStatus: "CLOSE",
                        },
                      },
                      { new: true }
                    );
                  }
                }
              }
            } else {
              await rideChat.findByIdAndUpdate(
                { _id: findChatId },
                { $set: { bidStatus: "REJECTED", auctionStatus: "CLOSE" } },
                { new: true }
              );
            }
          }
          let a = await rideRequest.findOneAndUpdate(
            { _id: req.body.rideId },
            { $set: { auctionStatus: "CLOSE" } },
            { new: true }
          );
          if (a) {
            const months = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];
            let d = new Date();
            let hour = d.getHours();
            let minute = d.getMinutes();
            let second = d.getSeconds();
            let date = d.getDate();
            let month = months[d.getMonth()];
            let year = d.getFullYear();
            let fullDate = await dateTimeCalculate(
              date,
              month,
              year,
              hour,
              minute,
              second
            );
            let b = await rideSummary.findOneAndUpdate(
              { rideId: req.body.rideId },
              { $set: { bookingConfirm: fullDate } },
              { new: true }
            );
            response(res, SuccessCode.SUCCESS, a, "Accept ride proposal.");
          }
        }
      }
    } catch (error) {
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },

  //========================  this api for admin panel admin can see all data like vehicle Aadhar========================//
  getDriverByIdWithAllData: async function (req, res) {
    try {
      let id = req.params.driverId;
      let query = {
        _id: mongoose.Types.ObjectId(id),
      };
      let driverId = mongoose.Types.ObjectId(id);

      let arr = [
        {
          $match: query,
        },
        {
          $lookup: {
            from: "aadhardocuments",
            localField: "_id",
            foreignField: "driverId",
            as: "aadharDocumentId",
          },
        },
        {
          $unwind: {
            path: "$aadharDocumentId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vehicledocuments",
            localField: "_id",
            foreignField: "driverId",
            as: "documentId",
          },
        },
        {
          $unwind: {
            path: "$documentId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "drivinglicenses",
            localField: "_id",
            foreignField: "driverId",
            as: "DrivingLicenseId",
          },
        },
        {
          $unwind: {
            path: "$DrivingLicenseId",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];
      let getData = await driverModel.aggregate(arr);
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.DETAIL_GET,
        result: getData,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  //======================= Share Emergency Number section  ===========================//
  createEmergencyContacts: async (req, res) => {
    try {
      const { firstPhone, secondPhone } = req.body;
      const existingContact = await EmergencyContact.findOne({ secondPhone });
      if (existingContact) {
        return res
          .status(400)
          .json({ error: "Contact with this phone number already exists." });
      }
      const newContact = new EmergencyContact({ firstPhone, secondPhone });
      const savedContact = await newContact.save();
      res.status(201).json(savedContact);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getEmergencyContacts: async (req, res) => {
    try {
      const contacts = await EmergencyContact.find({
        $sort: { createdAt: -1 },
      });
      res.status(200).json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  updateEmergencyContacts: async (req, res) => {
    try {
      const { firstPhone, secondPhone } = req.body;
      const { driverId } = req.params;
      const updatedContact = await EmergencyContact.findOneAndUpdate(
        { driverId },
        { firstPhone, secondPhone },
        { new: true }
      );
      if (!updatedContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.status(200).json(updatedContact);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deleteEmergencyContacts: async (req, res) => {
    try {
      const deletedContact = await EmergencyContact.findByIdAndDelete(
        req.params.id
      );
      if (!deletedContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.status(204).end(); // No content in the response
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  //======================= Aadhar section  ===========================//
  addAadhar: async function (req, res) {
    try {
      let driverId = req.driverId;
      let adharData = req.body;
      adharData.driverId = driverId;
      let files = req.files;
      let driverAadhar = await aadharModel.findOne({ driverId: driverId });
      if (driverAadhar) {
        return res.status(ErrorCode.ALREADY_EXIST).json({
          responseCode: ErrorCode.ALREADY_EXIST,
          responseMessage: "you are already added aadhar",
          result: "",
        });
      }
      if (files?.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];
        for (let i = 0; i < files.length; i++) {
          if (!validImageMimeTypes.includes(files[i].mimetype)) {
            return res.status(ErrorCode.BAD_REQUEST).json({
              responseCode: ErrorCode,
              BAD_REQUEST,
              responseMessage: `Please provide a correct image of ${files[i].fieldname} with a valid extension (jpg, jpeg, jpeg2000, png, heic).`,
              result: "",
            });
          }
        }
        let aadharFrontPic = files.filter(
          (img) => img.fieldname === "aadharFrontPic"
        );
        if (aadharFrontPic.length > 0) {
          adharData.aadharFrontPic = await uploadFile(aadharFrontPic[0]);
        }
        let aadharBackPic = files.filter(
          (img) => img.fieldname == "aadharBackPic"
        );
        if (aadharBackPic.length > 0) {
          adharData.aadharBackPic = await uploadFile(aadharBackPic[0]);
        }
      }
      let data = await aadharModel.create(adharData);
      if (!data) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      } else {
        await driverModel.findByIdAndUpdate(driverId, {
          $set: { aadharDocumentUpload: true },
        });
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "successfully Aadhar added",
          result: data,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getAadharData: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      let aadharData = await aadharModel.findOne({ driverId });
      if (!aadharData) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: "",
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_FOUND,
          result: aadharData,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  updateAadhar: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      let updateData = req.body;

     

      let addedAadhar = {};
      let aadharFirstData = req.body;
      aadharFirstData.driverId = driverId;
      let checking1 = await aadharModel.findOne({ driverId });
      if (!checking1) {
        addedAadhar = await aadharModel.create(aadharFirstData);
        if (!addedAadhar) {
          return res.status(500).json({
            responseMessage: "unable to create adhar  document for first time",
          });
        }
      }
      let checking = await aadharModel.findOne({ driverId });
      let files = req.files;
      if (!checking) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Aadhar document not found please upload first",
          result: "",
        });
      }
      if (files?.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];
        for (let i = 0; i < files.length; i++) {
          if (!validImageMimeTypes.includes(files[i].mimetype)) {
            return res.status(ErrorCode.BAD_REQUEST).json({
              responseCode: ErrorCode.BAD_REQUEST,
              responseMessage: `Please provide a correct image of ${files[i].fieldname} with a valid extension (jpg, jpeg, jpeg2000, png, heic).`,
              result: "",
            });
          }
        }

        let aadharFrontPic = files.filter(
          (img) => img.fieldname === "aadharFrontPic"
        );
        if (aadharFrontPic.length > 0) {
          updateData.aadharFrontPic = await uploadFile(aadharFrontPic[0]);
        }
        let aadharBackPic = files.filter(
          (img) => img.fieldname == "aadharBackPic"
        );
        if (aadharBackPic.length > 0) {
          updateData.aadharBackPic = await uploadFile(aadharBackPic[0]);
        }
      }
      let updatedAadhar = await aadharModel.findOneAndUpdate(
        { driverId },
        { $set: updateData },
        { new: true }
      );
      if (updatedAadhar) {
        //******************************populate Method Apply******************************//
        const driver = await driverModel.findById(driverId);
        if (!driver.aadharDocumentId) {
          const updatedDriver = await driverModel.findByIdAndUpdate(driverId, {
            $set: { aadharDocumentId: updatedAadhar._id, 
              aadharDocumentUpload: true,
            },
          });
          if (!updatedDriver) {
            return res.status(500).json({
              responseMessage: "Something went wrong on Update Driver Id",
            });
          }
        }
        //******************************populate Method End******************************//
        // if(updateData.aadharFrontPicStatus == "REJECTED"){
        //   const driver = await driverModel.findById(driverId);
        //   const message = "REJECTED";
        //   const io = req.app.get("socketio");
        //   documentUpdateDriver(io, message, driver.socketId);
        // }
        if(updatedAadhar.aadharFrontPicStatus == "REJECTED" ||
           updatedAadhar.aadharBackPicStatus == "REJECTED" || updatedAadhar.aadharNumberStatus == "REJECTED" ){
            await driverModel.findByIdAndUpdate(driverId, {
              $set: { documentUpload: false },
            });  
          const driver = await driverModel.findById(driverId);
          const message = "REJECTED";
          const io = req.app.get("socketio");
          documentUpdateDriver(io, message, driver.socketId);
        }
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_SAVED,
          result: updatedAadhar,
        });
      } else {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.WENT_WRONG,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  deleteAadhar: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      const driver = await driverModel.findById(driverId);

      if (driver?.aadharDocumentId) {
        const updatedDriver = await driverModel.findByIdAndUpdate(driverId, {
          $unset: { aadharDocumentId: 1 },
        });
        // Check if the update was successful
        if (!updatedDriver) {
          return res.status(500).json({
            responseMessage:
              "Something went wrong on unsetting aadharDocumentId",
          });
        }
      }

      let driverAadhar = await aadharModel.findOne({ driverId: driverId });

      if (!driverAadhar) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Aadhar not found for the given driver ID",
          result: "",
        });
      }

      await aadharModel.findOneAndDelete({ driverId: driverId });

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: "Aadhar deleted successfully",
        result: "",
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  //======================= Driving License section  ===========================//
  createDL: async function (req, res) {
    try {
      let driverId = req.driverId;
      let DLData = req.body;
      DLData.driverId = driverId;
      let files = req.files;
      // =========== for checking duplicate because one driver only add aadhar one time===
      let driverDL = await DLModel.findOne({ driverId: driverId });
      if (driverDL) {
        return res.status(ErrorCode.ALREADY_EXIST).json({
          responseCode: ErrorCode.ALREADY_EXIST,
          responseMessage: "You are Already added Your Driving License",
          result: "",
        });
      }
      if (files?.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];
        for (let i = 0; i < files.length; i++) {
          if (!validImageMimeTypes.includes(files[i].mimetype)) {
            return res.status(ErrorCode.BAD_REQUEST).json({
              responseCode: ErrorCode.BAD_REQUEST,
              responseMessage: `Please provide a correct image of ${files[i].fieldname} with a valid extension (jpg, jpeg, jpeg2000, png, heic).`,
              result: "",
            });
          }
        }
        let DLFrontPic = files.filter((img) => img.fieldname === "DLFrontPic");
        if (DLFrontPic.length > 0) {
          DLData.DLFrontPic = await uploadFile(DLFrontPic[0]);
        }
        let DLBackPic = files.filter((img) => img.fieldname == "DLBackPic");
        if (DLBackPic.length > 0) {
          DLData.DLBackPic = await uploadFile(DLBackPic[0]);
        }
        let DLSelfieWithID = files.filter(
          (img) => img.fieldname == "DLSelfieWithID"
        );
        if (DLSelfieWithID.length > 0) {
          DLData.DLSelfieWithID = await uploadFile(DLSelfieWithID[0]);
        }
      }
      let data = await DLModel.create(DLData);
      if (!data) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      } else {
        await driverModel.findByIdAndUpdate(driverId, {
          $set: { DLDocumentUpload: true },
        });
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Your Driving License has been Added Successfully",
          result: data,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  readDL: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      let driverDL = await DLModel.findOne({ driverId: driverId });

      if (!driverDL) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Driving License details not found",
          result: null,
        });
      }

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        result: driverDL,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getAllDL: async function (req, res) {
    try {
      const condition = {};
      let allDL = await DLModel.find({
        $sort: { createdAt: -1 },
      });

      if (data.search && data.search !== "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [{ DLNumber: new RegExp(data.search, "i") }];
      }

      Object.assign(condition);

      let totalCount = await DLModel.countDocuments(condition);
      totalCount = Math.ceil(totalCount / 10);

      const filterData = await DLModel.aggregate([
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
        { $skip: (Number(allDL.offset) || 0) * (Number(allDL.limit) || 10) },
        { $limit: Number(allDL.limit) || 10 },
      ]);

      if (!filterData) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.WENT_WRONG,
          result: "",
        });
      }

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        count: allDL.length,
        result: allDL,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  updateDL: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      let DLData = req.body;

      let addedDL = {};
      let DLFirstData = req.body;
      DLFirstData.driverId = driverId;
      let checking = await DLModel.findOne({ driverId });
      if (!checking) {
        addedDL = await DLModel.create(DLFirstData);
        if (!addedDL) {
          return res.status(500).json({
            responseMessage:
              "unable to create Driving License  document for first time",
          });
        }
      }

      let files = req.files;
      if (files?.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];
        for (let i = 0; i < files.length; i++) {
          if (!validImageMimeTypes.includes(files[i].mimetype)) {
            return res.status(ErrorCode.BAD_REQUEST).json({
              responseCode: ErrorCode.BAD_REQUEST,
              responseMessage: `Please provide a correct image with a valid extension (jpg, jpeg, jpeg2000, png, heic).`,
              result: "",
            });
          }
        }
        let DLFrontPic = files.find((img) => img.fieldname === "DLFrontPic");
        if (DLFrontPic) {
          DLData.DLFrontPic = await uploadFile(DLFrontPic);
        }
        let DLBackPic = files.find((img) => img.fieldname === "DLBackPic");
        if (DLBackPic) {
          DLData.DLBackPic = await uploadFile(DLBackPic);
        }

        let DLSelfieWithID = files.find(
          (img) => img.fieldname === "DLSelfieWithID"
        );
        if (DLSelfieWithID) {
          DLData.DLSelfieWithID = await uploadFile(DLSelfieWithID);
        }
      }
      let updatedDL = await DLModel.findOneAndUpdate(
        { driverId },
        { $set: DLData },
        { new: true }
      );
      if (!updatedDL) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Driving License details not found for update",
          result: "",
        });
      } else {
        //******************************populate Method Apply******************************//
        const driver = await driverModel.findById(driverId);
        if (!driver.DrivingLicenseId) {
          const updatedDriver = await driverModel.findByIdAndUpdate(driverId, {
            $set: { DrivingLicenseId: updatedDL._id },
          });
          if (!updatedDriver) {
            return res.status(500).json({
              responseMessage: "Something went wrong on Update Driver Id",
            });
          }
        }
        //******************************populate Method End******************************//
        if(updatedDL.DLExpireDateStatus == "REJECTED" ||
          updatedDL.DLSelfieWithIDStatus == "REJECTED" || updatedDL.DLFrontPicStatus == "REJECTED" || updatedDL.DLBackPicStatus == "REJECTED"  ){
            await driverModel.findByIdAndUpdate(driverId, {
              $set: { documentUpload: false },
            });  
            const driver = await driverModel.findById(driverId);
         const message = "REJECTED";
         const io = req.app.get("socketio");
         documentUpdateDriver(io, message, driver.socketId);
        }


        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Driving License details updated successfully",
          result: updatedDL,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  deleteDL: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      const driver = await driverModel.findById(driverId);
      if (!driver) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Driver not found for the given ID",
          result: "",
        });
      }
      if (driver.DrivingLicenseId) {
        const updatedDriver = await driverModel.findByIdAndUpdate(driverId, {
          $unset: { DrivingLicenseId: 1 },
        });
        if (!updatedDriver) {
          return res.status(500).json({
            responseMessage:
              "Something went wrong on unsetting DrivingLicenseId",
          });
        }
      }
      let driverDL = await DLModel.findOne({ driverId: driverId });
      if (!driverDL) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Driving License not found for the given driver ID",
          result: "",
        });
      }
      await DLModel.findOneAndDelete({ driverId: driverId });

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: "Driving License deleted successfully",
        result: "",
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  //=================== this is vehicle section===============//
  createVehicle: async function (req, res) {
    try {
      let driverId = req.driverId;
      let vehicleData = req.body;
      vehicleData.driverId = driverId;
      let files = req.files;

      let checking = await vehicleModel.findOne({ driverId: driverId });
      if (checking) {
        return res.status(ErrorCode.ALREADY_EXIST).json({
          responseCode: ErrorCode.ALREADY_EXIST,
          responseMessage: ErrorMessage.ALREADY_EXIST,
          result: "",
        });
      }
      if (
        !vehicleData.bookingType ||
        !["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"].includes(
          vehicleData.bookingType
        )
      ) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage:
            "Please provide a valid bookingType (BOOKNOW, BOOKLATER, BOTH, FREIGHT).",
          result: "",
        });
      }

      if (files?.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];

        const uploadAndSetImage = async (fieldName, fileKey) => {
          let filteredFiles = files.filter(
            (img) => img.fieldname === fieldName
          );
          if (filteredFiles.length > 0) {
            vehicleData[fileKey] = await uploadFile(filteredFiles[0]);
          }
        };

        for (const [fieldName, fileKey] of [
          ["vehicleFrontPic", "vehicleFrontPic"],
          ["vehicleRightPic", "vehicleRightPic"],
          ["vehicleLeftPic", "vehicleLeftPic"],
          [
            "registrationCertificateFrontPic",
            "registrationCertificateFrontPic",
          ],
          ["registrationCertificateBackPic", "registrationCertificateBackPic"],
          ["permitFirstPagePic", "permitFirstPagePic"],
          ["permitSecondPagePic", "permitSecondPagePic"],
        ]) {
          const file = files.find((img) => img.fieldname === fieldName);
          if (file && !validImageMimeTypes.includes(file.mimetype)) {
            return res.status(ErrorCode.BAD_REQUEST).json({
              responseCode: ErrorCode.BAD_REQUEST,
              responseMessage: `Please provide a correct image of ${fieldName} with a valid extension (jpg, jpeg, jpeg2000, png, heic).`,
              result: "",
            });
          }

          await uploadAndSetImage(fieldName, fileKey);
        }
      }

      vehicleData.bookingType = vehicleData.bookingType.toUpperCase(); // Ensure consistency in bookingType

      let addedVehicle = await vehicleModel.create(vehicleData);
      if (!addedVehicle) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      } else {
        await driverModel.findByIdAndUpdate(driverId, {
          $set: { documentUpload: true },
        });
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          result: addedVehicle,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getVehicleByDriverIdWithDriver: async function (req, res) {
    try {
      let driverId = req.params.driverId;

      let arr = [
        {
          $match: {
            _id: mongoose.Types.ObjectId(driverId),
          },
        },
        {
          $lookup: {
            from: "vehicledocuments",
            localField: "_id",
            foreignField: "driverId",
            as: "vehicleData",
          },
        },
        {
          $unwind: {
            path: "$vehicleData",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];
      let data = await driverModel.aggregate(arr);
      if (data) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_FOUND,
          result: data,
        });
      } else {
        return res.status(ErrorCode.SOMETHING_WRONG).json({
          responseCode: ErrorCode.SOMETHING_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  updateVehicleDataWithDriverId: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      let files = req.files;
      let data = req.body;
      let vehicleData = {};
      let addedVehicle = {};
      let vehicleFirstData = req.body;
      vehicleFirstData.driverId = driverId;

      // For Checking registered driver
      if(data.serviceVehicleId){
        await serviceVehicle.updateOne(
          { _id: data.serviceVehicleId },
          { $addToSet: { driverId: driverId } }
          );
        } 
        //create docs if it doesn't exist
      let checking = await vehicleModel.findOne({ driverId });
      if (!checking) {
        addedVehicle = await vehicleModel.create(vehicleFirstData);
        if (!addedVehicle) {
          return res.status(500).json({
            responseMessage: "unable to create document for first time",
          });
        }
      }
      //updating to driver model service vehicle
      if (data.serviceVehicleId) {
        await driverModel.findOneAndUpdate(
          { _id: driverId },
          { $set: { vehicleType: data.serviceVehicleId } }
        );
      }
      //creating vehicle data
      if (data.vehicleBrand) {
        vehicleData.vehicleBrand = data.vehicleBrand;
      }
      if (data.vehicleColor) {
        vehicleData.vehicleColor = data.vehicleColor;
      }
      if (data.vehicleNumber) {
        vehicleData.vehicleNumber = data.vehicleNumber;
      }
      if (data.bookingType) {
        vehicleData.bookingType = data.bookingType;
      }
      if (data.vehicleModel) {
        vehicleData.vehicleModel = data.vehicleModel;
      }
      if (data.serviceVehicleId) {
        vehicleData.serviceVehicleId = data.serviceVehicleId;
      }
      if (data.vehicleBrandStatus)
        vehicleData.vehicleBrandStatus = data.vehicleBrandStatus;
      if (data.vehicleColorStatus)
        vehicleData.vehicleColorStatus = data.vehicleColorStatus;
      if (data.vehicleNumberStatus)
        vehicleData.vehicleNumberStatus = data.vehicleNumberStatus;
      if (data.vehicleFrontPicStatus)
        vehicleData.vehicleFrontPicStatus = data.vehicleFrontPicStatus;
      if (data.vehicleRightPicStatus)
        vehicleData.vehicleRightPicStatus = data.vehicleRightPicStatus;
      if (data.vehicleLeftPicStatus)
        vehicleData.vehicleLeftPicStatus = data.vehicleLeftPicStatus;
      if (data.RCFrontPicStatus)
        vehicleData.RCFrontPicStatus = data.RCFrontPicStatus;
      if (data.RCBackPicStatus)
        vehicleData.RCBackPicStatus = data.RCBackPicStatus;
      if (data.vehicleModelStatus)
        vehicleData.vehicleModelStatus = data.vehicleModelStatus;
      if (data.permitFirstPagePicStatus)
        vehicleData.permitFirstPagePicStatus = data.permitFirstPagePicStatus;
      if (data.permitSecondPagePicStatus)
        vehicleData.permitSecondPagePicStatus = data.permitSecondPagePicStatus;
      //file cchecks
      if (files?.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];
        for (let i = 0; i < files.length; i++) {
          if (!validImageMimeTypes.includes(files[i].mimetype)) {
            return res.status(ErrorCode.BAD_REQUEST).json({
              responseCode: ErrorCode.BAD_REQUEST,
              responseMessage: `Please provide a correct image of ${files[i].fieldname} with a valid extension (jpg, jpeg, jpeg2000, png, heic).`,
              result: "",
            });
          }
        }
        let vehicleFrontPic = files.filter(
          (img) => img.fieldname === "vehicleFrontPic"
        );
        if (vehicleFrontPic.length > 0) {
          vehicleData.vehicleFrontPic = await uploadFile(vehicleFrontPic[0]);
        }
        let vehicleRightPic = files.filter(
          (img) => img.fieldname == "vehicleRightPic"
        );
        if (vehicleRightPic.length > 0) {
          vehicleData.vehicleRightPic = await uploadFile(vehicleRightPic[0]);
        }

        let vehicleLeftPic = files.filter(
          (img) => img.fieldname === "vehicleLeftPic"
        );
        if (vehicleLeftPic.length > 0) {
          vehicleData.vehicleLeftPic = await uploadFile(vehicleLeftPic[0]);
        }

        let registrationCertificateFrontPic = files.filter(
          (img) => img.fieldname === "registrationCertificateFrontPic"
        );
        if (registrationCertificateFrontPic.length > 0) {
          vehicleData.registrationCertificateFrontPic = await uploadFile(
            registrationCertificateFrontPic[0]
          );
        }

        let registrationCertificateBackPic = files.filter(
          (img) => img.fieldname === "registrationCertificateBackPic"
        );
        if (registrationCertificateBackPic.length > 0) {
          vehicleData.registrationCertificateBackPic = await uploadFile(
            registrationCertificateBackPic[0]
          );
        }
        let permitFirstPagePic = files.filter(
          (img) => img.fieldname === "permitFirstPagePic"
        );
        if (permitFirstPagePic.length > 0) {
          vehicleData.permitFirstPagePic = await uploadFile(
            permitFirstPagePic[0]
          );
        }

        let permitSecondPagePic = files.filter(
          (img) => img.fieldname === "permitSecondPagePic"
        );
        if (permitSecondPagePic.length > 0) {
          vehicleData.permitSecondPagePic = await uploadFile(
            permitSecondPagePic[0]
          );
        }
      }
      let updatedVehicle = await vehicleModel.findOneAndUpdate(
        { driverId: driverId },
        { $set: vehicleData },
        { new: true }
      );
      if (updatedVehicle) {
        //******************************populate Method Apply******************************//
        const driver = await driverModel.findById(driverId);
        if (!driver.documentId) {
          const updatedDriver = await driverModel.findByIdAndUpdate(driverId, {
            $set: { documentId: updatedVehicle._id },
          });
          if (!updatedDriver) {
            return res.status(500).json({
              responseMessage: "Something went wrong on update driver id ",
            });
          }
        }
        //******************************populate Method End******************************//
        
     


        if(updatedVehicle.vehicleBrandStatus == "REJECTED" ||
          updatedVehicle.vehicleColorStatus == "REJECTED" ||
          updatedVehicle.vehicleNumberStatus == "REJECTED" ||
          updatedVehicle.vehicleFrontPicStatus == "REJECTED" ||
          updatedVehicle.vehicleRightPicStatus == "REJECTED" ||
          updatedVehicle.vehicleLeftPicStatus == "REJECTED" ||
          updatedVehicle.RCFrontPicStatus == "REJECTED" ||
          updatedVehicle.RCBackPicStatus == "REJECTED" ||
          updatedVehicle.vehicleModelStatus == "REJECTED" ||
          updatedVehicle.permitFirstPagePicStatus == "REJECTED" ||
          updatedVehicle.permitSecondPagePicStatus == "REJECTED" 
          
          ){
            await driverModel.findByIdAndUpdate(driverId, {
              $set: { documentUpload: false },
            });   
         const driver = await driverModel.findById(driverId);
         const message = "REJECTED";
         const io = req.app.get("socketio");
         documentUpdateDriver(io, message, driver.socketId);
       }

        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessCode.UPDATE_SUCCESS,
          result: updatedVehicle,
        });
      } else {
        return res.status(ErrorCode.SOMETHING_WRONG).json({
          responseCode: ErrorCode.SOMETHING_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  uploadDoc:async function(req,res){
    let driverId = req.driverId;
    const result = await driverModel.findByIdAndUpdate(
      driverId,
      { $set: { documentUpload: true } },
      { new: true } // This option returns the updated document
    );
    return res.status(SuccessCode.SUCCESS).json({
      responseCode: SuccessCode.SUCCESS,
      responseMessage: "Vehicle Document successfully",
      result:result
    }); 
  },
  deleteVehicleDataWithDriverId: async function (req, res) {
    try {
      let driverId = req.params.driverId;
      const driver = await driverModel.findById(driverId);

      if (driver?.documentId) {
        const updatedDriver = await driverModel.findByIdAndUpdate(driverId, {
          $unset: { documentId: 1 },
        });

        if (!updatedDriver) {
          return res.status(500).json({
            responseMessage: "Something went wrong on unsetting documentId",
          });
        }
      }
      if (driver?.vehicleType) {
        const updatedDriver = await driverModel.findByIdAndUpdate(driverId, {
          $unset: { vehicleType: 1 },
        });

        if (!updatedDriver) {
          return res.status(500).json({
            responseMessage: "Something went wrong on unsetting vehicleType",
          });
        }
      }

      let driverVehicleDocument = await vehicleDocument.findOne({
        driverId: driverId,
      });

      if (!driverVehicleDocument) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Vehicle Document not found for the given driver ID",
          result: "",
        });
      }

      await vehicleDocument.findOneAndDelete({ driverId: driverId });

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: "Vehicle Document deleted successfully",
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  //======================= activity===========================//
  createTodayActiveData: async function (req, res) {
    try {
      let driverId = req.driverId;
      let data = {};
      data.driverId = driverId;
      // this is for current date
      const currentDate = new Date();
      data.activeDate = currentDate.toLocaleDateString();
      // this line for current time
      data.activeTimes = [currentDate.toLocaleTimeString()];

      let findActiveDate = await driverActivity.findOne({
        driverId: driverId,
        activeDate: currentDate.toLocaleDateString(),
      });

      if (
        findActiveDate &&
        findActiveDate.activeDate == currentDate.toLocaleDateString()
      ) {
        findActiveDate.activeTimes.push(currentDate.toLocaleTimeString());

        let setData = await driverActivity.findOneAndUpdate(
          { driverId: driverId, activeDate: currentDate.toLocaleDateString() },
          findActiveDate,
          { new: true }
        );

        if (setData) {
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: SuccessMessage.DATA_SAVED,
            result: setData,
          });
        }
      } else {
        let resultDat = await driverActivity.create(data);
        if (resultDat) {
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: SuccessMessage.SUCCESS,
            result: resultDat,
          });
        }
      }

      return res.status(ErrorCode.WENT_WRONG).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.WENT_WRONG,
        result: "",
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getTodayAllActiveDriver: async function (req, res) {
    try {
      let data = req.query;
      let condition = {};
      if (data.search && data.search != "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [
          {
            "driverActivity.name": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.mobileNumber": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.docsStatus": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.documentUpload": new RegExp(data.search, "i"),
          },
        ];
      }
      let today = new Date().toLocaleDateString();
      let arr = [
        { $match: { activeDate: today } },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driversActivity",
          },
        },
        {
          $unwind: {
            path: "$driversActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
        { $skip: Number(data.offset) || 0 },
        { $limit: Number(data.limit) || 10 },
      ];
      let getAllData = await driverActivity.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Today Active Driver not Found",
          count: 0,
          result: [],
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          count: getAllData.length,
          result: getAllData,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getAllYesterdayActiveDriver: async function (req, res) {
    try {
      let data = req.query;
      let condition = {};
      if (data.search && data.search != "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [
          {
            "driverActivity.name": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.mobileNumber": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.documentUpload": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.docsStatus": new RegExp(data.search, "i"),
          },
        ];
      }
      let today = new Date();
      let yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      let arr = [
        { $match: { activeDate: yesterday.toLocaleDateString() } },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driversActivity",
          },
        },
        {
          $unwind: {
            path: "$driversActivity",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        { $skip: Number(data.offset) || 0 },
        { $limit: Number(data.limit) || 10 },
      ];

      let getAllData = await driverActivity.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Yesterday Active Driver Not Found",
          count: 0,
          result: [],
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_FOUND,
          count: getAllData.length,
          result: getAllData,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getAllActiveDriverBeforeYesterday: async function (req, res) {
    try {
      let data = req.query;
      let condition = {};
      if (data.search && data.search != "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [
          {
            "driverActivity.name": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.mobileNumber": new RegExp(data.search, "i"),
          },
          {
            "driverActivity.documentUpload": new RegExp(
              Boolean(data.search),
              "i"
            ),
          },
          {
            "driverActivity.docsStatus": new RegExp(data.search, "i"),
          },
        ];
      }

      let today = new Date();
      let beforeYesterday = new Date(today);
      beforeYesterday.setDate(today.getDate() - 2);
      let arr = [
        { $match: { activeDate: beforeYesterday.toLocaleDateString() } },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driversActivity",
          },
        },
        {
          $unwind: {
            path: "$driversActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
        { $skip: Number(data.offset) || 0 },
        { $limit: Number(data.limit) || 10 },
      ];
      let getAllData = await driverActivity.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Before Yesterday Active Driver Not Found",
          count: getAllData.length,
          result: getAllData,
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_FOUND,
          count: getAllData.length,
          result: getAllData,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getAllActiveDriverPast3rdDay: async function (req, res) {
    try {
      let data = req.query;
      let condition = {};
      if (data.search && data.search != "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [
          {
            "usersActivity.name": new RegExp(data.search, "i"),
          },
          {
            "usersActivity.mobileNumber": new RegExp(data.search, "i"),
          },
          {
            activeTimes: new RegExp(data.search, "i"),
          },
        ];
      }
      let today = new Date();
      let Past3rdDay = new Date(today);
      Past3rdDay.setDate(today.getDate() - 3);
      let arr = [
        { $match: { activeDate: Past3rdDay.toLocaleDateString() } },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driversActivity",
          },
        },
        {
          $unwind: {
            path: "$driversActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
      ];
      let getAllData = await driverActivity.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Before Yesterday's Active Driver Not Found",
          count: 0,
          result: [],
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          count: getAllData.length,
          result: getAllData,
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  getAllActiveDriverBeforeThreeDay: async function (req, res) {
    try {
      let today = new Date();
      let Past3rdDay = new Date(today);
      Past3rdDay.setDate(today.getDate() - 3);
      let beforeYesterday = new Date(today);
      beforeYesterday.setDate(today.getDate() - 2);

      let yesturday = new Date(today);
      yesturday.setDate(today.getDate() - 1);

      let data = req.query;
      let condition = {};
      if (data.search && data.search != "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [
          {
            activeDate: new RegExp(data.search, "i"),
          },
        ];
      }
      condition.$nor = [
        { activeDate: today.toLocaleDateString() },
        { activeDate: yesturday.toLocaleDateString() },
        { activeDate: beforeYesterday.toLocaleDateString() },
        { activeDate: Past3rdDay.toLocaleDateString() },
      ];
      let arr = [
        {
          $match: condition,
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driversActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
      ];
      let allActiveUser = await driverActivity.aggregate(arr);
      if (allActiveUser) {
        return res.json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          count: allActiveUser.length,
          result: allActiveUser,
        });
      } else {
        allActiveUser = await driverActivity.aggregate(arr);
        if (allActiveUser) {
          return res.json({
            responseCode: SuccessCode.SUCCESS,
            responseMessage: SuccessMessage.SUCCESS,
            count: allActiveUser.length,
            result: allActiveUser,
          });
        } else {
          return res.json({
            responseCode: ErrorCode.WENT_WRONG,
            responseMessage: ErrorMessage.SOMETHING_WRONG,
            result: "",
          });
        }
      }
    } catch (error) {
      return res.json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getAllDriverOfBeforeTodayRegisterCount: async (req, res) => {
    try {
      const accountVerify = false;
      const condition = {
        accountVerify: accountVerify,
      };
      const registerDrivers = await driverModel
        .find(condition)
        .sort({ createdAt: -1 })
        .limit(10);
      if (registerDrivers.length === 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Register Driver Not Found",
          count: 0,
          result: [],
        });
      }
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.REGISTER_DRIVER_FOUND,
        count: registerDrivers.length,
        result: registerDrivers,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },

  //_______________________________Driver Wallet_______________________________//
  addMoneyToWallet: async (req, res) => {
    try {
      const { driverId, amount ,payment_id } = req.body;

      if (!driverId || !amount || isNaN(amount)) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: "Invalid request data",
          result: "",
        });
      }

       await driverModel.findByIdAndUpdate(
        driverId,
        { $inc: { walletBalance: amount } },
        { new: true }
      );

      // const order = await commonFunction.razorpay.orders.create({
      //   amount: amount,
      //   currency: "INR",
      //   receipt: `wallet_recharge_${Date.now()}`,
      //   payment_capture: 1,
      // });

      const transaction = new driverTransaction({
        driverId,
        amount,
        status: "SUCCESS",
        payment_id: payment_id,
        orderId: payment_id,
      });
      await transaction.save();
     // res.status(200).json({ amount });
    } catch (error) {
      console.error("Error adding money to wallet:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  paymentVerify: async (req, res) => {
    try {
      const { payment_id, status } = req.body;

      if (!status) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: "Invalid status value",
          result: "",
        });
      }

      const transaction = await driverTransaction.findOneAndUpdate(
        { payment_id },
        { $set: { status } },
        { new: true }
      );

      if (!transaction) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Transaction not found",
          result: "",
        });
      }

      if (status === "SUCCESS") {
        const updatedDriver = await driverModel.findByIdAndUpdate(
          transaction.driverId,
          { $inc: { walletBalance: transaction.amount } },
          { new: true }
        );
      }

      res.status(200).json({ payment_id, status });
    } catch (error) {
      console.error("Error updating transaction status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  checkWalletBalance: async (req, res) => {
    try {
      const { driverId } = req.body;
      if (!driverId) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: "Invalid request data",
          result: "",
        });
      }
      const driver = await driverModel.findById(driverId);
      if (!driver) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Driver not found",
          result: "",
        });
      }
      const walletBalance = driver.walletBalance;
      res.status(200).json({ walletBalance });
    } catch (error) {
      console.error("Error checking wallet balance:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getTransactions: async(req,res) =>{
    try {
      let driverId = req.driverId;
      let query = {
        driverId: driverId,
      };
      let driverData = await driverTransaction.find(query);
      res.status(200).json({ driverTransactions : driverData });
    } catch (error) {
      console.error("Error checking wallet balance:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllDriverTransactions: async (req, res) => {
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

      if (data.driverId) {
        condition.driverId = mongoose.Types.ObjectId(data.driverId);
      }

      let totalCount = await driverTransaction.countDocuments(condition);
      let totalTransaction = await driverTransaction.countDocuments();

      totalCount = Math.ceil(totalCount / (Number(data.limit) || 10));
      const allData = await driverTransaction.aggregate([
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
        {
          $lookup: {
            from: "drivers",
            let: { driverId: "$driverId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$driverId"] },
                      
                    ]
                  }
                }
              },
              {
                $project: {
                  _id: 1,
                  mobileNumber: 1
                }
              }
            ],
            as: "driverData"
          }
        }
        
        
        // {
        //   $lookup: {
        //     from: "drivers",
        //     let: { driverId: "$driverId" },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: {
        //             $and: [
        //               { $eq: ["$_id", "$$driverId"] },
        //               {
        //                 $or: [
        //                   {
        //                     mobileNumber: {
        //                       $regex: data.search,
        //                       $options: "i",
        //                     },
        //                   },
        //                   { name: { $regex: data.search, $options: "i" } },
        //                 ],
        //               },
        //             ],
        //           },
        //         },
        //       },
        //     ],
        //     as: "driverData",
        //   },
        // },
        // {
        //   $unwind: "$driverData",
        // },
        // {
        //   $project: {
        //     senderId: 1,
        //     receiverId: 1,
        //     currency: 1,
        //     cardId: 1,
        //     cardId: 1,
        //     bank: 1,
        //     wallet: 1,
        //     vpa: 1,
        //     payerEmail: 1,
        //     payerContact: 1,
        //     amount: 1,
        //     payment_id: 1,
        //     status: 1,
        //     orderId: 1,
        //     method: 1,
        //     bankTransactionId: 1,
        //     transactionId: 1,
        //     dateTime: 1,
        //     driverId: 1,
        //     card: 1,
        //     accountNumber: 1,
        //     ifsc: 1,
        //     upiId: 1,
        //     name: 1,
        //     mobileNumber: 1,
        //     message: 1,
        //     paymentReply: 1,
        //     screenShot: 1,
        //     transactionType: 1,
        //     paymentMethod: 1,

        //     driverId: {
        //       _id: 1,
        //       mobileNumber: 1,
        //     },
        //   },
        // },
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
        Total_Transaction: totalTransaction,
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
};

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
  var d = R * c; // Distance in km
  return d;
};
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
const datetimeCalulate = async (date, month, year, hr, min, sec) => {
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
