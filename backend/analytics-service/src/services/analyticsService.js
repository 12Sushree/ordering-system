const Analytics = require("../models/analyticsModel");
const ProcessedEvent = require("../../../shared/models/processedEventModel");
const { runInTransaction } = require("../../../shared/utils/mongoTransaction");
const STATUS = require("../../../shared/constants/orderStatus");
const logger = require("../../../shared/logger/logger");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateAnalyticsEvent(event) {
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

async function processAnalytics(event) {
  const { eventId, eventType, orderId, quantity, status, totalPrice } =
    validateAnalyticsEvent(event);
  logger.info(`Received Analytics Event :: ${eventId} :: Order=${orderId}`);

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

    let analytics = await Analytics.findOne({}).session(session);
    if (!analytics) {
      const created = await Analytics.create(
        [
          {
            totalOrders: 0,
            confirmedOrders: 0,
            rejectedOrders: 0,
            totalRevenue: 0,
            totalProductsSold: 0,
            inventoryFailures: 0,
          },
        ],
        {
          session,
        },
      );
      analytics = created[0];
    }

    analytics.totalOrders += 1;

    if (status === STATUS.CONFIRMED) {
      analytics.confirmedOrders += 1;
      analytics.totalRevenue += totalPrice;
      analytics.totalProductsSold += quantity;
    } else {
      analytics.rejectedOrders += 1;
      analytics.inventoryFailures += 1;
    }

    await analytics.save({
      session,
    });

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
      orderId,
      status,
      totalOrders: analytics.totalOrders,
      confirmedOrders: analytics.confirmedOrders,
      rejectedOrders: analytics.rejectedOrders,
      totalRevenue: analytics.totalRevenue,
      totalProductsSold: analytics.totalProductsSold,
      inventoryFailures: analytics.inventoryFailures,
    };
  });

  if (result.duplicate) {
    logger.warn(`Duplicate Analytics Event Ignored :: ${eventId}`);
    return;
  }

  logger.info(
    `Analytics Updated :: Order=${result.orderId} :: Status=${result.status}`,
  );

  logger.info(
    `Dashboard :: Orders=${result.totalOrders} | Confirmed=${result.confirmedOrders} | Rejected=${result.rejectedOrders} | Revenue=${result.totalRevenue}`,
  );
}

module.exports = {
  processAnalytics,
};
