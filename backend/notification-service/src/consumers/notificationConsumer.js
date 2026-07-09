const kafka = require("../../../shared/kafka/kafkaClient");
const TOPICS = require("../../../shared/constants/topics");
const logger = require("../../../shared/logger/logger");

const { processNotification } = require("../services/notificationService");

let consumer;

async function startNotificationConsumer() {
  consumer = kafka.consumer({
    groupId: process.env.GROUP_ID,
  });

  await consumer.connect();

  logger.info("Notification Consumer Connected");

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

        // Pass complete event to processor
        await processNotification(event);
      } catch (error) {
        logger.error("Notification Consumer Error", error);
      }
    },
  });

  logger.info("Notification Consumer Started");
}

module.exports = {
  startNotificationConsumer,
};
