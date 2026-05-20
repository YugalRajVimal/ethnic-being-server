const express = require("express");
const router  = express.Router();
const { protect }   = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");
const {
  placeOrder, getMyOrders, getOrderById, trackOrder,
  cancelOrder, returnOrder, getAllOrders, updateOrderStatus,
} = require("../Controllers/orderController");

router.use(protect);

// Admin routes first (before /:id)
router.get("/admin/all",          adminOnly, getAllOrders);
router.put("/admin/:id/status",   adminOnly, updateOrderStatus);

router.post("/",                  placeOrder);
router.get("/",                   getMyOrders);
router.get("/:id",                getOrderById);
router.get("/:id/track",          trackOrder);
router.post("/:id/cancel",        cancelOrder);
router.post("/:id/return",        returnOrder);

module.exports = router;
