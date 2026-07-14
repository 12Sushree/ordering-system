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

  logger.info("Analytics consumer connected");

  await consumer.subscribe({
    topic: TOPICS.INVENTORY_UPDATED,
    fromBeginning: false,
  });

  logger.info("Analytics consumer subscribed to inventory.updated");

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      logger.info(`Received Event :: ${event.eventType} :: ${event.eventId}`);

      await processAnalytics(event);

      await consumer.commitOffsets([
        {
          topic,
          partition,
          offset: String(Number(message.offset) + 1),
        },
      ]);
    },
  });

  logger.info("Analytics consumer started");
}

module.exports = {
  startAnalyticsConsumer,
};
