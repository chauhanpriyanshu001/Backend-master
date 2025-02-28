const router = require("express").Router();
const auth = require("../../middleware/auth");
const staticController = require("../../controllers/staticController");

router.post("/addStatic", auth.verifyTokenAdmin, staticController.addStatic);
router.get("/getStaticList", staticController.getStaticList);
router.get("/getStaticContent", staticController.getStaticContent);
router.get("/getStaticContentAPP", staticController.getStaticContentAPP);
router.put(
  "/updateStaticContent/:_id",
  auth.verifyTokenAdmin,
  staticController.updateStaticContent
);
router.delete(
  "/deleteStaticContent/:_id",
  auth.verifyTokenAdmin,
  staticController.deleteStaticContent
);

//=====================Commission API=====================//
router.post(
  "/addCommission",
  auth.verifyTokenAdmin,
  staticController.addCommission
);
router.get("/viewCommission/:_id", staticController.viewCommission);
router.put(
  "/EditCommission/:_id",
  auth.verifyTokenAdmin,
  staticController.EditCommission
);
router.delete(
  "/deleteCommission",
  auth.verifyTokenAdmin,
  staticController.deleteCommission
);
router.get("/listCommission", staticController.listCommission);
router.put(
  "/activeBlockCommission/:_id",
  auth.verifyTokenAdmin,
  staticController.activeBlockCommission
);
module.exports = router;
