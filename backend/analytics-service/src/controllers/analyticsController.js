const Analytics = require("../models/analyticsModel");
const { sendSuccess } = require("../../../shared/utils/response");

async function getAnalytics(req, res, next) {
  try {
    const analytics = await Analytics.findOne();

    return sendSuccess(res, {
      data: analytics || {
        totalOrders: 0,
        confirmedOrders: 0,
        rejectedOrders: 0,
        totalRevenue: 0,
        totalProductsSold: 0,
        inventoryFailures: 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalytics,
};
