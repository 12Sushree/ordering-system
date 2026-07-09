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
const { startAnalyticsConsumer } = require("./consumers/analyticsConsumer");
const logger = require("../../shared/logger/logger");

const PORT = process.env.ANALYTICS_PORT || 5003;

async function startServer() {
  try {
    await connectDB();

    // Required because this service shares the common Kafka module.
    // It can also publish future events if needed.
    await connectProducer();

    await startAnalyticsConsumer();

    app.listen(PORT, () => {
      logger.info(`Analytics Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start Analytics Service", error);

    process.exit(1);
  }
}

startServer();
