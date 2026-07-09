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
const {
  startNotificationConsumer,
} = require("./consumers/notificationConsumer");
const { verifyEmailConnection } = require("./services/emailService");
const logger = require("../../shared/logger/logger");

const PORT = process.env.NOTIFICATION_PORT || 5002;

async function startServer() {
  try {
    // Connect MongoDB
    await connectDB();

    // Connect Kafka Producer
    await connectProducer();

    // Verify Email Service only if credentials provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await verifyEmailConnection();
    } else {
      logger.info("Email credentials not set; skipping email verification");
    }

    // Start Kafka Consumer
    await startNotificationConsumer();

    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start Notification Service", error);

    process.exit(1);
  }
}

startServer();
