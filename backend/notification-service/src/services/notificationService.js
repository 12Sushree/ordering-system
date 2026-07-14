const ProcessedEvent = require("../../../shared/models/processedEventModel");
const Order = require("../../../shared/models/orderModel");
const OutboxEvent = require("../../../shared/models/outboxEventModel");
const runInTransaction = require("../../../shared/utils/mongoTransaction");
const drainOutbox = require("../../../shared/utils/outboxDispatcher");
const { sendEmail } = require("./emailService");

const logger = require("../../../shared/logger/logger");

const SERVICE_NAME = "notification";

function buildOrderEmail(order, status) {
  if (!order?.customerEmail || !order?.customerName || !order?.productTitle) {
    return null;
  }

  if (status === "CONFIRMED") {
    return {
      to: order.customerEmail,
      subject: "Your order has been confirmed",
      text: [
        `Hello ${order.customerName},`,
        "",
        `Good news! Your order for "${order.productTitle}" has been confirmed.`,
        `Quantity: ${order.quantity}`,
        "",
        "Thank you for ordering with us.",
      ].join("\n"),
    };
  }

  if (status === "REJECTED") {
    return {
      to: order.customerEmail,
      subject: "Your order has been rejected",
      text: [
        `Hello ${order.customerName},`,
        "",
        `Your order for "${order.productTitle}" was rejected due to insufficient stock.`,
        `Quantity: ${order.quantity}`,
        "",
        "You can try again once the item is back in stock.",
      ].join("\n"),
    };
  }

  return null;
}

async function flushNotificationOutbox() {
  await drainOutbox({
    service: SERVICE_NAME,
    publishRecord: async (record) => {
      const { orderId, status } = record.payload;
      const order = await Order.findById(orderId).lean();

      logger.info("=======================================");
      logger.info("Sending notification");
      logger.info(`Order ID : ${orderId}`);
      logger.info(`Status   : ${status}`);
      logger.info(`Event ID : ${record.eventId}`);
      logger.info("=======================================");

      const emailPayload = buildOrderEmail(order, status);

      if (!emailPayload) {
        logger.warn(
          `Skipping email for order ${orderId} because the payload is incomplete or status is unsupported.`,
        );
        return;
      }

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn(
          `Email credentials are missing; skipping email for order ${orderId}.`,
        );
        return;
      }

      await sendEmail(emailPayload);
    },
  });
}

async function processNotification(event) {
  const { eventId, payload } = event;
  const { orderId, status } = payload;

  logger.info(`Received Notification Event :: ${eventId} :: Order ${orderId}`);

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
          topic: "notification",
          eventType: "NOTIFICATION_DISPATCH",
          payload: {
            orderId,
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
    };
  });

  if (result?.duplicate) {
    logger.warn(`Duplicate Notification Event Skipped :: ${eventId}`);
    return;
  }

  await flushNotificationOutbox();

  logger.info(`Notification Event Saved :: ${eventId}`);
}

module.exports = {
  processNotification,
  flushNotificationOutbox,
};
