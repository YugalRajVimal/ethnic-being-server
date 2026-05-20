const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:         { type: String, required: true },
  image:        { type: String, default: "" },
  price:        { type: Number, required: true },
  selectedSize: { type: String, default: "" },
  qty:          { type: Number, default: 1, min: 1 },
});

const cartSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    items:     [cartItemSchema],
    coupon:    { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
