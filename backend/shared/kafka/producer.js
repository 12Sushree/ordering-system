const kafka = require("./kafkaClient");
const logger = require("../logger/logger");
const generateEventId = require("../utils/generateEventId");

let producer;

/**
 * Connect Kafka Producer
 * Idempotent Producer Enabled
 */
async function connectProducer() {
  if (!producer) {
    producer = kafka.producer({
      idempotent: true,
      maxInFlightRequests: 5,
      retry: {
        retries: Number.MAX_SAFE_INTEGER,
      },
    });

    await producer.connect();

    logger.info("✅ Kafka Producer Connected (Idempotent Enabled)");
  }

  return producer;
}

/**
 * Publish Event
 */
async function publishEvent(topic, eventType, payload) {
  if (!producer) {
    throw new Error("Producer is not connected.");
  }

  const event = {
    eventId: generateEventId(),
    eventType,
    payload,
    createdAt: new Date().toISOString(),
  };

  logger.info(
    `Publishing Event :: ${event.eventType} :: EventId=${event.eventId}`,
  );

  await producer.send({
    topic,
    messages: [
      {
        key: String(payload.orderId),
        value: JSON.stringify(event),
      },
    ],
  });

  logger.info(`Event Published Successfully :: ${event.eventId}`);
}

module.exports = {
  connectProducer,
  publishEvent,
};
