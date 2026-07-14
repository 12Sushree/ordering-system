const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const app = require("./app");
const connectDB = require("../../shared/config/db");
const { connectProducer } = require("../../shared/kafka/producer");
const { startInventoryConsumer } = require("./consumers/inventoryConsumer");
const { flushInventoryOutbox } = require("./services/inventoryService");
const logger = require("../../shared/logger/logger");

const PORT = process.env.INVENTORY_SERVICE_PORT || 5001;
const OUTBOX_FLUSH_INTERVAL_MS = 5000;

async function startServer() {
  try {
    // Connect Database
    await connectDB();

    // Connect Kafka Producer
    await connectProducer();

    // Start Kafka Consumer
    await startInventoryConsumer();

    await flushInventoryOutbox();

    setInterval(() => {
      flushInventoryOutbox().catch((error) => {
        logger.error(`Inventory outbox flush failed :: ${error.message}`);
      });
    }, OUTBOX_FLUSH_INTERVAL_MS);

    app.listen(PORT, () => {
      logger.info(`Inventory Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start Inventory Service", error);
    process.exit(1);
  }
}

startServer();
