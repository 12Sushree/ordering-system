const Analytics = require("../models/analyticsModel");
const ProcessedEvent = require("../../../shared/models/processedEventModel");
const runInTransaction = require("../../../shared/utils/mongoTransaction");

const STATUS = require("../../../shared/constants/orderStatus");
const logger = require("../../../shared/logger/logger");

const SERVICE_NAME = "analytics";

async function processAnalytics(event) {
  const { eventId, payload } = event;
  const { orderId, status } = payload;

  logger.info(`Received Analytics Event :: ${eventId} :: Order ${orderId}`);

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
          returnDocument: "after",
          session,
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
          returnDocument: "after",
          session,
        },
      );

      logger.info(`Rejected Order Analytics Updated :: ${orderId}`);
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

    return {
      duplicate: false,
    };
  });

  if (result?.duplicate) {
    logger.warn(`Duplicate Analytics Event Skipped :: ${eventId}`);
    return;
  }

  logger.info(`Analytics Event Saved :: ${eventId}`);
}

module.exports = {
  processAnalytics,
};
