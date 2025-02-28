const mongoose = require("mongoose");
const userRideRating = require("../models/userRideRating");
const { SuccessCode, ErrorCode } = require("../helper/statusCode");
const { SuccessMessage, ErrorMessage } = require("../helper/message");

module.exports = {
  createUserRating: async function (req, res) {
    try {
      let data = req.body;
      data.driverId = req.params.driverId;
      let ratingData = await userRideRating.create(data);

      if (ratingData) {
        return res.status(SuccessCode.CREATION).json({
          responseCode: SuccessCode.CREATION,
          responseMessage: SuccessMessage.RATING_CREATE,
          result: ratingData,
        });
      }
      return res.status(ErrorCode.WENT_WRONG).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.WENT_WRONG,
        result: " ",
      });
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },

  getAvgUserRatings: async function (req, res) {
    try {
      const userId = req.params.userId;
      const ratings = await userRideRating.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$userId",
            averageRating: { $avg: "$rating" },
            rating: { $push: "$$ROOT" },
          },
        },
      ]);
      if (ratings.length > 0) {
        const roundedAverageRating = parseFloat(
          ratings[0].averageRating.toFixed(1)
        );
        return res.status(200).json({
          success: true,
          averageRating: roundedAverageRating,
          rating: ratings[0].ratings,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "No Rating found for this User",
        });
      }
    } catch (error) {
      console.log("Error is fetching User Rating:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  getAnalysisRating: async function (req, res) {
    try {
      let arr = [
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            rating: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ];
      let ratingData = await userRideRating.aggregate(arr);
      if (ratingData) {
        return res.status(200).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_FOUND,
          return: ratingData,
        });
      } else {
        return res.status(ErrorCode.BAD_REQUEST).json({
          responseCode: ErrorCode.BAD_REQUEST,
          responseMessage: ErrorMessage.BAD_REQUEST,
          return: "",
        });
      }
    } catch (error) {
      return res.status(ErrorCode.INTERNAL_ERROR).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        return: error.message,
      });
    }
  },

  getAllUserRatingWithComment: async function (req, res) {
    try {
      let allRatingData = await userRideRating.find();
      if (allRatingData) {
        return res.status(200).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_FOUND,
          result: allRatingData,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "No ratings found. Please try different query.",
          result: "",
        });
      }
    } catch (error) {
      return res.status(500).json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
};
