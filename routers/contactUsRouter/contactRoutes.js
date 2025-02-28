const router = require("express").Router();
const contactUsController = require("../../controllers/contactUs");
const valid = require("../../middleware/validation");
const auth = require("../../middleware/auth");

router.post(
  "/CreateContactUs",
  contactUsController.createContactUs
);
router.get(
  "/GetContactUs",
  auth.verifyTokenAdmin,
  contactUsController.getContactUs
);
router.get(
  "/GetContactUs/:id",
  auth.verifyTokenAdmin,
  contactUsController.getContactById
);
router.put("/UpdateContactUs/:id", contactUsController.updateContactUs);
router.delete(
  "/DeleteContactUs/:id",
  auth.verifyTokenAdmin,
  contactUsController.deleteContactUsById
);
router.delete(
  "/DeleteContactUs",
  auth.verifyTokenAdmin,
  contactUsController.deleteContactUsById
);
module.exports = router;
