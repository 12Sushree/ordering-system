const express = require("express");
const cors = require("cors");

const analyticsRoutes = require("./routes/analyticsRoute");
const healthRoutes = require("./routes/healthRoute");
const errorHandler = require("../../shared/middleware/errorMid");
const {
  authenticate,
  authorizeRoles,
} = require("../../shared/middleware/authMid");
const ROLES = require("../../shared/constants/roles");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/analytics", authenticate, authorizeRoles(ROLES.ADMIN), analyticsRoutes);
app.use("/health", healthRoutes);

app.use(errorHandler);

module.exports = app;
