const path = require("path");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const SERVICES = require("../../shared/constants/services");
global.SERVICE_NAME = SERVICES.ORDER_SERVICE;

const logger = require("../../shared/logger/logger");
const app = require("./app");
const connectDB = require("../../shared/config/db");
const { connectProducer } = require("../../shared/kafka/producer");
const { flushOrderOutbox } = require("./services/orderService");
const {
  startInventoryUpdatedConsumer,
} = require("./consumers/inventoryUpdatedConsumer");

async function startServer() {
  try {
    if (!process.env.ORDER_SERVICE_PORT) {
      throw new Error("ORDER_SERVICE_PORT is not configured.");
    }
    if (!global.SERVICE_NAME) {
      throw new Error("SERVICE_NAME is not configured.");
    }

    await connectDB();
    await connectProducer();
    await startInventoryUpdatedConsumer();
    await flushOrderOutbox();

    const server = http.createServer(app);

    setInterval(() => {
      flushOrderOutbox().catch((error) => {
        logger.error(`Order outbox flush failed :: ${error.message}`);
      });
    }, 5000);

    server.listen(process.env.ORDER_SERVICE_PORT, () => {
      logger.info(
        `Order Service started on port ${process.env.ORDER_SERVICE_PORT}`,
      );
    });
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
}

startServer();
