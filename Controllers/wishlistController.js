const User    = require("../Schema/User");
const Product = require("../Schema/Product");

// GET /wishlist
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist", "name images price slug rating inStock");
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /wishlist/:id
const addToWishlist = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const user = await User.findById(req.user._id);
    if (user.wishlist.includes(req.params.id)) {
      return res.status(400).json({ success: false, message: "Product already in wishlist" });
    }
    user.wishlist.push(req.params.id);
    await user.save();
    res.json({ success: true, message: "Added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /wishlist/:id
const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, message: "Removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /wishlist
const clearWishlist = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { wishlist: [] });
    res.json({ success: true, message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /wishlist/check/:id
const checkWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id, "wishlist");
    const inWishlist = user.wishlist.map(String).includes(req.params.id);
    res.json({ success: true, inWishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist, checkWishlist };
