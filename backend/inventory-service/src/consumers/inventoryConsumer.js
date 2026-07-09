const kafka = require("../../../shared/kafka/kafkaClient");
const logger = require("../../../shared/logger/logger");
const TOPICS = require("../../../shared/constants/topics");

const { processInventory } = require("../services/inventoryService");

let consumer;

async function startInventoryConsumer() {
  consumer = kafka.consumer({
    groupId: process.env.GROUP_ID,
  });

  await consumer.connect();

  logger.info("Inventory Consumer Connected");

  await consumer.subscribe({
    topic: TOPICS.ORDER_CREATED,
    fromBeginning: false,
  });

  logger.info("Subscribed to orders");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        logger.info(`Received Event :: ${event.eventType} :: ${event.eventId}`);

        // Pass complete event (contains eventId + payload)
        await processInventory(event);
      } catch (error) {
        logger.error("Inventory Consumer Error", error);
      }
    },
  });

  logger.info("Inventory Consumer Started");
}

module.exports = {
  startInventoryConsumer,
};
