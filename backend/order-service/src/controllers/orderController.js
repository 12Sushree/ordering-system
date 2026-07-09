const orderService = require("../services/orderService");

async function getOrders(req, res) {
  try {
    const orders = await orderService.getAllOrders();

    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Unable to fetch orders",
    });
  }
}

async function createOrder(req, res) {
  try {
    const order = await orderService.createOrder(req.body);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    if (
      error.message === "Product not found" ||
      error.message === "Quantity must be greater than zero"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create order",
    });
  }
}

module.exports = {
  createOrder,
  getOrders,
};
