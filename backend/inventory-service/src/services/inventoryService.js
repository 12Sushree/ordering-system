const Product = require("../models/productModel");
const ProcessedEvent = require("../../../shared/models/processedEventModel");
const OutboxEvent = require("../../../shared/models/outboxEventModel");
const { runInTransaction } = require("../../../shared/utils/mongoTransaction");
const { drainOutbox } = require("../../../shared/utils/outboxDispatcher");
const { publishEvent } = require("../../../shared/kafka/producer");
const TOPICS = require("../../../shared/constants/topics");
const EVENTS = require("../../../shared/constants/events");
const STATUS = require("../../../shared/constants/orderStatus");
const SERVICES = require("../../../shared/constants/services");
const logger = require("../../../shared/logger/logger");

async function publishInventoryOutbox(record) {
  await publishEvent(record.topic, record.eventType, record.payload, {
    eventId: record.eventId,
    key: record.payload.orderId,
    source: SERVICE_NAME,
  });
}

async function flushInventoryOutbox() {
  await drainOutbox({
    service: SERVICE_NAME,
    publishRecord: publishInventoryOutbox,
  });
}

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateInventoryEvent(event) {
  if (!event) {
    throw createHttpError("Event missing", 400);
  }

  const { eventId, eventType, payload } = event;
  if (!eventId) {
    throw createHttpError("Event id missing", 400);
  }
  if (!eventType) {
    throw createHttpError("Event type missing", 400);
  }
  if (!payload) {
    throw createHttpError("Payload missing", 400);
  }

  const {
    orderId,
    productId,
    quantity,
    userId,
    customerName,
    customerEmail,
    productTitle,
    unitPrice,
    totalPrice,
  } = payload;

  if (!orderId || !productId || !quantity || quantity <= 0) {
    throw createHttpError("Invalid inventory payload", 400);
  }

  return {
    eventId,
    eventType,
    orderId,
    productId,
    quantity,
    userId,
    customerName,
    customerEmail,
    productTitle,
    unitPrice,
    totalPrice,
  };
}

async function processInventory(event) {
  const {
    eventId,
    eventType,
    orderId,
    productId,
    quantity,
    userId,
    customerName,
    customerEmail,
    productTitle,
    unitPrice,
    totalPrice,
  } = validateInventoryEvent(event);

  const result = await runInTransaction(async (session) => {
    const alreadyProcessed = await ProcessedEvent.findOne({
      eventId,
      eventType,
      service: SERVICE_NAME,
    }).session(session);

    if (alreadyProcessed) {
      return {
        duplicate: true,
      };
    }

    const product = await Product.findOneAndUpdate(
      {
        productId,
        stock: {
          $gte: quantity,
        },
      },
      {
        $inc: {
          stock: -quantity,
        },
      },
      {
        session,
        new: true,
      },
    );

    const status = product ? STATUS.CONFIRMED : STATUS.REJECTED;

    await ProcessedEvent.create(
      [
        {
          eventId,
          eventType,
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
          eventId: `${eventId}-inventory`,
          service: SERVICE_NAME,
          topic: TOPICS.INVENTORY_UPDATED,
          eventType: EVENTS.INVENTORY_UPDATED,
          payload: {
            orderId,
            productId,
            quantity,
            status,
            userId,
            customerName,
            customerEmail,
            productTitle,
            unitPrice,
            totalPrice,
          },
        },
      ],
      {
        session,
      },
    );

    return {
      duplicate: false,
      orderId,
      productId,
      quantity,
      status,
      userId,
      customerName,
      customerEmail,
      productTitle,
      unitPrice,
      totalPrice,
      remainingStock: product?.stock ?? null,
    };
  });

  if (result.duplicate) {
    logger.warn(`Duplicate Inventory Event Ignored :: ${eventId}`);
    return;
  }

  await flushInventoryOutbox();
  logger.info(
    `Inventory Processed :: Order=${result.orderId} :: Status=${result.status}`,
  );

  return result;
}

module.exports = {
  processInventory,
  flushInventoryOutbox,
};
