const Product = require("../Schema/Product");
const { uploadToCloudinary } = require("../middlewares/upload");
const fs = require("fs");

// GET /categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /newsletter/subscribe
const newsletterSubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    // In production, save to a Newsletter collection or send to email service
    res.json({ success: true, message: "Subscribed to newsletter successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /contact
const contactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email and message are required" });
    }
    // In production, save to DB or send email to support
    res.json({ success: true, message: "Message received. We'll get back to you soon!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /upload/image (Admin)
const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file provided" });
    const url = await uploadToCloudinary(req.file.path, "ethnicbeing/misc");
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories, newsletterSubscribe, contactForm, uploadImage };
