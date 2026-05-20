const Order   = require("../Schema/Order");
const Cart    = require("../Schema/Cart");
const Product = require("../Schema/Product");
const Coupon  = require("../Schema/Coupon");
const { sendEmail, orderConfirmationHtml } = require("../config/email");

// POST /orders
const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "cod", couponCode } = req.body;

    console.log("Received placeOrder request", { shippingAddress, paymentMethod, couponCode, user: req.user && req.user._id });

    const cart = await Cart.findOne({ user: req.user._id });
    console.log("Fetched cart for user:", req.user && req.user._id, cart);

    if (!cart || cart.items.length === 0) {
      console.log("Cart is empty");
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Build items and calculate subtotal
    let subtotal = 0;
    const items = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      console.log("Fetched product:", item.product, product);

      if (!product || !product.inStock) {
        console.log(`Product unavailable: ${item.name}`);
        return res.status(400).json({ success: false, message: `${item.name} is no longer available` });
      }
      // Deduct stock
      if (item.selectedSize) {
        const sizeIdx = product.sizes.findIndex((s) => s.size === item.selectedSize);
        console.log(`Checking size for ${item.name}:`, item.selectedSize, "Found idx:", sizeIdx);
        if (sizeIdx > -1 && product.sizes[sizeIdx].stock >= item.qty) {
          product.sizes[sizeIdx].stock -= item.qty;
          await product.save();
          console.log(`Decremented stock for ${item.name} size ${item.selectedSize} by`, item.qty);
        } else {
          console.log(`Insufficient stock for ${item.name} (${item.selectedSize})`);
          return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name} (${item.selectedSize})` });
        }
      }
      subtotal += item.price * item.qty;
      items.push({ product: item.product, name: item.name, image: item.image, price: item.price, qty: item.qty, size: item.selectedSize });
    }

    // Shipping fee logic
    const shippingFee = subtotal >= 999 ? 0 : 99;
    console.log("Subtotal:", subtotal, "; Shipping Fee:", shippingFee);

    // Coupon discount
    let discount = 0;
    let appliedCoupon = "";
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      console.log("Coupon lookup:", couponCode, coupon);

      if (coupon && new Date() < coupon.expiresAt && coupon.usedCount < coupon.maxUses && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === "percentage") {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
        } else {
          discount = coupon.discountValue;
        }
        coupon.usedCount += 1;
        await coupon.save();
        appliedCoupon = coupon.code;
        console.log("Coupon applied:", appliedCoupon, "Discount:", discount);
      } else {
        console.log("Coupon conditions not met or not found");
      }
    }

    const total = subtotal + shippingFee - discount;
    console.log("Order totals:", { subtotal, shippingFee, discount, total });

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      payment: { method: paymentMethod, status: paymentMethod === "cod" ? "pending" : "pending" },
      status: "pending",
      subtotal,
      shippingFee,
      discount,
      total,
      couponCode: appliedCoupon,
      statusHistory: [{ status: "pending", message: "Order placed", timestamp: new Date() }],
    });

    console.log("Order created:", order._id);

    // Clear cart
    cart.items = [];
    cart.coupon = "";
    await cart.save();
    console.log("Cart cleared for user:", req.user && req.user._id);

    // Send confirmation email
    try {
      await sendEmail(req.user.email, "Order Confirmed – EthnicBeing", orderConfirmationHtml(order, req.user));
      console.log("Order confirmation email sent to", req.user.email);
    } catch (e) {
      console.error("Email send failed:", e.message);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("placeOrder error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /orders (user orders)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate("items.product", "name images slug");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /orders/:id/track
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }, "status statusHistory trackingNumber estimatedDelivery");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, tracking: { status: order.status, statusHistory: order.statusHistory, trackingNumber: order.trackingNumber, estimatedDelivery: order.estimatedDelivery } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage" });
    }

    order.status = "cancelled";
    order.cancelReason = reason || "";
    order.statusHistory.push({ status: "cancelled", message: reason || "Cancelled by user", timestamp: new Date() });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && item.size) {
        const sizeIdx = product.sizes.findIndex((s) => s.size === item.size);
        if (sizeIdx > -1) {
          product.sizes[sizeIdx].stock += item.qty;
          await product.save();
        }
      }
    }

    res.json({ success: true, message: "Order cancelled", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /orders/:id/return
const returnOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }
    order.status = "return_initiated";
    order.returnReason = reason || "";
    order.statusHistory.push({ status: "return_initiated", message: reason || "Return requested by user", timestamp: new Date() });
    await order.save();
    res.json({ success: true, message: "Return request submitted", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin controllers ──────────────────────────────────────────────────────────

// GET /orders/admin/all
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip   = (Number(page) - 1) * Number(limit);
    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));
    res.json({ success: true, total, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /orders/admin/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, message, trackingNumber, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    order.statusHistory.push({ status, message: message || `Status updated to ${status}`, timestamp: new Date() });
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, trackOrder, cancelOrder, returnOrder, getAllOrders, updateOrderStatus };
