const {
  createConsumer,
  connectConsumer,
  subscribeTopic,
} = require("../../../shared/kafka/consumer");
const logger = require("../../../shared/logger/logger");
const TOPICS = require("../../../shared/constants/topics");
const { processInventoryUpdate } = require("../services/orderService");

let consumer;

async function startInventoryUpdatedConsumer() {
  consumer = createConsumer(process.env.GROUP_ID);
  await connectConsumer(consumer);
  logger.info("Order consumer connected");

  await subscribeTopic(
    consumer,
    TOPICS.INVENTORY_UPDATED,
    process.env.GROUP_ID,
  );
  logger.info(`Order consumer subscribed to ${TOPICS.INVENTORY_UPDATED}`);

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        logger.info(`Received Event :: ${event.eventType} :: ${event.eventId}`);

        await processInventoryUpdate(event);

        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: String(Number(message.offset) + 1),
          },
        ]);
        logger.info(`Offset committed :: ${event.eventId}`);
      } catch (error) {
        logger.error(`Inventory Updated Consumer Error :: ${error.message}`);
      }
    },
  });
  logger.info("Inventory Updated consumer started");
}

module.exports = {
  startInventoryUpdatedConsumer,
};
