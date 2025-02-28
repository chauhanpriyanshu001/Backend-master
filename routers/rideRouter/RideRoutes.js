const router = require("express").Router();
const ride = require("../../controllers/rideRequest");
const auth = require("../../middleware/auth");

router.put("/updateRideRequest", auth.verifyToken, ride.updateRideRequest);
router.put(
  "/cancelRideRequest",
  auth.verifyToken,
  ride.deleteRideRequestAndCancel
);

module.exports = router;
