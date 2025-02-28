const userModel = require("../models/userModel");
const indiaState = require("../models/selectedState");
const stateWisecity = require("../models/stateWiseCity");
const slectedCity = require("../models/selectedCity");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { commonResponse: response } = require("../helper/commonResponseHandler");
const { ErrorMessage } = require("../helper/message");
const { ErrorCode } = require("../helper/statusCode");
const { SuccessMessage } = require("../helper/message");
const { SuccessCode } = require("../helper/statusCode");
const commonFunction = require("../helper/commonFunction");
const bcrypt = require("bcryptjs");
const { uploadFile } = require("../middleware/aws");
const moment = require("moment");
const selectedCity = require("../models/selectedCity");
const util = require("util");
const verifyAsync = util.promisify(jwt.verify);

module.exports = {
  loginAdmin: async (req, res) => {
    try {
      userModel.findOne(
        {
          mobileNumber: req.body.mobileNumber,
          userType: "ADMIN",
          status: { $ne: "DELETE" },
        },
        async (err, result) => {
          if (err) {
            response(
              res,
              ErrorCode.INTERNAL_ERROR,
              err,
              ErrorMessage.INTERNAL_ERROR
            );
          } else if (!result) {
          /********************************************CHECK EMAIL IN DB**********************************/
            response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
          } else {
            /*******************************************COMPARE PASSWORD***********************************/
            const jwtAdminSignature = process.env.JWT_ADMIN_SIGNATURE;
            let value = bcrypt.compareSync(req.body.password, result.password);
            if (value == true) {
              var token = jwt.sign(
                { _id: result._id, mobileNumber: result.mobileNumber },
                jwtAdminSignature,
                { expiresIn: "5h" }
              );
              let obj1;
              if (req.body.deviceToken && req.body.deviceType) {
                let obj = {
                  deviceToken: req.body.deviceToken,
                  deviceType: req.body.deviceType,
                };
                userModel.findByIdAndUpdate(
                  { _id: result._id },
                  { $set: obj },
                  { new: true },
                  (loginErr, loginRes) => {
                    if (loginErr) {
                      response(
                        res,
                        ErrorCode.INTERNAL_ERROR,
                        loginErr,
                        ErrorMessage.INTERNAL_ERROR
                      );
                    } else {
                      obj1 = {
                        _id: loginRes._id,
                        name: loginRes.name,
                        countryCode: loginRes.countryCode,
                        mobileNumber: loginRes.mobileNumber,
                        userType: loginRes.userType,
                        token: token,
                      };
                      response(
                        res,
                        SuccessCode.SUCCESS,
                        obj1,
                        SuccessMessage.LOGIN_SUCCESS
                      );
                    }
                  }
                );
              } else {
                obj1 = {
                  _id: result._id,
                  name: result.name,
                  countryCode: result.countryCode,
                  mobileNumber: result.mobileNumber,
                  userType: result.userType,
                  token: token,
                };
                response(
                  res,
                  SuccessCode.SUCCESS,
                  obj1,
                  SuccessMessage.LOGIN_SUCCESS
                );
              }
            } else {
              response(
                res,
                ErrorCode.INVALID_CREDENTIAL,
                {},
                ErrorMessage.INVALID_CREDENTIAL
              );
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
  forgetPassword: async (req, res) => {
    try {
      let user = await userModel.findOne({
        mobileNumber: req.body.mobileNumber,
        status: { $ne: "DELETE" },
        userType: "ADMIN",
      });
      if (!user) {
        response(
          res,
          ErrorCode.NOT_FOUND,
          {},
          "Phone number is not registered."
        );
      } else {
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
                  response(
                    res,
                    SuccessCode.SUCCESS,
                    result,
                    SuccessMessage.OTP_SEND
                  );
                }
              }
            );
          })
          .catch((err) => {
            console.log("=====", err);
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
          userType: "ADMIN",
        },
        (err, result) => {
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
            const jwtAdminSignature = process.env.JWT_ADMIN_SIGNATURE;
            var token = jwt.sign(
              { _id: result._id, mobileNumber: result.mobileNumber },
              jwtAdminSignature,
              { expiresIn: "5h" }
            );
            if (result.accountVerify == false) {
              if (result.otp == req.body.otp) {
                var newTime = Date.now();
                var difference = newTime - result.otpTimeExpire;
                if (difference <= 3 * 60 * 1000) {
                  userModel.findByIdAndUpdate(
                    result._id,
                    { accountVerify: true },
                    { new: true },
                    (updateErr, updateResult) => {
                      if (updateErr) {
                        response(
                          res,
                          ErrorCode.INTERNAL_ERROR,
                          updateErr,
                          ErrorMessage.INTERNAL_ERROR
                        );
                      } else {
                        response(
                          res,
                          SuccessCode.SUCCESS,
                          { token },
                          SuccessMessage.VERIFY_OTP
                        );
                      }
                    }
                  );
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
              response(
                res,
                SuccessCode.SUCCESS,
                { token },
                SuccessMessage.CUSTOMER_ALREADY_VERIFY
              );
            }
          }
        }
      );
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
  resendOtp: async (req, res) => {
    try {
      let user = await userModel.findOne({
        mobileNumber: req.body.mobileNumber,
        userType: "ADMIN",
        status: { $ne: "DELETE" },
      });
      if (!user) {
        response(
          res,
          ErrorCode.NOT_FOUND,
          {},
          "Phone number is not registered."
        );
      } else {
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
                  response(res, SuccessCode.SUCCESS, SuccessMessage.OTP_SEND);
                }
              }
            );
          })
          .catch((err) => {
            console.log("=====", err);
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
  resetPassword: async (req, res) => {
    try {
      let user = await userModel.findOne({
        _id: req.userId,
        userType: "ADMIN",
      });

      if (!user) {
        return res.status(ErrorCode.NOT_FOUND).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.USER_NOT_FOUND,
          result: {},
        });
      }

      if (req.body.password !== req.body.confirmPassword) {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: ErrorMessage.PASSWORD_NOT_MATCH,
          result: {},
        });
      }
      req.body.password = bcrypt.hashSync(req.body.password);
      const updateRes = await userModel.findByIdAndUpdate(
        { _id: user._id },
        { $set: { password: req.body.password } },
        { new: true }
      );

      return res.status(SuccessCode.SUCCESS).json({
        responseCode: SuccessCode.SUCCESS,
        responseMessage: SuccessMessage.UPDATE_SUCCESS,
        result: updateRes,
      });
    } catch (error) {
      console.log("error", error);
      return res.status(ErrorCode.WENT_WRONG).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        result: { error },
      });
    }
  },
  changePassword: async (req, res) => {
    try {
      let user = await userModel.findOne({
        _id: req.userId,
        userType: "ADMIN",
      });
      if (!user) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      } else {
        let check = bcrypt.compareSync(req.body.oldPassword, user.password);
        if (check == false) {
          response(
            res,
            ErrorCode.BAD_REQUEST,
            {},
            "Old password doesn't matched."
          );
        } else {
          if (req.body.newPassword == req.body.confirmPassword) {
            req.body.newPassword = bcrypt.hashSync(req.body.newPassword);
            userModel.findByIdAndUpdate(
              { _id: user._id },
              { $set: { password: req.body.newPassword } },
              { new: true },
              (err, result) => {
                if (err) {
                  response(
                    res,
                    ErrorCode.INTERNAL_ERROR,
                    err,
                    ErrorMessage.INTERNAL_ERROR
                  );
                } else {
                  response(
                    res,
                    SuccessCode.SUCCESS,
                    result,
                    SuccessMessage.UPDATE_SUCCESS
                  );
                }
              }
            );
          } else {
            response(res, ErrorCode.BAD_REQUEST, {}, ErrorMessage.PASSMATCH);
          }
        }
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
  viewProfile: (req, res) => {
    try {
      userModel.findOne(
        { _id: req.userId, userType: "ADMIN" },
        (err, adminData) => {
          if (err) {
            response(
              res,
              ErrorCode.INTERNAL_ERROR,
              err,
              ErrorMessage.INTERNAL_ERROR
            );
          } else if (!adminData) {
            response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
          } else {
            response(
              res,
              SuccessCode.SUCCESS,
              adminData,
              SuccessMessage.DATA_FOUND
            );
          }
        }
      );
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
  editProfile: async (req, res) => {
    try {
      let userData = await userModel.findOne({
        _id: req.userId,
        userType: { $in: ["ADMIN"] },
      });
      if (!userData) {
        return response(
          res,
          ErrorCode.NOT_FOUND,
          {},
          ErrorMessage.USER_NOT_FOUND
        );
      }
      const updateFields = {};
      if (req.files && req.files.length > 0) {
        let validImage = req.files[0].mimetype.split("/");
        if (validImage[0] != "image") {
          return res.status(ErrorCode.ALREADY_EXIST).json({
            responseCode: ErrorCode.ALREADY_EXIST,
            responseMessage: "Please provide a correct profile image",
            result: "",
          });
        }
        let img = await uploadFile(req.files[0]);
        updateFields.profilePic = img;
      }
      if (req.body.name) {
        updateFields.name = req.body.name;
      }
      if (req.body.gender) {
        updateFields.gender = req.body.gender;
      }
      updateFields.completeProfile = true;
      let updateResult = await userModel.findByIdAndUpdate(
        { _id: userData._id },
        { $set: updateFields },
        { new: true }
      );
      if (updateResult) {
        return response(
          res,
          SuccessCode.SUCCESS,
          updateResult,
          SuccessMessage.PROFILE_DETAILS
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
  deleteUser: async (req, res) => {
    try {
      let adminResult = await userModel.findOne({
        _id: req.userId,
        userType: "ADMIN",
      });
      if (!adminResult) {
        response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.USER_NOT_FOUND);
      } else {
        let result = await userModel.findOne({
          _id: req.body._id,
          status: { $ne: "DELETE" },
        });
        if (!result) {
          response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.NOT_FOUND);
        } else {
          let updateResult = await userModel.findOneAndUpdate(
            { _id: result._id },
            { $set: { status: "DELETE" } },
            { new: true }
          );
          if (updateResult) {
            if (updateResult.userType == "CUSTOMER") {
              response(
                res,
                SuccessCode.SUCCESS,
                updateResult,
                SuccessMessage.DELETE_SUCCESS
              );
            } else if (updateResult.userType == "PROVIDER") {
              let result1 = await vehicalDocument.find({
                userId: updateResult._id,
              });
              if (result1.length == 0) {
                response(
                  res,
                  SuccessCode.SUCCESS,
                  updateResult,
                  SuccessMessage.DELETE_SUCCESS
                );
              } else {
                for (let i = 0; i < result1.length; i++) {
                  await vehicalDocument.findByIdAndUpdate(
                    { _id: result1[i]._id },
                    { $set: { status: "DELETE" } },
                    { new: true }
                  );
                }
                response(
                  res,
                  SuccessCode.SUCCESS,
                  updateResult,
                  SuccessMessage.DELETE_SUCCESS
                );
              }
            }
          }
        }
      }
    } catch (error) {
      response(res, ErrorCode.WENT_WRONG, {}, ErrorMessage.SOMETHING_WRONG);
    }
  },
  verifyTokenAndAdmin: async (req, res, next) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: "Admin does not found",
        });
      }
      return res.status(200).json({
        responseCode: ErrorCode.DATA_FOUND,
        responseMessage: "Admin Exist",
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
  adminLogout: async function (req, res) {
    try {
      const token = req.headers.token;
      if (!token) {
        return response(res, ErrorCode.BAD_REQUEST, {}, "Token not provided");
      }
      jwt.verify(
        token,
        "SERHIAWXSDKLFJVNADAKERUW83745",
        async (err, decoded) => {
          if (err) {
            return response(res, ErrorCode.UNAUTHORIZED, err, "Invalid token");
          }
          const user = await userModel.findOne({ _id: decoded._id });
          if (!user) {
            return response(res, ErrorCode.NOT_FOUND, {}, "Admin not found");
          }
          return response(
            res,
            SuccessCode.SUCCESS,
            {},
            "Your Account has been Logout Successfully"
          );
        }
      );
    } catch (error) {
      console.error(error);
      return response(res, ErrorCode.WENT_WRONG, error, "Something went wrong");
    }
  },
  
 

};

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
  let fullDate = `${date1}/${month}/${year} ${hr1}:${min1}:${sec1}`;
  return fullDate;
};
