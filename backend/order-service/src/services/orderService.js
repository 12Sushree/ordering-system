const Order = require("../models/orderModel");
const OutboxEvent = require("../../../shared/models/outboxEventModel");
const ProcessedEvent = require("../../../shared/models/processedEventModel");
const inventoryClient = require("../clients/inventoryClient");
const { publishEvent } = require("../../../shared/kafka/producer");
const { runInTransaction } = require("../../../shared/utils/mongoTransaction");
const { drainOutbox } = require("../../../shared/utils/outboxDispatcher");
const TOPICS = require("../../../shared/constants/topics");
const EVENTS = require("../../../shared/constants/events");
const STATUS = require("../../../shared/constants/orderStatus");
const ROLES = require("../../../shared/constants/roles");
const logger = require("../../../shared/logger/logger");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function publishOrderOutbox(record) {
  await publishEvent(record.topic, record.eventType, record.payload, {
    eventId: record.eventId,
    key: record.payload.orderId,
    source: SERVICE_NAME,
  });
}

async function flushOrderOutbox() {
  await drainOutbox({
    service: SERVICE_NAME,
    publishRecord: publishOrderOutbox,
  });
}

async function getOrderDeliveryState(clientRequestId) {
  const pendingEvent = await OutboxEvent.findOne({
    eventId: clientRequestId,
    service: SERVICE_NAME,
    status: {
      $in: ["PENDING", "PROCESSING", "FAILED"],
    },
  });
  return {
    deferred: Boolean(pendingEvent),
  };
}

function validateCreateOrderRequest(data, user) {
  if (!user?.id) {
    throw createHttpError("Unauthorized", 401);
  }

  const { productId, quantity, clientRequestId } = data;
  if (!clientRequestId) {
    throw createHttpError("Missing client request id", 400);
  }
  if (!productId) {
    throw createHttpError("Product is required", 400);
  }
  if (!quantity || quantity <= 0) {
    throw createHttpError("Quantity must be greater than zero", 400);
  }

  return {
    productId,
    quantity,
    clientRequestId,
  };
}

async function createOrder(data, user) {
  const { productId, quantity, clientRequestId } = validateCreateOrderRequest(
    data,
    user,
  );

  const existingOrder = await Order.findOne({
    clientRequestId,
  });
  if (existingOrder) {
    const state = await getOrderDeliveryState(clientRequestId);
    return {
      order: existingOrder,
      duplicate: true,
      deferred: state.deferred,
    };
  }

  const product = await inventoryClient.getProduct(productId, user.token);
  if (!product) {
    throw createHttpError("Product not found", 404);
  }

  const totalPrice = quantity * product.price;

  let createdOrder;

  try {
    createdOrder = await runInTransaction(async (session) => {
      const duplicate = await Order.findOne({
        clientRequestId,
      }).session(session);
      if (duplicate) {
        return duplicate;
      }

      const order = await Order.create(
        [
          {
            userId: user.id,
            customerName: user.name,
            customerEmail: user.email,
            clientRequestId,
            productId: product.productId,
            productTitle: product.title,
            quantity,
            unitPrice: product.price,
            totalPrice,
            status: STATUS.PENDING,
            statusHistory: [
              {
                status: STATUS.PENDING,
                note: "Order created. Waiting for inventory confirmation.",
                changedBy: `${user.id} (${user.name})`,
              },
            ],
          },
        ],
        {
          session,
        },
      );

      const created = order[0];

      await OutboxEvent.create(
        [
          {
            eventId: clientRequestId,
            service: SERVICE_NAME,
            topic: TOPICS.ORDER_CREATED,
            eventType: EVENTS.ORDER_CREATED,
            payload: {
              orderId: created._id.toString(),
              productId: product.productId,
              productTitle: product.title,
              quantity,
              unitPrice: product.price,
              totalPrice,
              userId: user.id,
              customerName: user.name,
              customerEmail: user.email,
            },
          },
        ],
        {
          session,
        },
      );

      return created;
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await Order.findOne({
        clientRequestId,
      });

      const state = await getOrderDeliveryState(clientRequestId);

      return {
        order: duplicate,
        duplicate: true,
        deferred: state.deferred,
      };
    }

    throw error;
  }

  await flushOrderOutbox();

  const state = await getOrderDeliveryState(clientRequestId);

  logger.info(`Order Created ${createdOrder._id} Deferred=${state.deferred}`);

  return {
    order: createdOrder,
    duplicate: false,
    deferred: state.deferred,
  };
}

function validateInventoryUpdateEvent(event) {
  if (!event) {
    throw createHttpError("Inventory event is missing", 400);
  }

  const { eventId, eventType, payload } = event;
  if (!eventId) {
    throw createHttpError("Event id is missing", 400);
  }
  if (!eventType) {
    throw createHttpError("Event type is missing", 400);
  }
  if (!payload) {
    throw createHttpError("Event payload is missing", 400);
  }

  const { orderId, status } = payload;
  if (!orderId) {
    throw createHttpError("Order id is missing", 400);
  }
  if (!status) {
    throw createHttpError("Order status is missing", 400);
  }

  return {
    eventId,
    eventType,
    orderId,
    status,
  };
}

function buildOrderQuery(user, { search = "", status = "" } = {}) {
  const query = user?.role === ROLES.ADMIN ? {} : { userId: user.id };
  const normalizedSearch = String(search || "").trim();

  if (status) {
    query.status = status;
  }

  if (normalizedSearch) {
    query.$or = [
      {
        productTitle: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
      {
        customerName: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
      {
        customerEmail: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
      {
        clientRequestId: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
    ];
  }
  return query;
}

async function getAllOrders(user, filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
  const query = buildOrderQuery(user, filters);

  const [items, total] = await Promise.all([
    Order.find(query)
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

const ORDER_TRANSITIONS = {
  [STATUS.PENDING]: [STATUS.CONFIRMED, STATUS.REJECTED],
};

function canMoveOrderStatus(currentStatus, nextStatus) {
  const allowedTransitions = ORDER_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(nextStatus);
}

async function processInventoryUpdate(event) {
  const { eventId, eventType, orderId, status } =
    validateInventoryUpdateEvent(event);

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

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw createHttpError(`Order not found: ${orderId}`, 404);
    }
    if (order.status === status) {
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

      return {
        duplicate: false,
        orderId: order._id.toString(),
        status,
      };
    }

    if (!canMoveOrderStatus(order.status, status)) {
      throw createHttpError(
        `Invalid order status transition ${order.status} -> ${status}`,
        400,
      );
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
          eventType,
          service: SERVICE_NAME,
        },
      ],
      {
        session,
      },
    );

    return {
      duplicate: false,
      orderId: order._id.toString(),
      status,
    };
  });

  if (result.duplicate) {
    logger.warn(`Duplicate Inventory Event Skipped :: ${eventId}`);
    return;
  }

  await flushOrderOutbox();
  logger.info(`Order Updated :: ${result.orderId} :: Status=${result.status}`);
}

module.exports = {
  createOrder,
  getAllOrders,
  processInventoryUpdate,
  flushOrderOutbox,
};
