const router = require("express").Router();
const driverController = require("../../controllers/driverController");
const auth = require("../../middleware/auth");
const userController = require("../../controllers/userController");
const rideRequest = require("../../controllers/rideRequest");
router.post("/driverLogin", driverController.driverLogin);
router.post("/verifyOtp", driverController.verifyOtp);
router.put(
  "/updateDriverProfile",
  auth.verifyTokenDriver,
  driverController.updateDriverProfile
);
router.get(
  "/viewDriverProfile",
  auth.verifyTokenDriver,
  driverController.viewDriverProfile
);
router.delete(
  "/deleteDriver",
  auth.verifyTokenDriver,
  driverController.deleteDriver
);
router.put(
  "/onlineStatusUpdate",
  auth.verifyTokenDriver,
  driverController.onlineStatusUpdate
);
router.get(
  "/verifyTokenAndDriver",
  auth.verifyTokenDriver,
  driverController.verifyTokenAndDriver
);
router.post("/driverLogout", driverController.driverLogout);

//===============================Ride Request Section===============================//
router.get(
  "/viewRideChatForProvider",
  auth.verifyTokenDriver,
  driverController.viewRideChatForProvider
);
router.get(
  "/getRideList",
  auth.verifyTokenDriver,
  driverController.getAllRideListNearDriver
);
router.post(
  "/sendFare",
  auth.verifyTokenDriver,
  driverController.sendFareToRideRequest
);
router.post("/rideOtpVerification", rideRequest.otpVerification);
router.post("/startDriverJourney", rideRequest.startDriverJourney);
router.post(
  "/completeRide/:rideId",
  auth.verifyTokenDriver,
  rideRequest.completeRideReq
);
router.post(
  "/acceptProposalFromDriverSide",
  auth.verifyTokenDriver,
  driverController.acceptProposalFromDriverSide
);
router.get(
  "/getActiveRide",
  auth.verifyTokenDriver,
  rideRequest.getRideForDriver
);
router.post(
  "/cancelRideById",
  auth.verifyTokenDriver,
  rideRequest.cancelRideByDriver
);
router.get(
  "/getRideByRideId/:rideId",
  auth.verifyTokenDriver,
  rideRequest.getRideByRideId
);
router.get(
  "/getDriverRideHistory",
  auth.verifyTokenDriver,
  rideRequest.getDriverRideHistory
);
router.get(
  "/getMyOnGoingRide",
  auth.verifyTokenDriver,
  rideRequest.getMyOnGoingRide
);

//========================Aadhar part========================//
router.post("/addAadhar", auth.verifyTokenDriver, driverController.addAadhar);
router.get(
  "/getAadharData/:driverId",
  auth.verifyTokenDriver,
  driverController.getAadharData
);
router.put(
  "/updateAadhar/:driverId",
  auth.verifyTokenDriver,
  driverController.updateAadhar
);
router.post("/uploadDoc", auth.verifyTokenDriver, driverController.uploadDoc);


//========================Emergency Contact Number part========================//
router.post(
  "/addEmergencyContact",
  auth.verifyTokenDriver,
  driverController.createEmergencyContacts
);
router.get(
  "/getEmergencyContact",
  auth.verifyTokenDriver,
  driverController.getEmergencyContacts
);
router.put(
  "/updateEmergencyContact/:id",
  auth.verifyTokenDriver,
  driverController.updateEmergencyContacts
);

//========================Driving License part========================//
router.post("/createDL", auth.verifyTokenDriver, driverController.createDL);
router.get(
  "/readDL/:driverId",
  auth.verifyTokenDriver,
  driverController.readDL
);
router.put(
  "/updateDL/:driverId",
  auth.verifyTokenDriver,
  driverController.updateDL
);

//========================vehicle part========================//
router.post(
  "/createVehicle",
  auth.verifyTokenDriver,
  driverController.createVehicle
);
router.get(
  "/getVehicleByDriverIdWithDriver/:driverId",
  auth.verifyTokenDriver,
  driverController.getVehicleByDriverIdWithDriver
);
router.put(
  "/updateVehicleDataWithDriverId/:driverId",
  auth.verifyTokenDriver,
  driverController.updateVehicleDataWithDriverId
);

//========================driver activity========================//
router.post(
  "/createTodayActiveData",
  auth.verifyTokenDriver,
  driverController.createTodayActiveData
);

//========================Admin vehicle ========================//
router.get("/getAllVehicle", userController.getAllVehicle);

//**************************************booking payment transaction **************************************//
router.post(
  "/addMoneyToWallet",
  auth.verifyTokenDriver,
  driverController.addMoneyToWallet
);
router.post(
  "/paymentVerify",
  auth.verifyTokenDriver,
  driverController.paymentVerify
);
router.get(
  "/checkWalletBalance",
  auth.verifyTokenDriver,
  driverController.checkWalletBalance
);
router.get(
  "/getTransactions",
  auth.verifyTokenDriver,
  driverController.getTransactions
);



module.exports = router;
