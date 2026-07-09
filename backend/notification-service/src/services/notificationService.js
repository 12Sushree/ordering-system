const ProcessedEvent = require("../../../shared/models/processedEventModel");

const logger = require("../../../shared/logger/logger");

const SERVICE_NAME = "notification";

async function processNotification(event) {
  const { eventId, payload } = event;

  const { orderId, status } = payload;

  logger.info(`Received Notification Event :: ${eventId} :: Order ${orderId}`);

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
    logger.warn(`Duplicate Notification Event Skipped :: ${eventId}`);

    return;
  }

  /**
   * =====================================
   * Send Notification
   * =====================================
   *
   * Replace this section with actual email/SMS
   * sending logic in a real application.
   */

  logger.info("=======================================");
  logger.info("📧 Sending Notification");
  logger.info(`Order ID : ${orderId}`);
  logger.info(`Status   : ${status}`);
  logger.info("=======================================");

  /**
   * =====================================
   * Save Processed Event
   * =====================================
   */
  await ProcessedEvent.create({
    eventId,
    service: SERVICE_NAME,
  });

  logger.info(`Notification Event Saved :: ${eventId}`);
}

module.exports = {
  processNotification,
};
