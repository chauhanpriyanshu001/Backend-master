const userController = require("../../controllers/userController");
const rideRatingController = require("../../controllers/driverRating");
const driverController = require("../../controllers/driverController");
const adminController = require("../../controllers/adminController");
const rideRequestController = require("../../controllers/rideRequest");
const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();

const stateCityController = require("../../controllers/StateAndCity");
//================================Admin Authentication================================//
router.post("/loginAdmin", adminController.loginAdmin);
router.post("/forgetPassword", adminController.forgetPassword);
router.post("/verifyOtp", adminController.verifyOtp);
router.post("/resendOtp", adminController.resendOtp);
router.put(
  "/resetPassword",
  auth.verifyTokenAdmin,
  adminController.resetPassword
);
router.put(
  "/changePassword",
  auth.verifyTokenAdmin,
  adminController.changePassword
);
router.get("/viewProfile", auth.verifyTokenAdmin, adminController.viewProfile);
router.put("/editProfile", auth.verifyTokenAdmin, adminController.editProfile);
router.delete("/deleteUser", auth.verifyTokenAdmin, adminController.deleteUser);
router.get(
  "/verifyTokenAndAdmin",
  auth.verifyTokenAdmin,
  adminController.verifyTokenAndAdmin
);
router.post("/adminLogout", adminController.adminLogout);

//================================Ride Section For ADMIN================================//
router.get(
  "/getAllRideForAllCondition",
  auth.verifyTokenAdmin,
  rideRequestController.getAllRideForAllCondition
);
router.get(
  "/todayBookingsBOOKNOW",
  auth.verifyTokenAdmin,
  rideRequestController.todayBookingsBOOKNOW
);
router.get(
  "/yesterdayBookingsBOOKNOW",
  auth.verifyTokenAdmin,
  rideRequestController.yesterdayBookingsBOOKNOW
);
router.get(
  "/beforeYesterdayBookingsBOOKNOW",
  auth.verifyTokenAdmin,
  rideRequestController.beforeYesterdayBookingsBOOKNOW
);


router.get(
  "/todayBookingsBOOKLATER",
  auth.verifyTokenAdmin,
  rideRequestController.todayBookingsBOOKLATER
);
router.get(
  "/yesterdayBookingsBOOKLATER",
  auth.verifyTokenAdmin,
  rideRequestController.yesterdayBookingsBOOKLATER
);
router.get(
  "/beforeYesterdayBookingsBOOKLATER",
  auth.verifyTokenAdmin,
  rideRequestController.beforeYesterdayBookingsBOOKLATER
);
router.get(
  "/todayBookingsFreight",
  auth.verifyTokenAdmin,
  rideRequestController.todayBookingsFreight
);
router.get(
  "/yesterdayBookingsFreight",
  auth.verifyTokenAdmin,
  rideRequestController.yesterdayBookingsFreight
);
router.get(
  "/beforeYesterdayBookingsFreight",
  auth.verifyTokenAdmin,
  rideRequestController.beforeYesterdayBookingsFreight
);
//================================Admin Access for Common Data================================//
router.delete(
  "/deleteEmergencyContact/:id",
  auth.verifyTokenAdmin,
  driverController.deleteEmergencyContacts
);

//================================Driver Aadhar Access By Admin================================//
router.get(
  "/getAadharData/:driverId",
  auth.verifyTokenAdmin,
  driverController.getAadharData
);
router.put(
  "/updateAdhar/:driverId",
  auth.verifyTokenAdmin,
  driverController.updateAadhar
);
router.delete(
  "/deleteAadhar/:driverId",
  auth.verifyTokenAdmin,
  driverController.deleteAadhar
);

//=================================Driving License By Admin=================================//
router.get("/readDL/:driverId", auth.verifyTokenAdmin, driverController.readDL);
router.put(
  "/updateDL/:driverId",
  auth.verifyTokenAdmin,
  driverController.updateDL
);
router.get("/getAllDL", auth.verifyTokenAdmin, driverController.getAllDL);
router.delete(
  "/deleteDL/:driverId",
  auth.verifyTokenAdmin,
  driverController.deleteDL
);

//======================Driver Vehicle with Document and Booking Type for Admin======================//
router.get(
  "/getVehicleByDriverIdWithDriver/:driverId",
  auth.verifyTokenAdmin,
  driverController.getVehicleByDriverIdWithDriver
); // this api for admin panel for see  vehicle data
router.put(
  "/updateVehicleDataWithDriverId/:driverId",
  auth.verifyTokenAdmin,
  driverController.updateVehicleDataWithDriverId
); // this api for admin driver can not update our vehicle details
router.delete(
  "/deleteVehicleDataWithDriverId/:driverId",
  auth.verifyTokenAdmin,
  driverController.deleteVehicleDataWithDriverId
); // this api for admin driver can not update our vehicle details

//================================Admin Access for User================================//
router.get(
  "/getAllUserAndSearchFilter",
  auth.verifyTokenAdmin,
  userController.getAllUserAndSearchFilter
);
router.get(
  "/getAllDeletedUser",
  auth.verifyTokenAdmin,
  userController.getAllDeletedUser
);
router.patch(
  "/updateBlockStatus/:userId",
  auth.verifyTokenAdmin,
  userController.updateBlokeStatus
);
router.delete(
  "/deleteUserById/:userId",
  auth.verifyTokenAdmin,
  userController.deleteUserById
);
router.post(
  "/updateUserStatus/:userId",
  auth.verifyTokenAdmin,
  userController.updateUserStatus
);

