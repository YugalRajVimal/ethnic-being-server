const express = require("express");
const router  = express.Router();
const { protect } = require("../middlewares/auth");
const {
  register, login, googleAuth, logout, refreshToken,
  forgotPassword, verifyOtp, resetPassword, getMe,
} = require("../Controllers/authController");

router.post("/register",        register);
router.post("/login",           login);
router.post("/google",          googleAuth);
router.post("/logout",          protect, logout);
router.post("/refresh",         protect, refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp",      verifyOtp);
router.post("/reset-password",  resetPassword);
router.get("/me",               protect, getMe);

module.exports = router;
