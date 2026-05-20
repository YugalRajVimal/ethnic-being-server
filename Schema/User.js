const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");

const addressSchema = new mongoose.Schema({
  label:        { type: String, default: "Home" },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: "" },
  city:         { type: String, required: true },
  state:        { type: String, required: true },
  pincode:      { type: String, required: true },
  isDefault:    { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, "Name is required"], trim: true },
    email:    { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    phone:    { type: String, default: "" },
    password: { type: String, minlength: 6, select: false },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
    googleId: { type: String, default: "" },
    dob:      { type: Date },
    avatar:   { type: String, default: "" },
    isBlocked:{ type: Boolean, default: false },
    addresses:[ addressSchema ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    resetOtp:        { type: String, select: false },
    resetOtpExpiry:  { type: Date,   select: false },
    resetOtpVerified:{ type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetOtp       = otp;
  this.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  this.resetOtpVerified = false;
  return otp;
};

module.exports = mongoose.model("User", userSchema);
