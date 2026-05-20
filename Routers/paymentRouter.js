const express = require("express");
const router  = express.Router();
const { protect } = require("../middlewares/auth");
const {
  createPaymentOrder, verifyPayment, webhook, getPaymentDetails, initiateRefund,
} = require("../Controllers/paymentController");

router.post("/webhook",             webhook); // no auth – Razorpay server call
router.post("/create-order",        protect, createPaymentOrder);
router.post("/verify",              protect, verifyPayment);
router.get("/:orderId",             protect, getPaymentDetails);
router.post("/refund",              protect, initiateRefund);

module.exports = router;
