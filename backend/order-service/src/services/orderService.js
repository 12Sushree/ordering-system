const Order = require("../../../shared/models/orderModel");
const Product = require("../../../shared/models/productModel");

const { publishEvent } = require("../../../shared/kafka/producer");

const TOPICS = require("../../../shared/constants/topics");
const EVENTS = require("../../../shared/constants/events");
const STATUS = require("../../../shared/constants/orderStatus");

async function createOrder(data) {
  const { customerName, customerEmail, productId, quantity } = data;

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const product = await Product.findOne({
    productId,
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const totalPrice = quantity * product.price;

  const order = await Order.create({
    customerName,
    customerEmail,
    productId,
    productTitle: product.title,
    quantity,
    unitPrice: product.price,
    totalPrice,
    status: STATUS.PENDING,
  });

  await publishEvent(TOPICS.ORDER_CREATED, EVENTS.ORDER_CREATED, {
    orderId: order._id.toString(),
  });

  return order;
}

async function getAllOrders() {
  return await Order.find().sort({
    createdAt: -1,
  });
}

module.exports = {
  createOrder,
  getAllOrders,
};