//================================User Activities================================//
router.get(
  "/getTodayAllActiveUser",
  auth.verifyTokenAdmin,
  userController.getTodayAllActiveUser
);
router.get(
  "/getAllYesterdayActiveUser",
  auth.verifyTokenAdmin,
  userController.getAllYesterdayActiveUser
);
router.get(
  "/getAllActiveUserBeforeYesterday",
  auth.verifyTokenAdmin,
  userController.getAllActiveUserBeforeYesterday
);
router.get(
  "/getAllActiveUserPast3rdDay",
  auth.verifyTokenAdmin,
  userController.getAllActiveUserPast3rdDay
);
router.get(
  "/getAllActiveUserBeforeThreeDay",
  auth.verifyTokenAdmin,
  userController.getAllActiveUserBeforeThreeDay
);

//================================Admin Access for Driver================================//
router.get(
  "/getOnlineDriver",
  auth.verifyTokenAdmin,
  driverController.getOnlineDriver
);
router.get(
  "/getAllDriver",
  auth.verifyTokenAdmin,
  driverController.getAllDriverAndSearchFilter
);
router.get(
  "/getDriverByIdWithAllData/:driverId",
  auth.verifyTokenAdmin,
  driverController.getDriverByIdWithAllData
);
router.get(
  "/getAllDriverOfBeforeTodayRegisterCount",
  auth.verifyTokenAdmin,
  driverController.getAllDriverOfBeforeTodayRegisterCount
);
router.delete(
  "/deleteDriverByAdmin/:driverId",
  auth.verifyTokenAdmin,
  driverController.deleteDriverByAdmin
);
router.post(
  "/updateDriverStatus/:driverId",
  auth.verifyTokenAdmin,
  driverController.updateDriverStatus
);
router.put(
  "/updateDriverDocStatus/:driverId",
  auth.verifyTokenAdmin,
  driverController.updateDriverDocStatus
);

//================================Driver Activities================================//
router.get(
  "/getTodayAllActiveDriver",
  auth.verifyTokenAdmin,
  driverController.getTodayAllActiveDriver
);
router.get(
  "/getAllYesterdayActiveDriver",
  auth.verifyTokenAdmin,
  driverController.getAllYesterdayActiveDriver
);
router.get(
  "/getAllActiveDriverBeforeYesterday",
  auth.verifyTokenAdmin,
  driverController.getAllActiveDriverBeforeYesterday
);
router.get(
  "/getAllActiveDriverPast3rdDay",
  auth.verifyTokenAdmin,
  driverController.getAllActiveDriverPast3rdDay
);
router.get(
  "/getAllActiveDriverBeforeThreeDay",
  auth.verifyTokenAdmin,
  driverController.getAllActiveDriverBeforeThreeDay
);

//=================================Add Vehicle for BookingType and Commission By Admin=================================//
router.post(
  "/createVehicle",
  auth.verifyTokenAdmin,
  userController.createVehicle
);
router.get(
  "/getAllVehicle",
  auth.verifyTokenAdmin,
  userController.getAllVehicle
);
router.put(
  "/updateVehicle/:vehicleId",
  auth.verifyTokenAdmin,
  userController.updateVehicle
);
router.delete(
  "/deleteVehicle/:vehicleId",
  auth.verifyTokenAdmin,
  userController.deleteVehicle
);

//=================================Emergency Number Process By Admin
router.delete(
  "/deleteEmergencyContact/:Id",
  auth.verifyTokenDriver,
  driverController.deleteEmergencyContacts
);

//=================================State and City By Admin=================================//
// router.post(
//   "/addSelectedCity",
//   auth.verifyTokenAdmin,
//   adminController.addSelectedCity
// );
// router.get(
//   "/stateCityList",
//   auth.verifyTokenAdmin,
//   adminController.stateCityList
// );
// router.get("/stateList", auth.verifyTokenAdmin, adminController.stateList);
// router.get(
//   "/selectedCityList",
//   auth.verifyTokenAdmin,
//   adminController.selectedCityList
// );
// router.delete(
//   "/removeSelectedCity",
//   auth.verifyTokenAdmin,
//   adminController.removeSelectedCity
// );

router.post("/createStateCity", stateCityController.createStateCity);
router.get(
  "/getStateAndCityWithFencing",
  stateCityController.getStateAndCityWithFencing
);
router.post("/deleteStateAndCity", stateCityController.deleteStateAndCity);

//=================================Rating and Review By Admin=================================//
router.get(
  "/getAllDriverRating",
  auth.verifyTokenAdmin,
  rideRatingController.getAvgDriverRatings
);
router.get(
  "/getAllRatingWithComment",
  auth.verifyTokenAdmin,
  rideRatingController.getAnalysisRating
);
router.delete(
  "/deleteRatingById/:ratingId",
  auth.verifyTokenAdmin,
  rideRatingController.getAllRatingWithComment
);

//=================================Rating and Review By Admin=================================//
router.get(
  "/getAllTransactions",
  auth.verifyTokenAdmin,
  rideRequestController.getAllTransactions
);
router.get(
  "/getAllDriverTransactions",
  auth.verifyTokenAdmin,
  driverController.getAllDriverTransactions
);

module.exports = router;
