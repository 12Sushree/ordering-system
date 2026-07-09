const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    productId: {
      type: Number,
      required: true,
      index: true,
    },

    productTitle: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Useful indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);
