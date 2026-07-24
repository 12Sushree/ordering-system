const { sendSuccess } = require("../../../shared/utils/response");
const orderService = require("../services/orderService");

async function createOrder(req, res, next) {
  try {
    const { order, deferred, duplicate } = await orderService.createOrder(
      req.body,
      req.user,
    );

    let message = "Order initiated successfully";

    if (duplicate) {
      message = "Order already exists. We will continue processing it.";
    } else if (deferred) {
      message = "Order saved. Processing will continue automatically.";
    }

    return sendSuccess(res, {
      statusCode: duplicate ? 200 : 201,
      message,
      data: {
        order,
        deferred,
        duplicate,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getOrders(req, res, next) {
  try {
    const orders = await orderService.getAllOrders(req.user, req.query);
    return sendSuccess(res, {
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getOrders,
};
