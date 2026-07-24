const kafka = require("./kafkaClient");
const logger = require("../logger/logger");

function createConsumer(groupId) {
  return kafka.consumer({
    groupId,
  });
}

async function connectConsumer(consumer, groupId) {
  await consumer.connect();
  logger.info(`Kafka Consumer Connected :: ${groupId}`);
}

async function disconnectConsumer(consumer, groupId) {
  if (consumer) {
    await consumer.disconnect();
    logger.info(`Kafka Consumer Disconnected :: ${groupId}`);
  }
}

async function subscribeTopic(consumer, topic, groupId) {
  await consumer.subscribe({
    topic,
    fromBeginning: false,
  });
  logger.info(`Subscribed :: ${groupId} -> ${topic}`);
}

module.exports = {
  createConsumer,
  connectConsumer,
  disconnectConsumer,
  subscribeTopic,
};
