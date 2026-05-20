const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Order    = require("../Schema/Order");

// const razorpay = new Razorpay({
//   key_id:     process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// POST /payments/create-order
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(order.total * 100), // paise
      currency: "INR",
      receipt:  `order_${order._id}`,
    });

    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      amount:   razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /payments/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.payment.status            = "paid";
    order.payment.transactionId     = razorpay_payment_id;
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.razorpaySignature = razorpay_signature;
    order.status = "confirmed";
    order.statusHistory.push({ status: "confirmed", message: "Payment received", timestamp: new Date() });
    await order.save();

    res.json({ success: true, message: "Payment verified", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /payments/webhook (Razorpay server-to-server)
const webhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const shasum = crypto.createHmac("sha256", webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");
      if (digest !== req.headers["x-razorpay-signature"]) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    if (event === "payment.captured") {
      const paymentId  = req.body.payload.payment.entity.id;
      const rpOrderId  = req.body.payload.payment.entity.order_id;
      const order = await Order.findOne({ "payment.razorpayOrderId": rpOrderId });
      if (order && order.payment.status !== "paid") {
        order.payment.status            = "paid";
        order.payment.razorpayPaymentId = paymentId;
        order.status = "confirmed";
        order.statusHistory.push({ status: "confirmed", message: "Payment captured via webhook", timestamp: new Date() });
        await order.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /payments/:orderId
const getPaymentDetails = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id }, "payment total status");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, payment: order.payment, total: order.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /payments/refund
const initiateRefund = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (!order.payment.razorpayPaymentId) {
      return res.status(400).json({ success: false, message: "No payment found to refund" });
    }

    const refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
      amount: Math.round(order.total * 100),
    });

    order.payment.status = "refunded";
    await order.save();

    res.json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPaymentOrder, verifyPayment, webhook, getPaymentDetails, initiateRefund };
