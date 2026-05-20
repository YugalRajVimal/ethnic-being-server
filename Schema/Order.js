const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:    { type: String, required: true },
  image:   { type: String, default: "" },
  price:   { type: Number, required: true },
  qty:     { type: Number, required: true, min: 1 },
  size:    { type: String, default: "" },
});

const shippingAddressSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  phone:   { type: String, required: true },
  address: { type: String, required: true },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true },
});

const paymentSchema = new mongoose.Schema({
  method:            { type: String, enum: ["razorpay","cod"], default: "cod" },
  status:            { type: String, enum: ["pending","paid","failed","refunded"], default: "pending" },
  transactionId:     { type: String, default: "" },
  razorpayOrderId:   { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  razorpaySignature: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:           [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    payment:         paymentSchema,
    status: {
      type: String,
      enum: ["pending","confirmed","processing","shipped","out_for_delivery","delivered","cancelled","return_initiated","returned"],
      default: "pending",
    },
    subtotal:          { type: Number, required: true },
    shippingFee:       { type: Number, default: 0 },
    discount:          { type: Number, default: 0 },
    total:             { type: Number, required: true },
    couponCode:        { type: String, default: "" },
    trackingNumber:    { type: String, default: "" },
    estimatedDelivery: { type: Date },
    cancelReason:      { type: String, default: "" },
    returnReason:      { type: String, default: "" },
    statusHistory: [
      {
        status:    { type: String },
        message:   { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
