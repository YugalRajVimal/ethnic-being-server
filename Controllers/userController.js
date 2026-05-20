const User = require("../Schema/User");

// GET /users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist", "name images price slug");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, dob } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, dob },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /users/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }
    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /users/addresses
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id, "addresses");
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /users/addresses
const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /users/addresses/:id
const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: "Address not found" });
    if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /users/addresses/:id
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /users/addresses/:id/default
const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === req.params.id;
    });
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /users/account
const deleteAccount = async (req, res) => {
  try {
    // Soft delete – just block the account
    await User.findByIdAndUpdate(req.user._id, { isBlocked: true });
    res.json({ success: true, message: "Account deactivated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, deleteAccount };
