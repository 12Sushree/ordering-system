const {
  createConsumer,
  connectConsumer,
  subscribeTopic,
} = require("../../../shared/kafka/consumer");
const logger = require("../../../shared/logger/logger");
const TOPICS = require("../../../shared/constants/topics");
const { processInventory } = require("../services/inventoryService");

let consumer;

async function startInventoryConsumer() {
  consumer = createConsumer(process.env.GROUP_ID);
  await connectConsumer(consumer);
  logger.info("Inventory consumer connected");

  await subscribeTopic(consumer, TOPICS.ORDER_CREATED, process.env.GROUP_ID);

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const offset = message.offset;
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (error) {
        logger.error(
          `Invalid Kafka message :: partition=${partition} offset=${offset}`,
        );
        await commitOffset(topic, partition, offset);
        return;
      }

      try {
        logger.info(
          `Inventory Event Received :: type=${event.eventType} eventId=${event.eventId} partition=${partition} offset=${offset}`,
        );

        await processInventory(event);

        await commitOffset(topic, partition, offset);
        logger.info(`Inventory Offset Committed :: ${event.eventId}`);
      } catch (error) {
        logger.error(
          `Inventory Processing Failed :: event=${event.eventId} error=${error.message}`,
        );
      }
    },
  });
  logger.info("Inventory consumer started");
}

async function commitOffset(topic, partition, offset) {
  await consumer.commitOffsets([
    {
      topic,
      partition,
      offset: String(Number(offset) + 1),
    },
  ]);
}

async function stopInventoryConsumer() {
  if (!consumer) {
    return;
  }
  await consumer.disconnect();
  logger.info("Inventory consumer stopped");
}

module.exports = {
  startInventoryConsumer,
  stopInventoryConsumer,
};
