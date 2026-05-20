const express = require("express");
const router  = express.Router();
const { protect }   = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");
const {
  getDashboard, getAllUsers, getUserDetails, toggleBlockUser,
  getInventory, bulkImportProducts, getRevenueAnalytics, getProductAnalytics,
} = require("../Controllers/adminController");

router.use(protect, adminOnly);

router.get("/dashboard",              getDashboard);
router.get("/users",                  getAllUsers);
router.get("/users/:id",              getUserDetails);
router.put("/users/:id/block",        toggleBlockUser);
router.get("/inventory",              getInventory);
router.post("/products/bulk",         bulkImportProducts);
router.get("/analytics/revenue",      getRevenueAnalytics);
router.get("/analytics/products",     getProductAnalytics);

module.exports = router;
