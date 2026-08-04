const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const healthRoutes = require("./routes/healthRoute");
const productRoutes = require("./routes/productRoutes");
const notFound = require("../../shared/middleware/notFoundMid");
const errorHandler = require("../../shared/middleware/errorMid");

const app = express();

app.use(helmet());

app.use("/health", cors());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "10kb",
  }),
);

app.use("/health", healthRoutes);
app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
