const express = require("express");
const router  = express.Router();
const { protect }   = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");
const { upload }    = require("../middlewares/upload");
const {
  getCategories, newsletterSubscribe, contactForm, uploadImage,
} = require("../Controllers/miscController");

router.get("/categories",              getCategories);
router.post("/newsletter/subscribe",   newsletterSubscribe);
router.post("/contact",                contactForm);
router.post("/upload/image",           protect, adminOnly, upload.single("image"), uploadImage);

module.exports = router;
