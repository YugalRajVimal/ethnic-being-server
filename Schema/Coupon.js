const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType:  { type: String, enum: ["percentage", "flat"], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    minOrderValue: { type: Number, default: 0 },
    maxUses:       { type: Number, default: 100 },
    usedCount:     { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
    expiresAt:     { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
