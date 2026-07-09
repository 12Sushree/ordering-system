const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Useful indexes
productSchema.index({ title: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);
