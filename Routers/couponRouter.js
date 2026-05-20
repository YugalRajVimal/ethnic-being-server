const express = require("express");
const router  = express.Router();
const { protect }   = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");
const {
  validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon,
} = require("../Controllers/couponController");

router.post("/validate",        protect, validateCoupon);
router.get("/",                 protect, adminOnly, getAllCoupons);
router.post("/",                protect, adminOnly, createCoupon);
router.put("/:id",              protect, adminOnly, updateCoupon);
router.delete("/:id",           protect, adminOnly, deleteCoupon);

module.exports = router;
