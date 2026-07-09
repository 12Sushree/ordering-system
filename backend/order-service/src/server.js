const path = require("path");
const dotenv = require("dotenv");
const http = require("http");

// Load shared environment variables
dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

// Load service-specific environment variables
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const app = require("./app");
const connectDB = require("../../shared/config/db");
const { connectProducer } = require("../../shared/kafka/producer");

async function startServer() {
  try {
    await connectDB();
    await connectProducer();

    const server = http.createServer(app);

    server.listen(process.env.ORDER_SERVICE_PORT, () => {
      console.log(
        `🚀 Order Service running on port ${process.env.ORDER_SERVICE_PORT}`,
      );
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startServer();
