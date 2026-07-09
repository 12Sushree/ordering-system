const kafka = require("../../../shared/kafka/kafkaClient");
const TOPICS = require("../../../shared/constants/topics");
const logger = require("../../../shared/logger/logger");

const { processAnalytics } = require("../services/analyticsService");

let consumer;

async function startAnalyticsConsumer() {
  consumer = kafka.consumer({
    groupId: process.env.GROUP_ID,
  });

  await consumer.connect();

  logger.info("Analytics Consumer Connected");

  await consumer.subscribe({
    topic: TOPICS.INVENTORY_UPDATED,
    fromBeginning: false,
  });

  logger.info("Subscribed to inventory-updated");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        logger.info(`Received Event :: ${event.eventType} :: ${event.eventId}`);

        // Pass complete event
        await processAnalytics(event);
      } catch (error) {
        logger.error("Analytics Consumer Error", error);
      }
    },
  });

  logger.info("Analytics Consumer Started");
}

module.exports = {
  startAnalyticsConsumer,
};
