const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const SERVICES = require("../../shared/constants/services");
global.SERVICE_NAME = SERVICES.NOTIFICATION_SERVICE;

const app = require("./app");
const connectDB = require("../../shared/config/db");
const { connectProducer } = require("../../shared/kafka/producer");
const {
  startNotificationConsumer,
} = require("./consumers/notificationConsumer");
const { verifyEmailConnection } = require("./services/emailService");
const { flushNotificationOutbox } = require("./services/notificationService");
const logger = require("../../shared/logger/logger");

const PORT = process.env.NOTIFICATION_PORT || 5002;
const OUTBOX_FLUSH_INTERVAL_MS = 5000;

async function startServer() {
  try {
    await connectDB();
    await connectProducer();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await verifyEmailConnection();
    } else {
      logger.info("Email credentials not set; skipping email verification");
    }

    await startNotificationConsumer();
    await flushNotificationOutbox();

    setInterval(() => {
      flushNotificationOutbox().catch((error) => {
        logger.error(`Notification outbox flush failed :: ${error.message}`);
      });
    }, OUTBOX_FLUSH_INTERVAL_MS);

    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start Notification Service", error);
    process.exit(1);
  }
}

startServer();
