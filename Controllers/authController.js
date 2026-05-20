const User            = require("../Schema/User");
const { generateToken } = require("../middlewares/auth");
const { sendEmail, otpHtml } = require("../config/email");

// POST /auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    const user  = await User.create({ name, email, phone, password });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account is blocked. Contact support." });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/google
const googleAuth = async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;
    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: "Google auth data missing" });
    }
    let user = await User.findOne({ email });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      user = await User.create({ name, email, googleId, avatar: avatar || "" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account is blocked. Contact support." });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/logout
const logout = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

// POST /auth/refresh
const refreshToken = async (req, res) => {
  try {
    const user  = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const token = generateToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: "If that email is registered, an OTP has been sent." });
    }
    const otp = user.generateOtp();
    await user.save({ validateBeforeSave: false });
    await sendEmail(email, "EthnicBeing – Password Reset OTP", otpHtml(otp));
    res.json({ success: true, message: "OTP sent to your email address." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select("+resetOtp +resetOtpExpiry +resetOtpVerified");
    if (!user || user.resetOtp !== otp || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
    user.resetOtpVerified = true;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: "OTP verified. You may now reset your password." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+resetOtpVerified +resetOtpExpiry");
    if (!user || !user.resetOtpVerified || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: "OTP not verified or session expired." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    user.password         = password;
    user.resetOtp         = undefined;
    user.resetOtpExpiry   = undefined;
    user.resetOtpVerified = false;
    await user.save();
    res.json({ success: true, message: "Password reset successful. Please login." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, googleAuth, logout, refreshToken, forgotPassword, verifyOtp, resetPassword, getMe };
