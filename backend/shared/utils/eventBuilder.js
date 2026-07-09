const { v4: uuidv4 } = require("uuid");

function buildEvent(eventType, service, payload) {
  return {
    eventId: uuidv4(),
    eventType,
    service,
    timestamp: new Date().toISOString(),
    payload,
  };
}

module.exports = buildEvent;
