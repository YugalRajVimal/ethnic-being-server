const Coupon = require("../Schema/Coupon");

// POST /coupons/validate
const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon)           return res.status(404).json({ success: false, message: "Invalid coupon code" });
    if (new Date() > coupon.expiresAt) return res.status(400).json({ success: false, message: "Coupon has expired" });
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({ success: false, message: `Minimum order value of Rs.${coupon.minOrderValue} required` });
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((orderTotal * coupon.discountValue) / 100);
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      success: true,
      coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
      discount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /coupons (Admin)
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /coupons (Admin)
const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /coupons/:id (Admin)
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /coupons/:id (Admin)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon };
