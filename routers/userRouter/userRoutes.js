const router = require("express").Router();
const userController = require("../../controllers/userController");
const auth = require("../../middleware/auth");
const rideRequest = require("../../controllers/rideRequest");
const driverController = require("../../controllers/driverController");

router.post("/userLogin", userController.userLogin);
router.post("/verifyOtp", userController.verifyOtp);
router.put("/updateProfile", auth.verifyToken, userController.editProfile);
router.delete("/deleteUser", auth.verifyToken, userController.deleteUser);
router.get("/viewProfile", auth.verifyToken, userController.viewProfile);
router.post(
  "/shareContactNo/:_id",
  auth.verifyToken,
  userController.shareContactNo
);
router.get("/getUser/:userId", userController.getUserById);
router.get(
  "/verifyTokenAndUser",
  auth.verifyToken,
  userController.verifyTokenAndUser
);
router.post("/userLogout", userController.logoutUser);

//===========================Ride===========================//
router.post(
  "/createRideRequest",
  auth.verifyToken,
  rideRequest.createRideRequest
);
router.get(
  "/getRideByRideId/:rideId",
  auth.verifyToken,
  rideRequest.getRideByRideId
);
router.post(
  "/acceptRideByRideId/:rideId",
  auth.verifyToken,
  rideRequest.acceptRideByRideId
);
router.get("/getRideRequest/:userId", rideRequest.getRide);
router.post(
  "/completeRide/:rideId",
  auth.verifyToken,
  rideRequest.updatePayment
);
router.put(
  "/updateRideRequest",
  auth.verifyToken,
  rideRequest.updateRideRequest
);
router.put(
  "/cancelRideByRideId",
  auth.verifyToken,
  rideRequest.cancelRideByUser
);
router.put(
  "/deleteRideRequestAndCancel",
  auth.verifyToken,
  rideRequest.deleteRideRequestAndCancel
);
router.get(
  "/getDriverFromUser/:driverId",
  auth.verifyToken,
  driverController.getDriverByIdWithAllData
);
router.post("/serviceAvailable", rideRequest.serviceAvailable);
router.post("/findLocation", rideRequest.findLocation);
router.get("/getRideForUser", auth.verifyToken, rideRequest.getRideForUser);
router.get(
  "/getUserRideHistory",
  auth.verifyToken,
  rideRequest.getUserRideHistory
);

//===============================User Active Data===============================//
router.post(
  "/createTodayActiveData",
  auth.verifyToken,
  userController.createTodayActiveData
);
router.get(
  "/getUserByIdWithLastRide/:userId",
  userController.getUserByIdWithLastRide
);

//===============================Get Admin Vehicle===============================//
router.get("/getAllVehicle", userController.getAllVehicle);
router.get("/verifyotp", userController.getAllVehicle);

//**************************************booking payment transaction **************************************//
router.post("/ridePayment", auth.verifyToken, rideRequest.ridePayment);
router.get("/viewBookingPayment/:_id", rideRequest.viewBookingPayment);
router.get(
  "/bookingPaymentList",
  auth.verifyToken,
  rideRequest.bookingPaymentList
);
//**************************************booking payment transaction **************************************//
router.post(
  "/addMoneyToWallet",
  auth.verifyToken,
  rideRequest.addMoneyToWallet
);
router.post("/paymentVerify", auth.verifyToken, rideRequest.paymentVerify);
router.get(
  "/checkWalletBalance",
  auth.verifyToken,
  rideRequest.checkWalletBalance
);

router.post("/visitors", userController.visited);
router.get("/visitors", userController.getVisitor);

module.exports = router;
