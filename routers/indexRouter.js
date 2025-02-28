const express = require("express");
const router = express.Router();

var user = require("./userRouter/userRoutes");
const driver = require("./driverRoute/driverRouter");
var admin = require("./adminRouter/adminRoutes");
const static = require("./adminRouter/staticRoute");
var contactUs = require("./contactUsRouter/contactRoutes");
var ride = require("./rideRouter/RideRoutes");
var rating = require("./rideRating/rideRating");

router.use("/user", user);
router.use("/driver", driver);
router.use("/admin", admin);
router.use("/static", static);
router.use("/contact", contactUs);
router.use("/ride", ride);
router.use("/rating", rating);
module.exports = router;
