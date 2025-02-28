const ContactUs = require("../models/contactUsModel");
const { ErrorCode, SuccessCode } = require("../helper/statusCode");
const { ErrorMessage, SuccessMessage } = require("../helper/message");

module.exports = {
  createContactUs: async (req, res, next) => {
    try {
      let body = JSON.parse(JSON.stringify(req.body));
      let { name, phone, email, subject, content } = body;
      let contactData = {
        name,
        email,
        phone,
        subject,
        content,
      };
      const saveData = await ContactUs.create(contactData);
      res
        .status(201)
        .send({ status: true, message: "Success", data: saveData });
    } catch (err) {
      res
        .status(500)
        .send({ status: false, message: "Something Went wrong, Please Check Again." });
    }
  },

  getContactById: async (req, res) => {
    try {
      const contactId = req.params.id;
      const contactEntry = await ContactUs.findById(contactId);
      if (!contactEntry) {
        return res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.NOT_FOUND,
        });
      }
      res.status(200).json(contactEntry);
    } catch (error) {
      console.error("Error: ", error);
      res.status(500).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.ErrorMessage,
        error,
      });
    }
  },

  getContactUs: async (req, res) => {
    try {
      const contactUsEntries = await ContactUs.find().sort({ createdAt: -1 });
      const totalCount = await ContactUs.countDocuments();
      const responseObj = {
        totalCount: totalCount,
        data: contactUsEntries,
      };
      res.status(200).json(responseObj);
    } catch (error) {
      console.error("Error: ", error);
      res.status(500).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.ErrorMessage,
        error,
      });
    }
  },

  updateContactUs: async (req, res) => {
    try {
      const contactId = req.params.id;
      const updateFields = {};
      if (req.body.name) {
        updateFields.name = req.body.name;
      }
      if (req.body.email) {
        updateFields.email = req.body.email;
      }
      if (req.body.phone) {
        updateFields.phone = req.body.phone;
      }
      if (req.body.subject) {
        updateFields.subject = req.body.subject;
      }
      if (req.body.content) {
        updateFields.content = req.body.content;
      }
      const updatedContact = await ContactUs.findByIdAndUpdate(
        contactId,
        { $set: updateFields },
        { new: true }
      );
      if (updatedContact) {
        res.status(200).json(updatedContact);
      } else {
        res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.CONTACT_NOT_FOUND,
        });
      }
    } catch (error) {
      console.error("Error: ", error);
      res.status(500).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        error,
      });
    }
  },

  deleteContactUsById: async (req, res) => {
    try {
      const contactId = req.params.id;
      const deletedContact = await ContactUs.findByIdAndRemove(contactId);
      if (deletedContact) {
        res.status(200).send({
          responseCode: SuccessCode.SUCCESS,
          responseMessage: SuccessMessage.CONTACT_US_FORM_DELETE,
        });
      } else {
        res.status(404).json({
          responseCode: ErrorCode.NOT_FOUND,
          responseMessage: ErrorMessage.CONTACT_NOT_FOUND,
        });
      }
    } catch (error) {
      console.error("Error: ", error);
      res.status(500).json({
        responseCode: ErrorCode.WENT_WRONG,
        responseMessage: ErrorMessage.SOMETHING_WRONG,
        error,
      });
    }
  },
};
