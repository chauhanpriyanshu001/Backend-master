const router = require("express").Router();
const driverRating = require("../../controllers/driverRating");
const userRating = require("../../controllers/userRating");
const auth = require("../../middleware/auth");

//__________________________ Driver's Ride Rating__________________________//
router.post(
  "/createDriverRating/:userId",
  auth.verifyToken,
  driverRating.createDriverRating
);
router.get("/getAvgDriverRatings/:driverId", driverRating.getAvgDriverRatings);
router.get("/getAnalysisRating", driverRating.getAnalysisRating);
router.get("/getAllRatingWithComment", driverRating.getAllRatingWithComment);
router.delete(
  "/deleteRatingById/:ratingId",
  auth.verifyTokenAdmin,
  driverRating.deleteRatingById
);

//__________________________ User's Ride Rating__________________________//
router.post(
  "/createUserRating/:driverId",
  auth.verifyTokenDriver,
  userRating.createUserRating
);
router.get("/getAvgUserRatings/:userId", userRating.getAvgUserRatings);
router.get("/getAnalysisUserRating/:driverId", userRating.getAnalysisRating);
router.get(
  "/getAllUserRatingWithComment",
  userRating.getAllUserRatingWithComment
);

module.exports = router;
