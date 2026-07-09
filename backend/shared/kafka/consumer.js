const kafka = require("./kafkaClient");
const logger = require("../logger/logger");

function createConsumer(groupId) {
  return kafka.consumer({
    groupId,
  });
}

async function connectConsumer(consumer) {
  await consumer.connect();
  logger.info("Kafka Consumer Connected");
}

async function subscribeTopic(consumer, topic) {
  await consumer.subscribe({
    topic,
    fromBeginning: false,
  });

  logger.info(`Subscribed to topic: ${topic}`);
}

module.exports = {
  createConsumer,
  connectConsumer,
  subscribeTopic,
};
