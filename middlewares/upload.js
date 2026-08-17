const multer     = require("multer");
const path       = require("path");
const cloudinary = require("../config/cloudinary");

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("[MULTER] Saving file to Uploads/ directory");
    cb(null, "Uploads/");
  },
  filename:    (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log(`[MULTER] Generated filename: ${filename}`);
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  console.log(`[MULTER] Received file type: ${file.mimetype}`);
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log("[MULTER] Rejected file: Unsupported file type");
    cb(new Error("Only .jpg, .jpeg, .png, .webp images are allowed"), false);
  }
};

const uploadToCloudinary = async (filePath, folder = "ethnicbeing") => {
  console.log(`[CLOUDINARY] Uploading file: ${filePath} to folder: ${folder}`);
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });
  console.log(`[CLOUDINARY] File uploaded. Secure URL: ${result.secure_url}`);
  return result.secure_url;
};

const upload = multer({
  storage:   localStorage,
  fileFilter,
  limits:    { fileSize: 5 * 1024 * 1024 },
});

console.log("[UPLOAD] Multer middleware configured.");

module.exports = { upload, uploadToCloudinary };
