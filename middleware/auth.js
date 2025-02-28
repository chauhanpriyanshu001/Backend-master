const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { commonResponse: response } = require("../helper/commonResponseHandler");
const { ErrorCode } = require("../helper/statusCode");
const { ErrorMessage } = require("../helper/message");
const driverModel = require("../models/driverModel");

module.exports = {
  verifyToken: (req, res, next) => {
    try {
      const jwtUserSignature = process.env.JWT_USER_SIGNATURE;
      jwt.verify(req.headers.token, jwtUserSignature, (err, result) => {
        if (err) {
          response(
            res,
            ErrorCode.INTERNAL_ERROR,
            err,
            ErrorMessage.INTERNAL_ERROR
          );
        } else {
          userModel.findOne({ _id: result._id }, (userErr, userResult) => {
            if (userErr) {
              response(
                res,
                ErrorCode.INTERNAL_ERROR,
                userErr,
                ErrorMessage.INTERNAL_ERROR
              );
            } else if (!userResult) {
              response(res, ErrorCode.NOT_FOUND, {}, "Result not found.");
            } else {
              if (userResult.status == "BLOCK") {
                response(
                  res,
                  ErrorCode.REQUEST_FAILED,
                  {},
                  "Your account has been blocked by admin"
                );
              } else if (userResult.status == "DELETE") {
                response(
                  res,
                  ErrorCode.REQUEST_FAILED,
                  {},
                  "Your account has been deleted."
                );
              } else {
                req.userId = userResult._id;
                next();
              }
            }
          });
        }
      });
    } catch (error) {
      console.log(error);
      response(res, ErrorCode.WENT_WRONG, error, ErrorMessage.SOMETHING_WRONG);
    }
  },
  verifyTokenDriver: (req, res, next) => {
    try {
      const jwtDriverSignature = process.env.JWT_DRIVER_SIGNATURE;
      jwt.verify(req.headers.token, jwtDriverSignature, (err, result) => {
        if (err) {
          response(
            res,
            ErrorCode.INTERNAL_ERROR,
            err,
            ErrorMessage.INTERNAL_ERROR
          );
        } else {
          driverModel.findOne({ _id: result._id }, (userErr, userResult) => {
            if (userErr) {
              response(
                res,
                ErrorCode.INTERNAL_ERROR,
                userErr,
                ErrorMessage.INTERNAL_ERROR
              );
            } else if (!userResult) {
              response(res, ErrorCode.NOT_FOUND, {}, "Result not found.");
            } else {
              if (userResult.status == "BLOCK") {
                response(
                  res,
                  ErrorCode.REQUEST_FAILED,
                  {},
                  "Your account has been blocked by admin"
                );
              } else if (userResult.status == "DELETE") {
                response(
                  res,
                  ErrorCode.REQUEST_FAILED,
                  {},
                  "Your account has been deleted."
                );
              } else {
                req.driverId = userResult._id;
                next();
              }
            }
          });
        }
      });
    } catch (error) {
      console.log(error);
      response(res, ErrorCode.WENT_WRONG, error, ErrorMessage.SOMETHING_WRONG);
    }
  },
  verifyTokenAdmin: (req, res, next) => {
    try {
      const jwtAdminSignature = process.env.JWT_ADMIN_SIGNATURE;
      jwt.verify(req.headers.token, jwtAdminSignature, (err, result) => {
        if (err) {
          response(
            res,
            ErrorCode.INTERNAL_ERROR,
            err,
            ErrorMessage.INTERNAL_ERROR
          );
        } else {
          userModel.findOne({ _id: result._id }, (userErr, userResult) => {
            if (userErr) {
              response(
                res,
                ErrorCode.INTERNAL_ERROR,
                userErr,
                ErrorMessage.INTERNAL_ERROR
              );
            } else if (!userResult) {
              response(res, ErrorCode.NOT_FOUND, {}, "Result not found.");
            } else {
              if (userResult.status == "BLOCK") {
                response(
                  res,
                  ErrorCode.REQUEST_FAILED,
                  {},
                  "Your account has been blocked by admin"
                );
              } else if (userResult.status == "DELETE") {
                response(
                  res,
                  ErrorCode.REQUEST_FAILED,
                  {},
                  "Your account has been deleted."
                );
              } else {
                req.userId = userResult._id;
                next();
              }
            }
          });
        }
      });
    } catch (error) {
      console.log(error);
      response(res, ErrorCode.WENT_WRONG, error, ErrorMessage.SOMETHING_WRONG);
    }
  },
};
