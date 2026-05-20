const mongoose = require("mongoose");

const sizeStockSchema = new mongoose.Schema({
  size:  { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name:          { type: String, required: [true, "Product name is required"], trim: true },
    slug:          { type: String, unique: true, lowercase: true },
    description:   { type: String, default: "" },
    price:         { type: Number, required: [true, "Price is required"], min: 0 },
    originalPrice: { type: Number, min: 0 },
    category:      { type: String, required: [true, "Category is required"], enum: ["T-Shirts","Shirts","Hoodies","Bottoms","Accessories"] },
    tags:          [{ type: String }],
    images:        [{ type: String }],
    sizes:         [sizeStockSchema],
    color:         { type: String, default: "" },
    inStock:       { type: Boolean, default: true },
    rating:        { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:   { type: Number, default: 0 },
    isFeatured:    { type: Boolean, default: false },
    tag:           { type: String, enum: ["SALE","NEW","SOLD OUT",""], default: "" },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  if (this.sizes && this.sizes.length > 0) {
    this.inStock = this.sizes.some((s) => s.stock > 0);
  }
  next();
});

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, price: 1, inStock: 1 });

module.exports = mongoose.model("Product", productSchema);
