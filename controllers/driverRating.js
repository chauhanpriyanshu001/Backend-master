const rideRating = require("../models/rideRating");
const { SuccessMessage, ErrorMessage } = require("../helper/message");
const { SuccessCode, ErrorCode } = require("../helper/statusCode");
const mongoose = require("mongoose");

module.exports = {
  createDriverRating: async function (req, res) {
    try {
      let data = req.body;
      data.userId = req.params.userId;
      let ratingData = await rideRating.create(data);
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

  getAvgDriverRatings: async function (req, res) {
    try {
      const driverId = req.params.driverId;
      const ratings = await rideRating.aggregate([
        { $match: { driverId: mongoose.Types.ObjectId(driverId) } },
        {
          $group: {
            _id: "$driverId",
            averageRating: { $avg: "$rating" },
            ratings: { $push: "$$ROOT" },
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
          ratings: ratings[0].ratings,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: " No Ratings found for this Driver",
        });
      }
    } catch (error) {
      console.error("Error is fetching Driver Ratings:", error);
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
      let ratingData = await rideRating.aggregate(arr);
      if (ratingData) {
        return res.status(200).json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DATA_FOUND,
          result: ratingData,
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
        return: error.message,
      });
    }
  },

  getAllRatingWithComment: async function (req, res) {
    try {
      let allRatingData = await rideRating.find();
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

  deleteRatingById: async function (req, res) {
    try {
      let ratingId = req.params.ratingId;
      let deletedRating = await rideRating.findByIdAndDelete({
        _id: ratingId,
      });
      if (deletedRating) {
        return res.json({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.DELETE_SUCCESS,
          result: deletedRating,
        });
      } else {
        return res.json({
          responseCode: ErrorCode.WENT_WRONG,
          responseMessage: ErrorMessage.SOMETHING_WRONG,
          result: "",
        });
      }
    } catch (error) {
      return res.json({
        responseCode: ErrorCode.INTERNAL_ERROR,
        responseMessage: ErrorMessage.INTERNAL_ERROR,
        result: error.message,
      });
    }
  },
};
