const ProcessedEvent = require("../../../shared/models/processedEventModel");
const OutboxEvent = require("../../../shared/models/outboxEventModel");
const { runInTransaction } = require("../../../shared/utils/mongoTransaction");
const { drainOutbox } = require("../../../shared/utils/outboxDispatcher");
const { sendEmail } = require("./emailService");
const SERVICES = require("../../../shared/constants/services");
const STATUS = require("../../../shared/constants/orderStatus");
const logger = require("../../../shared/logger/logger");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateNotificationEvent(event) {
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
    status,
    userId,
    customerName,
    customerEmail,
    productTitle,
    unitPrice,
    totalPrice,
  } = payload;

  if (!orderId) {
    throw createHttpError("Order id missing", 400);
  }
  if (!productId) {
    throw createHttpError("Product id missing", 400);
  }
  if (!quantity || quantity <= 0) {
    throw createHttpError("Invalid quantity", 400);
  }
  if (!status) {
    throw createHttpError("Order status missing", 400);
  }
  if (!customerEmail) {
    throw createHttpError("Customer email missing", 400);
  }

  return {
    eventId,
    eventType,
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
  };
}

function buildOrderEmail(data) {
  const {
    customerName,
    customerEmail,
    productTitle,
    quantity,
    totalPrice,
    status,
  } = data;

  if (status === STATUS.CONFIRMED) {
    return {
      to: customerEmail,
      subject: "Your order has been confirmed",
      text: [
        `Hello ${customerName},`,
        "",
        "Your order has been confirmed successfully.",
        "",
        `Product : ${productTitle}`,
        `Quantity: ${quantity}`,
        `Amount  : ₹${totalPrice}`,
        "",
        "Thank you for shopping with us.",
      ].join("\n"),
    };
  }

  if (status === STATUS.REJECTED) {
    return {
      to: customerEmail,
      subject: "Your order could not be fulfilled",
      text: [
        `Hello ${customerName},`,
        "",
        `Unfortunately your order for "${productTitle}" could not be fulfilled due to insufficient stock.`,
        "",
        `Quantity: ${quantity}`,
        "",
        "Please try again later.",
      ].join("\n"),
    };
  }
  return null;
}

async function publishNotification(record) {
  const emailPayload = buildOrderEmail(record.payload);
  if (!emailPayload) {
    logger.warn(`Unsupported notification payload :: ${record.eventId}`);
    return;
  }

  logger.info("=======================================");
  logger.info("Sending Notification");
  logger.info(`Order ID : ${record.payload.orderId}`);
  logger.info(`Status   : ${record.payload.status}`);
  logger.info(`Email    : ${emailPayload.to}`);
  logger.info(`Event ID : ${record.eventId}`);
  logger.info("=======================================");

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn(
      "Email credentials are not configured. Email dispatch skipped.",
    );
    return;
  }

  await sendEmail(emailPayload);
}

async function flushNotificationOutbox() {
  await drainOutbox({
    service: SERVICE_NAME,
    publishRecord: async (record) => {
      await publishNotification(record);
    },
  });
}

async function processNotification(event) {
  const {
    eventId,
    eventType,
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
  } = validateNotificationEvent(event);
  logger.info(`Received Notification Event :: ${eventId} :: Order=${orderId}`);

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
          eventId,
          service: SERVICE_NAME,
          topic: "internal.notification",
          eventType: "EMAIL_NOTIFICATION",
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
      status,
      customerEmail,
    };
  });

  if (result.duplicate) {
    logger.warn(`Duplicate Notification Event Ignored :: ${eventId}`);
    return;
  }

  await flushNotificationOutbox();
  logger.info(
    `Notification Processed :: Order=${result.orderId} :: Status=${result.status} :: Email=${result.customerEmail}`,
  );
}

module.exports = {
  processNotification,
  flushNotificationOutbox,
};
