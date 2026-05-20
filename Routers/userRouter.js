const express = require("express");
const router  = express.Router();
const { protect } = require("../middlewares/auth");
const {
  getProfile, updateProfile, changePassword,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  deleteAccount,
} = require("../Controllers/userController");

router.use(protect);

router.get("/profile",                    getProfile);
router.put("/profile",                    updateProfile);
router.put("/password",                   changePassword);
router.get("/addresses",                  getAddresses);
router.post("/addresses",                 addAddress);
router.put("/addresses/:id",              updateAddress);
router.delete("/addresses/:id",           deleteAddress);
router.put("/addresses/:id/default",      setDefaultAddress);
router.delete("/account",                 deleteAccount);

module.exports = router;
