const express = require("express");
const cors = require("cors");

const analyticsRoutes = require("./routes/analyticsRoute");
const healthRoutes = require("./routes/healthRoute");
const errorHandler = require("../../shared/middleware/errorMid");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/analytics", analyticsRoutes);
app.use("/health", healthRoutes);

app.use(errorHandler);

module.exports = app;
