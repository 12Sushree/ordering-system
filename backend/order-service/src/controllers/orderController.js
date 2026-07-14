const { sendSuccess, sendError } = require("../../../shared/utils/response");
const orderService = require("../services/orderService");

async function getOrders(req, res) {
  try {
    const orders = await orderService.getAllOrders(req.user, req.query);

    return sendSuccess(res, { data: orders });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: "Unable to load your order history right now",
    });
  }
}

async function createOrder(req, res) {
  try {
    const result = await orderService.createOrder(req.body, req.user);
    const { order, deferred, duplicate } = result;
    const message = deferred
      ? "Order saved. One service is down, we will process it later."
      : duplicate
        ? "Order already saved. We will process it later."
        : "Order initiated successfully";

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
    if (
      error.message === "Product not found" ||
      error.message === "Quantity must be greater than zero" ||
      error.message === "Missing client request id"
    ) {
      return sendError(res, {
        statusCode: error.message === "Product not found" ? 404 : 400,
        message:
          error.message === "Missing client request id"
            ? "Retry the request from the form. The order request id was missing."
            : error.message,
      });
    }

    return sendError(res, {
      statusCode: 500,
      message: "Unable to save your order right now",
    });
  }
}

module.exports = {
  createOrder,
  getOrders,
};
