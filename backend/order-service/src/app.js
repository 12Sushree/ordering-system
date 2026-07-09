const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoute");
const notFound = require("../../shared/middleware/notFoundMid");
const errorHandler = require("../../shared/middleware/errorMid");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
