const Product = require("../Schema/Product");
const Review  = require("../Schema/Review");
const Order   = require("../Schema/Order");
const { uploadToCloudinary } = require("../middlewares/upload");
const fs = require("fs");

// GET /products
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sort, page = 1, limit = 12, search, inStock, tag } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (inStock === "true") filter.inStock = true;
    if (tag) filter.tag = tag;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const sortOptions = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      newest:     { createdAt: -1 },
      popular:    { reviewCount: -1, rating: -1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).sort(sortBy).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/slug/:slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/category/:cat
const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { category: req.params.cat };
    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/search
const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Search query is required" });
    const skip     = (Number(page) - 1) * Number(limit);
    const filter   = { $text: { $search: q } };
    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip).limit(Number(limit));
    res.json({ success: true, total, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/featured
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, inStock: true }).limit(12);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/bestsellers
const getBestsellers = async (req, res) => {
  try {
    const products = await Product.find({ inStock: true }).sort({ reviewCount: -1, rating: -1 }).limit(12);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/new-arrivals
const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ inStock: true }).sort({ createdAt: -1 }).limit(12);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /products (Admin)
const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.sizes === "string") data.sizes = JSON.parse(data.sizes);
    if (typeof data.tags  === "string") data.tags  = JSON.parse(data.tags);

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const urls = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.path, "ethnicbeing/products");
        urls.push(url);
        fs.unlinkSync(file.path);
      }
      data.images = urls;
    }

    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /products/:id (Admin)
const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.sizes === "string") data.sizes = JSON.parse(data.sizes);
    if (typeof data.tags  === "string") data.tags  = JSON.parse(data.tags);

    if (req.files && req.files.length > 0) {
      const urls = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.path, "ethnicbeing/products");
        urls.push(url);
        fs.unlinkSync(file.path);
      }
      data.images = urls;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /products/:id (Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /products/:id/reviews
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: "You have already reviewed this product" });

    // Check verified purchase
    const order = await Order.findOne({
      user: req.user._id,
      "items.product": productId,
      status: "delivered",
    });

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      comment,
      isVerifiedPurchase: !!order,
    });

    await review.populate("user", "name avatar");
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/:id/reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /products/:id/reviews/:reviewId
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, product: req.params.id });
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await review.deleteOne();
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts, getProductById, getProductBySlug, getProductsByCategory,
  searchProducts, getFeaturedProducts, getBestsellers, getNewArrivals,
  createProduct, updateProduct, deleteProduct,
  addReview, getReviews, deleteReview,
};
