const express = require("express");
const cors = require("cors");
const analyticsRoutes = require("./routes/analyticsRoute");
const healthRoutes = require("./routes/healthRoute");
const errorHandler = require("../../shared/middleware/errorMid");
const notFound = require("../../shared/middleware/notFoundMid");
const {
  authenticate,
  authorizeRoles,
} = require("../../shared/middleware/authMid");
const ROLES = require("../../shared/constants/roles");

const app = express();

// Health endpoint should be publicly accessible
app.use("/health", cors());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use("/health", healthRoutes);
app.use(
  "/api/analytics",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  analyticsRoutes,
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
