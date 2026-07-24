const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const SERVICES = require("../../shared/constants/services");
global.SERVICE_NAME = SERVICES.ANALYTICS_SERVICE;

const app = require("./app");
const connectDB = require("../../shared/config/db");
const { startAnalyticsConsumer } = require("./consumers/analyticsConsumer");
const logger = require("../../shared/logger/logger");
const PORT = process.env.ANALYTICS_SERVICE_PORT || 5003;

async function startServer() {
  try {
    await connectDB();
    await startAnalyticsConsumer();
    app.listen(PORT, () => {
      logger.info(`Analytics Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start Analytics Service :: ${error.message}`);
    process.exit(1);
  }
}

startServer();
