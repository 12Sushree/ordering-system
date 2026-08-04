const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoute");
const errorHandler = require("../../shared/middleware/errorMid");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);

app.use(errorHandler);

module.exports = app;
