const path = require("path");
const dotenv = require("dotenv");
const http = require("http");
const mongoose = require("mongoose");

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const SERVICES = require("../../shared/constants/services");
global.SERVICE_NAME = SERVICES.AUTH_SERVICE;

const logger = require("../../shared/logger/logger");
const app = require("./app");
const connectDB = require("../../shared/config/db");
const { ensureDefaultUsers } = require("./services/authService");

async function startServer() {
  try {
    await connectDB();
    await ensureDefaultUsers();

    const server = http.createServer(app);
    server.listen(process.env.AUTH_SERVICE_PORT, () => {
      logger.info(
        `Authentication Service running on port ${process.env.AUTH_SERVICE_PORT}`,
      );
    });
  } catch (error) {
    logger.error(`Authentication Service failed to start :: ${error.message}`);
    process.exit(1);
  }
}

startServer();
