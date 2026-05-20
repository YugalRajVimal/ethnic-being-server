const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product:            { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user:               { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    rating:             { type: Number, required: true, min: 1, max: 5 },
    comment:            { type: String, default: "", trim: true },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

async function updateProductRating(productId) {
  const Review  = mongoose.model("Review");
  const Product = mongoose.model("Product");

  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating:      Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { rating: 0, reviewCount: 0 });
  }
}

reviewSchema.post("save",   function () { updateProductRating(this.product); });
reviewSchema.post("remove", function () { updateProductRating(this.product); });

module.exports = mongoose.model("Review", reviewSchema);
