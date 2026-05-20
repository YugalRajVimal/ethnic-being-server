const express = require("express");
const router  = express.Router();
const { protect }   = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");
const { upload }    = require("../middlewares/upload");
const {
  getProducts, getProductById, getProductBySlug, getProductsByCategory,
  searchProducts, getFeaturedProducts, getBestsellers, getNewArrivals,
  createProduct, updateProduct, deleteProduct,
  addReview, getReviews, deleteReview,
} = require("../Controllers/productController");

// Public routes – order matters: specific before :id
router.get("/featured",           getFeaturedProducts);
router.get("/bestsellers",        getBestsellers);
router.get("/new-arrivals",       getNewArrivals);
router.get("/search",             searchProducts);
router.get("/slug/:slug",         getProductBySlug);
router.get("/category/:cat",      getProductsByCategory);

router.get("/",                   getProducts);
router.get("/:id",                getProductById);

// Reviews
router.post("/:id/reviews",                    protect, addReview);
router.get("/:id/reviews",                     getReviews);
router.delete("/:id/reviews/:reviewId",        protect, deleteReview);

// Admin
router.post("/",                  protect, adminOnly, upload.array("images", 10), createProduct);
router.put("/:id",                protect, adminOnly, upload.array("images", 10), updateProduct);
router.delete("/:id",             protect, adminOnly, deleteProduct);

module.exports = router;
