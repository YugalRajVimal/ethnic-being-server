const User    = require("../Schema/User");
const Order   = require("../Schema/Order");
const Product = require("../Schema/Product");

// GET /admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const totalUsers   = await User.countDocuments({ role: "user" });
    const totalOrders  = await Order.countDocuments();
    const totalProducts= await Product.countDocuments();

    const revenueData  = await Order.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalOrders, totalProducts, totalRevenue },
      recentOrders,
      ordersByStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/users
const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, isBlocked } = req.query;
    const filter = { role: "user" };
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === "true";

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/users/:id
const getUserDetails = async (req, res) => {
  try {
    const user   = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, user, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /admin/users/:id/block
const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, message: user.isBlocked ? "User blocked" : "User unblocked", isBlocked: user.isBlocked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/inventory
const getInventory = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const products = await Product.find();
    const lowStock = [];
    for (const p of products) {
      if (p.sizes && p.sizes.length > 0) {
        const lowSizes = p.sizes.filter((s) => s.stock <= Number(threshold));
        if (lowSizes.length > 0) {
          lowStock.push({ _id: p._id, name: p.name, category: p.category, lowSizes });
        }
      }
    }
    res.json({ success: true, lowStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/products/bulk
const bulkImportProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "Products array is required" });
    }
    const created = await Product.insertMany(products, { ordered: false });
    res.status(201).json({ success: true, created: created.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/analytics/revenue
const getRevenueAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const matchStage = { "payment.status": "paid" };
    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = new Date(from);
      if (to)   matchStage.createdAt.$lte = new Date(to);
    }

    const daily = await Order.aggregate([
      { $match: matchStage },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders:  { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = daily.reduce((acc, d) => acc + d.revenue, 0);
    res.json({ success: true, totalRevenue, daily });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/analytics/products
const getProductAnalytics = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: {
          _id: "$items.product",
          name:    { $first: "$items.name" },
          totalQty: { $sum: "$items.qty" },
          revenue:  { $sum: { $multiply: ["$items.price", "$items.qty"] } },
      }},
      { $sort: { totalQty: -1 } },
      { $limit: 20 },
    ]);
    res.json({ success: true, topProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getAllUsers, getUserDetails, toggleBlockUser, getInventory, bulkImportProducts, getRevenueAnalytics, getProductAnalytics };
