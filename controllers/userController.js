const commonFunction = require("../helper/commonFunction");
const vehicleDocument = require("../models/vehicleDocument");
const { commonResponse: response } = require("../helper/commonResponseHandler");
const { ErrorCode, SuccessCode } = require("../helper/statusCode");
const { SuccessMessage, ErrorMessage } = require("../helper/message");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const userAllActiveDateAndTime = require("../models/userAllActiveDate&Time");
const deletedUser = require("../models/deletedUserModel");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../middleware/aws");
const vehicleModel = require("../models/vehicleModel");
const driverModel = require("../models/driverModel");
const transaction = require("../models/driverTransaction");
const visitorModel = require("../models/visitors");

module.exports = {
  //==============================API for User==============================//
  userLogin: async (req, res, next) => {
    
    try {
      query = {
        mobileNumber: req.body.mobileNumber,
        userType: "CUSTOMER",
        status: { $ne: "DELETE" },
      };

      let user = await userModel.findOne(query);
      if (user) {
        if (user.status == "ACTIVE") {
          req.body.otp = commonFunction.randomOTPGenerate();
          req.body.otpTimeExpire = Date.now();
          var Number = "+91";
          var mobileNumber = Number.concat(req.body.mobileNumber);
          commonFunction
            .sendMobileOtp(mobileNumber, req.body.otp)
            .then((smsResult) => {
              userModel.findByIdAndUpdate(
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
                      name:user.name
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
            new userModel(req.body).save((err, result) => {
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
      userModel.findOne(
        {
          mobileNumber: req.body.mobileNumber,
          status: { $ne: "DELETE" },
          userType: "CUSTOMER",
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
            const jwtSignature = process.env.JWT_USER_SIGNATURE;
            var token = jwt.sign(
              { _id: result._id, mobileNumber: result.mobileNumber },
              jwtSignature,
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
  editProfile: async (req, res) => {
    try {
      let userData = await userModel.findOne({
        _id: req.userId,
        userType: { $in: ["CUSTOMER", "PROVIDER"] },
      });
      if (!userData) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      }
      if (userData.accountVerify) {
        const updateFields = {};
        if (req.files.length > 0) {
          let validImage = req.files[0].mimetype.split("/");
          if (validImage[0] != "image") {
            return res.status(ErrorCode.ALREADY_EXIST).json({
              responseCode: ErrorCode.ALREADY_EXIST,
              responseMessage: "please provide correct profile img",
              result: "",
            });
          }
          let img = await uploadFile(req.files[0]);
          updateFields.profilePic = img;
        }
        if (req.body.email) {
          updateFields.email = req.body.email;
        }
        if (req.body.name) {
          updateFields.name = req.body.name;
        }
        if (req.body.gender) {
          updateFields.gender = req.body.gender;
        }
        if (
          userData.name ||
          (updateFields.name && userData.profilePic) ||
          (updateFields.profilePic && userData.gender) ||
          (updateFields.gender && userData.email) ||
          updateFields.gender
        ) {
          updateFields.completeProfile = true;
        }
        let updateResult = await userModel.findByIdAndUpdate(
          { _id: userData._id },
          { $set: updateFields },
          { new: true }
        );
        if (updateResult) {
          response(
            res,
            SuccessCode.SUCCESS,
            updateResult,
            SuccessMessage.PROFILE_DETAILS
          );
        }
      } else {
        response(
          res,
          ErrorCode.UNAUTHORIZED,
          {},
          ErrorMessage.OTP_VERIFICATION_REQUIRED
        );
      }
    } catch (error) {
      console.log("Error: ", error);
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },
  viewProfile: async (req, res) => {
    try {
      let userData = await userModel.findOne({
        _id: req.userId,
        userType: "CUSTOMER",
      });
      if (!userData) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
        return;
      }
      response(res, SuccessCode.SUCCESS, userData, SuccessMessage.DATA_FOUND);
    } catch (error) {
      response(
        res,
        ErrorCode.WENT_WRONG,
        { error },
        ErrorMessage.SOMETHING_WRONG
      );
    }
  },
  shareContactNo: async (req, res) => {
    try {
      let userData = await userModel.findOne({
        _id: req.userId,
        userType: "CUSTOMER",
      });
      if (!userData) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      } else {
        let data = await userModel.findById({
          _id: req.params._id,
          userType: "PROVIDER",
        });
        if (!data) {
          response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
        } else {
          let updateUSer = await userModel.findByIdAndUpdate(
            { _id: userData._id },
            { $push: { SharedContact: data._id } },
            { new: true }
          );
          response(
            res,
            SuccessCode.SUCCESS,
            updateUSer,
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
  getUserById: async function (req, res) {
    try {
      let id = req.params.userId;
      let query = {
        _id: id,
        status: { $ne: "DELETE" },
      };
      let getData = await userModel.findOne(query);
      if (!getData) {
        getData = await userModel.findOne(query);
        if (!getData) {
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
        result: getData,
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error,
      });
    }
  },
  deleteUser: async function (req, res) {
    try {
      let userId = req.userId;
      let userdata = await userModel.findById(userId);
      if (userdata) {
        let data = await deletedUser.findOneAndUpdate(
          { _id: userId },
          userdata,
          { new: true, upsert: true }
        );

        if (!data) {
          return res.status(ErrorCode.WENT_WRONG).json({
            responseCode: ErrorCode.WENT_WRONG,
            responseMessage: ErrorMessage.WENT_WRONG,
            result: "",
          });
        } else {
          let checkDeleted = await userModel.findByIdAndDelete(userId);
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
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  updateUserStatus: async function (req, res) {
    try {
      const userId = req.params.userId; 
      const newStatus = req.body.status;

      // Validate the new status
      const validStatusOptions = ["ACTIVE", "BLOCK", "DELETE"];
      if (!validStatusOptions.includes(newStatus)) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage:
            "Invalid status provided. Please provide a valid status.",
          result: "",
        });
      }

      // Find the user by ID
      const user = await userModel.findOne({ _id: userId });

      if (user) {
        user.status = newStatus;

        const updatedUser = await user.save();

        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.UPDATE_SUCCESS,
          result: updatedUser,
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
  createTodayActiveData: async function (req, res) {
    try {
      let userId = req.userId;
      let data = {};
      data.userId = userId;
      const currentDate = new Date();
      data.activeDate = currentDate.toLocaleDateString();
      data.activeTimes = [currentDate.toLocaleTimeString()];

      let findActiveDate = await userAllActiveDateAndTime.findOne({
        userId: userId,
        activeDate: currentDate.toLocaleDateString(),
      });

      if (
        findActiveDate &&
        findActiveDate.activeDate == currentDate.toLocaleDateString()
      ) {
        findActiveDate.activeTimes.push(currentDate.toLocaleTimeString());

        let setData = await userAllActiveDateAndTime.findOneAndUpdate(
          { userId: userId, activeDate: currentDate.toLocaleDateString() },
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
        let resultDat = await userAllActiveDateAndTime.create(data);
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

  //===============================API for ADMIN PANEL===============================//
  getAllUserAndSearchFilter: async function (req, res) {
    try {
      const data = req.query;
      const condition = {};
      const sort = {};

      // Exclude "ADMIN" userType
      condition.userType = { $ne: "ADMIN" };

      if (data.search && data.search !== "") {
        data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        condition.$or = [
          { mobileNumber: new RegExp(data.search, "i") },
          { name: new RegExp(data.search, "i") },
          { status: new RegExp(data.search, "i") },
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
        data.blockStatus &&
        ["BLOCKED", "UNBLOCKED"].includes(data.blockStatus.toUpperCase())
      ) {
        condition.blockStatus = data.blockStatus.toUpperCase();
      }

      const statusCondition = {};
      if (
        data.status &&
        ["ACTIVE", "DELETE", "BLOCK"].includes(data.status.toUpperCase())
      ) {
        statusCondition.status = data.status.toUpperCase();
      }
      Object.assign(condition, statusCondition);
      if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate + "T00:00:00Z");
        const endDate = new Date(data.endDate + "T23:59:59Z");

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          condition.createdAt = {
            $gte: startDate,
            $lte: endDate,
          };
        }
      }

      let totalCount = await userModel.countDocuments(condition);
      let totalUserCount = await userModel.countDocuments();

      totalCount = Math.ceil(totalCount / (Number(data.limit) || 10));
      const allData = await userModel.aggregate([
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
        Total_User_Count: totalUserCount,
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
  getAllDeletedUser: async function (req, res) {
    const ITEMS_PER_PAGE = 10;
    try {
      const page = req.query.page || 1;

      const skip = (page - 1) * ITEMS_PER_PAGE;

      let allDeletedUser = await deletedUser.aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: ITEMS_PER_PAGE,
        },
      ]);

      if (!allDeletedUser || allDeletedUser.length === 0) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
          result: [],
        });
      }

      const totalDocuments = await deletedUser.countDocuments();

      return res.status(200).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.SUCCESS,
        currentPage: page,
        totalPages: Math.ceil(totalDocuments / ITEMS_PER_PAGE),
        totalItems: totalDocuments,
        result: allDeletedUser,
      });
    } catch (error) {
      console.error("Error: ", error);
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  getTodayAllActiveUser: async function (req, res) {
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

      let today = new Date().toLocaleDateString();
      let arr = [
        { $match: { activeDate: today } },

        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "usersActivity",
          },
        },
        {
          $unwind: {
            path: "$usersActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
      ];
      let getAllData = await userAllActiveDateAndTime.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: ErrorMessage.NOT_FOUND,
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
  getAllYesterdayActiveUser: async function (req, res) {
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
            "activeTimes[activeTimes.length-1]": new RegExp(data.search, "i"),
          },
        ];
      }
      let today = new Date();
      let yesturday = new Date(today);
      yesturday.setDate(today.getDate() - 1);

      let arr = [
        { $match: { activeDate: yesturday.toLocaleDateString() } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "usersActivity",
          },
        },
        {
          $unwind: {
            path: "$usersActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
      ];
      let getAllData = await userAllActiveDateAndTime.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Yesterday's Active User Not Found",
          count: 0,
          result: getAllData,
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
  getAllActiveUserBeforeYesterday: async function (req, res) {
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
      let beforeYesterday = new Date(today);
      beforeYesterday.setDate(today.getDate() - 2);
      let arr = [
        { $match: { activeDate: beforeYesterday.toLocaleDateString() } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "usersActivity",
          },
        },
        {
          $unwind: {
            path: "$usersActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
      ];
      let getAllData = await userAllActiveDateAndTime.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Before Yesterday's Active User Not Found",
          count: 0,
          result: [],
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          count: getAllData.length,
          result: getAllData,
          responseMessage: SuccessMessage.SUCCESS,
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
  getAllActiveUserPast3rdDay: async function (req, res) {
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
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "usersActivity",
          },
        },
        {
          $unwind: {
            path: "$usersActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
      ];
      let getAllData = await userAllActiveDateAndTime.aggregate(arr);
      if (getAllData.length == 0) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "Before Yesterday's Active User Not Found",
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
  getAllActiveUserBeforeThreeDay: async function (req, res) {
    try {
      let today = new Date();
      let Past3rdDay = new Date(today);
      Past3rdDay.setDate(today.getDate() - 3);
      // =====
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
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "usersActivity",
          },
        },
        {
          $match: condition,
        },
        {
          $sort: { createdAt: -1 },
        },
      ];
      let allActiveUser = await userAllActiveDateAndTime.aggregate(arr);
      if (allActiveUser) {
        return res.json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          count: allActiveUser.length,
          result: allActiveUser,
        });
      } else {
        allActiveUser = await userAllActiveDateAndTime.aggregate(arr);
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
  getAllUserOfBeforeTodayRegisterCount: async function (req, res) {
    try {
      const date = new Date();
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      const formattedDate = date.toLocaleDateString(undefined, options);

      let count = await userModel.aggregate([
        {
          $project: {
            formattedDate: {
              $dateToString: {
                format: "%d/%m/%Y",
                date: "$createdAt",
              },
            },
          },
        },
        {
          $match: {
            $nor: [{ formattedDate: formattedDate }],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);
      if (count) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          result: count.length,
        });
      } else {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SUCCESS,
          result: "",
        });
      }
    } catch (error) {
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  deleteUserById: async function (req, res) {
    try {
      let userId = req.params.userId;
      let userData = await userModel.findById(userId);
      if (userData) {
        let data = await deletedUser.findOneAndUpdate(
          { _id: userId },
          userData,
          { new: true, upsert: true }
        );

        if (!data) {
          return res.status(ErrorCode.WENT_WRONG).json({
            responseCode: ErrorCode.WENT_WRONG,
            responseMessage: ErrorMessage.WENT_WRONG,
            result: "",
          });
        } else {
          let checkDeleted = await userModel.findByIdAndDelete(userId);
          if (checkDeleted) {
            return res.status(SuccessCode.SUCCESS).json({
              responseCode: SuccessCode.SUCCESS,
              responseMessage: SuccessMessage.SUCCESS,
              result: "User Delete successfully By Admin !!",
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
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  updateBlokeStatus: async function (req, res) {
    try {
      let blockStatus = req.body.blockStatus;
      let userId = req.params.userId;

      let update = await userModel.findByIdAndUpdate(
        userId,
        { $set: { blockStatus: blockStatus } },
        { new: true }
      );
      if (!update) {
        return res.status(ErrorCode.WENT_WRONG).json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.UPDATE_SUCCESS,
          result: update,
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

  //===============================API for User Bid By Id===============================//
  getUserByIdWithLastRide: async function (req, res) {
    try {
      let userId = req.params.userId;
      let query = {
        _id: mongoose.Types.ObjectId(userId),
        status: { $ne: "DELETE" },
      };
      let data = {};

      // ================ aggregation====================
      let arr = [
        {
          $match: query,
        },
        {
          $lookup: {
            from: "riderequests",
            localField: "_id",
            foreignField: "userId",
            as: "lastRide",
          },
        },
        {
          $unwind: {
            path: "$lastRide",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            lastRide: -1,
          },
        },
        {
          $match: {
            "lastRide.auctionStatus": "COMPLETED",
          },
        },
        {
          $limit: 1,
        },
      ];

      let arrData = await userModel.aggregate(arr);
      if (arrData) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          result: arrData,
        });
      } else {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: ErrorMessage.BAD_REQUEST,
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

  //===============================Vehicle API for ADMIN PANEL===============================//
  createVehicle: async function (req, res) {
    try {
      let data = req.body;
      let files = req.files;

      // ======= img=======
      if (files && files.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];
        const file = files[0];

        if (validImageMimeTypes.includes(file.mimetype)) {
          let img = await uploadFile(file);
          data.vehiclePic = img;
        } else {
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: ErrorCode.NOT_ACCEPTABLE,
            responseMessage:
              "Please provide a correct image with a valid extension (jpg, jpeg, jpeg2000, png, heic).",
            result: "",
          });
        }
      }

      if (
        data.bookingType &&
        ["BOOKNOW", "BOOKLATER", "BOTH", "FREIGHT"].includes(data.bookingType)
      ) {
        let createdVehicleData = await vehicleModel.create(data);
        if (!createdVehicleData) {
          return res.status(SuccessCode.SUCCESS).json({
            responseCode: ErrorCode.INTERNAL_ERROR,
            responseMessage: ErrorMessage.INTERNAL_ERROR,
            result: "",
          });
        } else {
          createdVehicleData.bookingType = data.bookingType;

          return res.status(SuccessCode.SUCCESS).json({
            responseCode: SuccessCode.CREATION,
            responseMessage: "vehicle added successfully",
            result: createdVehicleData,
          });
        }
      } else {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: ErrorMessage.BAD_REQUEST,
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
  getAllVehicle: async function (req, res) {
    try {
      let allVehicle = await vehicleModel.find().sort({ createdAt: -1 });
      if (!allVehicle) {
        allVehicle = await vehicleModel.find().sort({ createdAt: -1 });
      }

      if (!allVehicle) {
        return res.status(ErrorCode.INTERNAL_ERROR).json({
          responseCode: ErrorCode.INTERNAL_ERROR,
          responseMessage: ErrorMessage.INTERNAL_ERROR,
          result: "",
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.SUCCESS,
          count: allVehicle.length,
          result: allVehicle,
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
  updateVehicle: async (req, res) => {
    try {
      let data = req.body;
      let vehicleId = req.params.vehicleId;
      let files = req.files;
      
      // ======= img=======
      if (files && files.length > 0) {
        const validImageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/jpeg2000",
          "image/png",
          "image/heic",
        ];
        const file = files[0];

        if (validImageMimeTypes.includes(file.mimetype)) {
          let img = await uploadFile(file);
          data.vehiclePic = img;
        } else {
          return res.status(ErrorCode.NOT_ACCEPTABLE).json({
            responseCode: ErrorCode.NOT_ACCEPTABLE,
            responseMessage:
              "Please provide a correct image with a valid extension (jpg, jpeg, jpeg2000, png, heic).",
            result: "",
          });
        }
      }
      let updatedVehicle = await vehicleModel.findOneAndUpdate(
        { _id: vehicleId },
        { $set: data },
        { new: true }
      );

      if (!updatedVehicle) {
        return res.status(ErrorCode.INTERNAL_ERROR).json({
          responseCode: ErrorCode.INTERNAL_ERROR,
          responseMessage: ErrorMessage.INTERNAL_ERROR,
          result: "",
        });
      } else {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: "vehicle updated successfully",
          result: updatedVehicle,
        });
      }
    } catch (error) {
      return res.status(SuccessCode.SUCCESS).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
  deleteVehicle: async function (req, res) {
    try {
      let vehicleId = req.params.vehicleId;
      let deletedVehicle = await vehicleModel.findOneAndDelete({
        _id: vehicleId,
      });

      if (deletedVehicle) {
        return res.status(SuccessCode.SUCCESS).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DELETE_SUCCESS,
          result: deletedVehicle,
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

  verifyTokenAndUser: async (req, res, next) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "User does not found",
        });
      }
      return res.status(200).json({
        responseCode: ErrorCode.DATA_FOUND,
        responseMessage: "User Exist",
      });
    } catch (error) {
      console.log(error);
      return res.status(501).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: error,
      });
    }
  },
  visited: async (req, res, next) => {
    try {
      let field = await visitorModel.findOne();
      if (!field) {
        field = await visitorModel.create({
          website: 0,
          android: 0,
          ios: 0,
        });
      }
      console.log(field);
      const value = field.website + 1;
      const updatedField = await visitorModel.findOneAndUpdate(
        { _id: field._id },
        { website: value }
      );
      if (updatedField) {
        return res.status(200).json({
          responseMessage: "Marked visited successfully",
        });
      }
      return res.status(500).json({
        responseMessage: "something went wrong while update field",
      });
    } catch (error) {
      console.log(error);
      return res.status(501).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: error,
      });
    }
  },
  getVisitor: async (req, res, next) => {
    console.log(req);
    try {
      let field = await visitorModel.findOne();
      if (field) {
        return res.status(200).json({
          responseMessage: "Success in fetching",
          field,
        });
      }
      return res.status(500).json({
        responseMessage: "something went wrong in getting",
      });
    } catch (error) {
      console.log(error);
      return res.status(501).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: error,
      });
    }
  },

  verifyTokenAndUser: async (req, res, next) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "User does not found",
        });
      }
      return res.status(200).json({
        responseCode: ErrorCode.DATA_FOUND,
        responseMessage: "User Exist",
      });
    } catch (error) {
      console.log(error);
      res.status(501).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: error,
      });
    }
  },
  logoutUser: async function (req, res) {
    try {
      const token = req.headers.token;
      if (!token) {
        return response(res, ErrorCode.BAD_REQUEST, {}, "Token not provided");
      }

      const jwtSignature = process.env.JWT_USER_SIGNATURE;
      jwt.verify(token, jwtSignature, async (err, decoded) => {
        if (err) {
          return response(res, ErrorCode.UNAUTHORIZED, err, "Invalid token");
        }
        const user = await userModel.findOne({ _id: decoded._id });
        if (!user) {
          return response(res, ErrorCode.NOT_FOUND, {}, "User not found");
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
const hasNumber = async (myString) => {
  let a = /\d/.test(myString);
  return a;
};
