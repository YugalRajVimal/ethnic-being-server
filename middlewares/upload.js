const multer     = require("multer");
const path       = require("path");
const cloudinary = require("../config/cloudinary");

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "Uploads/"),
  filename:    (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, .png, .webp images are allowed"), false);
  }
};

const uploadToCloudinary = async (filePath, folder = "ethnicbeing") => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });
  return result.secure_url;
};

const upload = multer({
  storage:   localStorage,
  fileFilter,
  limits:    { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload, uploadToCloudinary };
