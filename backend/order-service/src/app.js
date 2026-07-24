const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoute");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("../../inventory-service/src/routes/productRoutes");
const notFound = require("../../shared/middleware/notFoundMid");
const errorHandler = require("../../shared/middleware/errorMid");

const app = express();

// Health endpoint should be publicly accessible
app.use("/health", cors());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "1mb",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use("/health", healthRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
