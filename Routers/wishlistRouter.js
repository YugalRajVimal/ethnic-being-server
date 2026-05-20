const express = require("express");
const router  = express.Router();
const { protect } = require("../middlewares/auth");
const {
  getWishlist, addToWishlist, removeFromWishlist, clearWishlist, checkWishlist,
} = require("../Controllers/wishlistController");

router.use(protect);

router.get("/",              getWishlist);
router.delete("/",           clearWishlist);
router.get("/check/:id",     checkWishlist);
router.post("/:id",          addToWishlist);
router.delete("/:id",        removeFromWishlist);

module.exports = router;
