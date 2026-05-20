const Cart    = require("../Schema/Cart");
const Product = require("../Schema/Product");

// GET /cart
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name images price inStock sizes");
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /cart/add
const addToCart = async (req, res) => {
  try {
    const { productId, selectedSize, qty = 1 } = req.body;
    console.log("addToCart body:", req.body);

    if (!productId) {
      console.log("Missing productId");
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    console.log("Fetched product:", product);

    if (!product) {
      console.log("Product not found for productId:", productId);
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!product.inStock) {
      console.log("Product out of stock for productId:", productId);
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    console.log("Fetched cart:", cart);

    if (!cart) {
      console.log("No cart found. Creating new cart for user:", req.user._id);
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Find if an item with the same product and selectedSize already exists
    const idx = cart.items.findIndex(
      (i) => i.product.toString() === productId && i.selectedSize === (selectedSize || "")
    );
    console.log("Cart item index found:", idx);

    if (idx > -1) {
      // If exists, just update the quantity by summing up
      console.log(
        "Item exists in cart, increasing quantity. Previous qty:",
        cart.items[idx].qty,
        "Adding:",
        qty
      );
      cart.items[idx].qty += qty;
    } else {
      // If not, add as new entry
      console.log("Adding new item to cart:", {
        product: productId,
        name: product.name,
        image: product.images[0] || "",
        price: product.price,
        selectedSize: selectedSize || "",
        qty,
      });
      cart.items.push({
        product: productId,
        name: product.name,
        image: product.images[0] || "",
        price: product.price,
        selectedSize: selectedSize || "",
        qty,
      });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    console.log("Cart after update:", cart);
    res.json({ success: true, cart });
  } catch (error) {
    console.log("Error in addToCart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /cart/update/:itemId
const updateCartItem = async (req, res) => {
  try {
    const { qty } = req.body;
    if (!qty || qty < 1) return res.status(400).json({ success: false, message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart" });

    item.qty = qty;
    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /cart/remove/:itemId
const removeCartItem = async (req, res) => {
  console.log( req.params.itemId);
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /cart/clear
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.coupon = "";
      cart.updatedAt = Date.now();
      await cart.save();
    }
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /cart/merge
const mergeCart = async (req, res) => {
  try {
    const { items } = req.body; // guest cart items
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Items array is required" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    for (const guestItem of items) {
      const product = await Product.findById(guestItem.productId);
      if (!product) continue;

      const idx = cart.items.findIndex(
        (i) => i.product.toString() === guestItem.productId && i.selectedSize === guestItem.selectedSize
      );

      if (idx > -1) {
        cart.items[idx].qty += guestItem.qty;
      } else {
        cart.items.push({
          product: guestItem.productId,
          name: product.name,
          image: product.images[0] || "",
          price: product.price,
          selectedSize: guestItem.selectedSize || "",
          qty: guestItem.qty || 1,
        });
      }
    }

    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /cart/validate
const validateCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const issues = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) { issues.push({ itemId: item._id, reason: "Product no longer exists" }); continue; }
      if (!product.inStock) { issues.push({ itemId: item._id, name: product.name, reason: "Out of stock" }); continue; }
      if (item.selectedSize) {
        const sizeEntry = product.sizes.find((s) => s.size === item.selectedSize);
        if (!sizeEntry || sizeEntry.stock < item.qty) {
          issues.push({ itemId: item._id, name: product.name, reason: `Insufficient stock for size ${item.selectedSize}` });
        }
      }
    }

    if (issues.length > 0) {
      return res.status(400).json({ success: false, message: "Cart has issues", issues });
    }
    res.json({ success: true, message: "Cart is valid" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, mergeCart, validateCart };
