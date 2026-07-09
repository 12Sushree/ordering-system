const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    totalOrders: {
      type: Number,
      default: 0,
    },

    confirmedOrders: {
      type: Number,
      default: 0,
    },

    rejectedOrders: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Analytics", analyticsSchema);
