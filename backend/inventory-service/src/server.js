const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});
dotenv.config({
  path: path.join(__dirname, "../.env"),
  override: true,
});

const SERVICES = require("../../shared/constants/services");
global.SERVICE_NAME = SERVICES.INVENTORY_SERVICE;

const app = require("./app");
const connectDB = require("../../shared/config/db");
const {
  connectProducer,
  disconnectProducer,
} = require("../../shared/kafka/producer");
const {
  startInventoryConsumer,
  stopInventoryConsumer,
} = require("./consumers/inventoryConsumer");
const { flushInventoryOutbox } = require("./services/inventoryService");
const logger = require("../../shared/logger/logger");

const PORT = Number(process.env.INVENTORY_SERVICE_PORT) || 5001;
const OUTBOX_FLUSH_INTERVAL_MS = 5000;

let outboxTimer;
let server;
let flushing = false;

async function safeFlushOutbox() {
  if (flushing) {
    return;
  }
  flushing = true;
  try {
    await flushInventoryOutbox();
  } catch (error) {
    logger.error(`Inventory outbox flush failed :: ${error.message}`);
  } finally {
    flushing = false;
  }
}

async function startServer() {
  try {
    await connectDB();
    await connectProducer();
    await startInventoryConsumer();
    await safeFlushOutbox();

    outboxTimer = setInterval(safeFlushOutbox, OUTBOX_FLUSH_INTERVAL_MS);

    server = app.listen(PORT, () => {
      logger.info(`Inventory Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start Inventory Service :: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down Inventory Service`);

  if (outboxTimer) {
    clearInterval(outboxTimer);
  }

  try {
    if (server) {
      server.close();
    }
    await stopInventoryConsumer();
    await disconnectProducer();
    process.exit(0);
  } catch (error) {
    logger.error(`Shutdown failed :: ${error.message}`);
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
