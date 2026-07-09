const Analytics = require("../models/analyticsModel");

const ProcessedEvent = require("../../../shared/models/processedEventModel");

const STATUS = require("../../../shared/constants/orderStatus");

const logger = require("../../../shared/logger/logger");

const SERVICE_NAME = "analytics";

async function processAnalytics(event) {
  const { eventId, payload } = event;

  const { orderId, status } = payload;

  logger.info(`Received Analytics Event :: ${eventId} :: Order ${orderId}`);

  /**
   * =====================================
   * Idempotency Check
   * =====================================
   */

  const alreadyProcessed = await ProcessedEvent.findOne({
    eventId,
    service: SERVICE_NAME,
  });

  if (alreadyProcessed) {
    logger.warn(`Duplicate Analytics Event Skipped :: ${eventId}`);

    return;
  }

  /**
   * =====================================
   * Update Analytics
   * =====================================
   */

  if (status === STATUS.CONFIRMED) {
    await Analytics.findOneAndUpdate(
      {},
      {
        $inc: {
          totalOrders: 1,
          confirmedOrders: 1,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    logger.info(`Confirmed Order Analytics Updated :: ${orderId}`);
  } else {
    await Analytics.findOneAndUpdate(
      {},
      {
        $inc: {
          totalOrders: 1,
          rejectedOrders: 1,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    logger.info(`Rejected Order Analytics Updated :: ${orderId}`);
  }

  /**
   * =====================================
   * Save Processed Event
   * =====================================
   */

  await ProcessedEvent.create({
    eventId,
    service: SERVICE_NAME,
  });

  logger.info(`Analytics Event Saved :: ${eventId}`);
}

module.exports = {
  processAnalytics,
};
