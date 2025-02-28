const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
    senderId: { type: mongoose.Schema.ObjectId, ref: "user" },
    receiverId: { type: mongoose.Schema.ObjectId, ref: "user" },
    currency: { type: String },
    cardId: { type: String },
    bank: { type: String },
    wallet: { type: String },
    vpa: { type: String },
    payerEmail: { type: String },
    payerContact: { type: String },
    amount: { type: Number },
    payment_id: { type: String },
    status: {
        type: String,
        enum: ["PAID", "PENDING", "FAILED", "SUCCESS"],
        default: "PENDING"
    },
    razorPayP_linkId: { type: String },
    orderId: { type: String },
    method: { type: String },
    bankTransactionId: { type: String },
    transactionId: { type: String },
    dateTime: { type: String },
    userId: { type: mongoose.Schema.ObjectId, ref: "user" },
    card: {
        id: { type: String },
        entity: { type: String },
        name: { type: String },
        cardLast4Digit: { type: String },
        network: { type: String },
        type: { type: String },
        issuer: { type: String },
        international: { type: Boolean },
        emi: { type: Boolean },
        sub_type: { type: String }
    },
    accountNumber: {
        type: String
    },
    ifsc: {
        type: String
    },
    upiId: {
        type: String
    },
    name: {
        type: String
    },
    mobileNumber: {
        type: String
    },
    message: {
        type: String
    },
    paymentReply: {
        type: String
    },
    screenShot: {
        type: String
    },
    transactionType: {
        type: String,
        enum: ["DEPOSIT", "CREDIT"],
    },
    paymentMethod: {
        type: String,
        enum: ["GOOGLE_PAY", "BANK", "PAYTM"],
    },
}, { timestamps: true })
module.exports = mongoose.model("transaction", DocumentSchema);