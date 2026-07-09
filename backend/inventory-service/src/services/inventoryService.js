const Order = require("../../../shared/models/orderModel");
const Product = require("../../../shared/models/productModel");
const ProcessedEvent = require("../../../shared/models/processedEventModel");

const { publishEvent } = require("../../../shared/kafka/producer");

const TOPICS = require("../../../shared/constants/topics");
const EVENTS = require("../../../shared/constants/events");
const STATUS = require("../../../shared/constants/orderStatus");

const logger = require("../../../shared/logger/logger");

const SERVICE_NAME = "inventory";

async function processInventory(event) {
  const { eventId, payload } = event;

  const { orderId } = payload;

  logger.info(`Received Event :: ${eventId} :: Order ${orderId}`);

  /**
   * ===========================
   * Idempotency Check
   * ===========================
   */
  const alreadyProcessed = await ProcessedEvent.findOne({
    eventId,
    service: SERVICE_NAME,
  });

  if (alreadyProcessed) {
    logger.warn(`Duplicate Event Skipped :: ${eventId}`);

    return;
  }

  /**
   * ===========================
   * Fetch Order
   * ===========================
   */
  const order = await Order.findById(orderId);

  if (!order) {
    logger.error(`Order Not Found : ${orderId}`);
    return;
  }

  /**
   * ===========================
   * Fetch Product
   * ===========================
   */
  const product = await Product.findOne({
    productId: order.productId,
  });

  if (!product) {
    logger.error("Product Not Found");
    return;
  }

  /**
   * ===========================
   * Inventory Logic
   * ===========================
   */
  let status;

  if (product.stock >= order.quantity) {
    product.stock -= order.quantity;

    await product.save();

    status = STATUS.CONFIRMED;
  } else {
    status = STATUS.REJECTED;
  }

  order.status = status;

  await order.save();

  /**
   * ===========================
   * Save Processed Event
   * ===========================
   */
  await ProcessedEvent.create({
    eventId,
    service: SERVICE_NAME,
  });

  logger.info(`Event Saved :: ${eventId}`);

  /**
   * ===========================
   * Publish Next Event
   * ===========================
   */
  await publishEvent(TOPICS.INVENTORY_UPDATED, EVENTS.INVENTORY_UPDATED, {
    orderId: order._id.toString(),
    status,
  });

  logger.info(`Inventory Updated :: ${orderId}`);
}

module.exports = {
  processInventory,
};
