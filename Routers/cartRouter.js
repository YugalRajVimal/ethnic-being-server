const express = require("express");
const router  = express.Router();
const { protect } = require("../middlewares/auth");
const {
  getCart, addToCart, updateCartItem, removeCartItem, clearCart, mergeCart, validateCart,
} = require("../Controllers/cartController");

router.use(protect);

router.get("/",                   getCart);
router.post("/add",               addToCart);
router.put("/update/:itemId",     updateCartItem);
router.delete("/remove/:itemId",  removeCartItem);
router.delete("/clear",           clearCart);
router.post("/merge",             mergeCart);
router.post("/validate",          validateCart);

module.exports = router;
