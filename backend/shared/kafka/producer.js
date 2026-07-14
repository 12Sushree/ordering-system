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
      maxInFlightRequests: 1,
      retry: {
        retries: Number.MAX_SAFE_INTEGER,
      },
    });

    await producer.connect();

    logger.info("Kafka producer connected with idempotent mode enabled");
  }

  return producer;
}

/**
 * Publish Event
 */
async function publishEvent(topic, eventType, payload, options = {}) {
  if (!producer) {
    throw new Error("Producer is not connected.");
  }

  const event = {
    eventId: options.eventId || generateEventId(),
    eventType,
    payload,
    createdAt: new Date().toISOString(),
  };

  logger.info(
    `Publishing Event :: ${event.eventType} :: EventId=${event.eventId}`,
  );

  await producer.send({
    topic,
    acks: -1,
    messages: [
      {
        key: String(
          options.key || payload.orderId || payload.eventId || event.eventId,
        ),
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
