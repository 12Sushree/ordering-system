const kafka = require("./kafkaClient");
const logger = require("../logger/logger");
const { generateEventId } = require("../utils/generateEventId");

let producer;

async function connectProducer() {
  if (!producer) {
    producer = kafka.producer({
      idempotent: true,
      maxInFlightRequests: 1,
      retry: {
        retries: 10,
      },
    });

    await producer.connect();
    logger.info("Kafka producer connected.");
  }
  return producer;
}

async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info("Kafka producer disconnected.");
  }
}

async function publishEvent(topic, eventType, payload, options = {}) {
  if (!producer) {
    throw new Error("Kafka producer is not connected.");
  }

  const event = {
    eventId: options.eventId || generateEventId(),
    eventType,
    source: options.source || "UNKNOWN_SERVICE",
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

  return event;
}

module.exports = {
  connectProducer,
  disconnectProducer,
  publishEvent,
};
