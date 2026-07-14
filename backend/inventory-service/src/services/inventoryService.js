const Order = require("../../../shared/models/orderModel");
const Product = require("../../../shared/models/productModel");
const ProcessedEvent = require("../../../shared/models/processedEventModel");
const OutboxEvent = require("../../../shared/models/outboxEventModel");

const runInTransaction = require("../../../shared/utils/mongoTransaction");
const drainOutbox = require("../../../shared/utils/outboxDispatcher");
const { publishEvent } = require("../../../shared/kafka/producer");
const {
  createNotification,
  recordAuditLog,
} = require("../../../shared/utils/activity");

const TOPICS = require("../../../shared/constants/topics");
const EVENTS = require("../../../shared/constants/events");
const STATUS = require("../../../shared/constants/orderStatus");

const logger = require("../../../shared/logger/logger");

const SERVICE_NAME = "inventory";

async function publishInventoryOutbox(record) {
  await publishEvent(record.topic, record.eventType, record.payload, {
    eventId: record.eventId,
    key: record.payload.orderId,
  });
}

async function flushInventoryOutbox() {
  await drainOutbox({
    service: SERVICE_NAME,
    publishRecord: publishInventoryOutbox,
  });
}

async function processInventory(event) {
  const { eventId, payload } = event;
  const { orderId } = payload;

  logger.info(`Received Event :: ${eventId} :: Order ${orderId}`);

  const result = await runInTransaction(async (session) => {
    const alreadyProcessed = await ProcessedEvent.findOne({
      eventId,
      service: SERVICE_NAME,
    }).session(session);

    if (alreadyProcessed) {
      return {
        duplicate: true,
      };
    }

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error(`Order Not Found : ${orderId}`);
    }

    const product = await Product.findOne({
      productId: order.productId,
    }).session(session);

    if (!product) {
      throw new Error("Product Not Found");
    }

    let status;

    if (product.stock >= order.quantity) {
      product.stock -= order.quantity;
      await product.save({ session });

      status = STATUS.CONFIRMED;
    } else {
      status = STATUS.REJECTED;
    }

    order.status = status;
    order.statusHistory = [
      ...(order.statusHistory || []),
      {
        status,
        note:
          status === STATUS.CONFIRMED
            ? "Inventory confirmed the order."
            : "Inventory rejected the order due to insufficient stock.",
        changedBy: "Inventory Service",
      },
    ];
    await order.save({ session });

    await ProcessedEvent.create(
      [
        {
          eventId,
          service: SERVICE_NAME,
        },
      ],
      {
        session,
      },
    );

    await OutboxEvent.create(
      [
        {
          eventId,
          service: SERVICE_NAME,
          topic: TOPICS.INVENTORY_UPDATED,
          eventType: EVENTS.INVENTORY_UPDATED,
          payload: {
            orderId: order._id.toString(),
            status,
          },
        },
      ],
      {
        session,
      },
    );

    return {
      duplicate: false,
      status,
      orderId: order._id.toString(),
      orderSnapshot: {
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        productTitle: order.productTitle,
      },
    };
  });

  if (result?.duplicate) {
    logger.warn(`Duplicate Event Skipped :: ${eventId}`);
    return;
  }

  await flushInventoryOutbox();

  const { orderSnapshot } = result;

  await recordAuditLog({
    actor: {
      id: orderSnapshot.userId,
      name: orderSnapshot.customerName,
      email: orderSnapshot.customerEmail,
      role: "USER",
    },
    action: result.status === STATUS.CONFIRMED ? "ORDER_CONFIRMED" : "ORDER_REJECTED",
    entityType: "Order",
    entityId: result.orderId,
    summary:
      result.status === STATUS.CONFIRMED
        ? `Order ${result.orderId} confirmed by inventory`
        : `Order ${result.orderId} rejected by inventory`,
    metadata: {
      status: result.status,
    },
  });

  await createNotification({
    userId: orderSnapshot.userId,
    audience: "USER",
    type: result.status === STATUS.CONFIRMED ? "ORDER_CONFIRMED" : "ORDER_REJECTED",
    title:
      result.status === STATUS.CONFIRMED
        ? "Order confirmed"
        : "Order rejected",
    message:
      result.status === STATUS.CONFIRMED
        ? `Your order ${orderSnapshot.productTitle} has been confirmed.`
        : `Your order ${orderSnapshot.productTitle} was rejected due to insufficient stock.`,
    metadata: {
      orderId: result.orderId,
      status: result.status,
    },
  });

  logger.info(`Inventory Updated :: ${result.orderId} :: ${result.status}`);
}

module.exports = {
  processInventory,
  flushInventoryOutbox,
};
