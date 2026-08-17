const cloudinary = require("cloudinary").v2;

console.log("[CLOUDINARY] Configuring Cloudinary with environment variables...");
console.log("[CLOUDINARY] Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("[CLOUDINARY] Cloudinary configured.");

module.exports = cloudinary;
