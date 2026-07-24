const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoute");
const errorHandler = require("../../shared/middleware/errorMid");
const app = express();

// Health endpoint should be publicly accessible
app.use("/health", cors());

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);

app.use(errorHandler);

module.exports = app;
