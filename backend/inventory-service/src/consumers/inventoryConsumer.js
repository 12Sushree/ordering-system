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

  logger.info("Inventory consumer connected");

  await consumer.subscribe({
    topic: TOPICS.ORDER_CREATED,
    fromBeginning: false,
  });

  logger.info("Inventory consumer subscribed to order.created");

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      logger.info(`Received Event :: ${event.eventType} :: ${event.eventId}`);

      await processInventory(event);

      await consumer.commitOffsets([
        {
          topic,
          partition,
          offset: String(Number(message.offset) + 1),
        },
      ]);
    },
  });

  logger.info("Inventory consumer started");
}

module.exports = {
  startInventoryConsumer,
};
