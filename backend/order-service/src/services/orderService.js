const Order = require("../../../shared/models/orderModel");
const Product = require("../../../shared/models/productModel");
const OutboxEvent = require("../../../shared/models/outboxEventModel");

const { publishEvent } = require("../../../shared/kafka/producer");
const runInTransaction = require("../../../shared/utils/mongoTransaction");
const drainOutbox = require("../../../shared/utils/outboxDispatcher");
const {
  createNotification,
  recordAuditLog,
} = require("../../../shared/utils/activity");

const TOPICS = require("../../../shared/constants/topics");
const EVENTS = require("../../../shared/constants/events");
const STATUS = require("../../../shared/constants/orderStatus");

const logger = require("../../../shared/logger/logger");

const SERVICE_NAME = "order";

async function publishOrderOutbox(record) {
  await publishEvent(record.topic, record.eventType, record.payload, {
    eventId: record.eventId,
    key: record.payload.orderId,
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
      $ne: "DISPATCHED",
    },
  });

  return {
    deferred: Boolean(pendingEvent),
  };
}

async function createOrder(data, user) {
  const { productId, quantity, clientRequestId } = data;

  if (!clientRequestId) {
    throw new Error("Missing client request id");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const result = await runInTransaction(async (session) => {
    const product = await Product.findOne({
      productId,
    }).session(session);

    if (!product) {
      throw new Error("Product not found");
    }

    const existingOrder = await Order.findOne({
      clientRequestId,
    }).session(session);

    if (existingOrder) {
      return {
        order: existingOrder,
        duplicate: true,
      };
    }

    const totalPrice = quantity * product.price;

    const createdOrder = await Order.create(
      [
        {
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          clientRequestId,
          productId,
          productTitle: product.title,
          quantity,
          unitPrice: product.price,
          totalPrice,
          status: STATUS.PENDING,
          statusHistory: [
            {
              status: STATUS.PENDING,
              note: "Order created and waiting for inventory confirmation.",
              changedBy: user.name,
            },
          ],
        },
      ],
      {
        session,
      },
    );

    await OutboxEvent.create(
      [
        {
          eventId: clientRequestId,
          service: SERVICE_NAME,
          topic: TOPICS.ORDER_CREATED,
          eventType: EVENTS.ORDER_CREATED,
          payload: {
            orderId: createdOrder[0]._id.toString(),
          },
        },
      ],
      {
        session,
      },
    );

    return {
      order: createdOrder[0],
      duplicate: false,
    };
  });

  if (result.duplicate) {
    const deliveryState = await getOrderDeliveryState(clientRequestId);

    await createNotification({
      userId: user.id,
      audience: "USER",
      type: "ORDER_ALREADY_SAVED",
      title: "Order already saved",
      message: "That order request was already saved and will be processed later.",
      metadata: {
        orderId: result.order._id.toString(),
      },
    });

    return {
      order: result.order,
      duplicate: true,
      ...deliveryState,
    };
  }

  const order = result.order;

  await flushOrderOutbox();

  const deliveryState = await getOrderDeliveryState(clientRequestId);

  await recordAuditLog({
    actor: user,
    action: deliveryState.deferred ? "ORDER_DEFERRED" : "ORDER_CREATED",
    entityType: "Order",
    entityId: order._id.toString(),
    summary: deliveryState.deferred
      ? `Order ${order._id.toString()} saved for later processing`
      : `Order ${order._id.toString()} created successfully`,
    metadata: {
      deferred: deliveryState.deferred,
      productId: order.productId,
      quantity: order.quantity,
    },
  });

  await createNotification({
    userId: user.id,
    audience: "USER",
    type: deliveryState.deferred ? "ORDER_DEFERRED" : "ORDER_CREATED",
    title: deliveryState.deferred ? "Order saved for later" : "Order initiated",
    message: deliveryState.deferred
      ? "One service is down, so the order was saved and will be processed later."
      : "Your order has been initiated successfully.",
    metadata: {
      orderId: order._id.toString(),
      status: order.status,
    },
  });

  logger.info(
    `Order Created :: ${order._id.toString()} :: Deferred=${deliveryState.deferred}`,
  );

  return {
    order,
    duplicate: false,
    ...deliveryState,
  };
}

function buildOrderQuery(user, { search = "", status = "" } = {}) {
  const query = user?.role === "ADMIN" ? {} : { userId: user.id };
  const normalizedSearch = String(search || "").trim();

  if (status) {
    query.status = status;
  }

  if (normalizedSearch) {
    query.$or = [
      { productTitle: { $regex: normalizedSearch, $options: "i" } },
      { customerName: { $regex: normalizedSearch, $options: "i" } },
      { customerEmail: { $regex: normalizedSearch, $options: "i" } },
      { clientRequestId: { $regex: normalizedSearch, $options: "i" } },
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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

module.exports = {
  createOrder,
  getAllOrders,
  flushOrderOutbox,
};
