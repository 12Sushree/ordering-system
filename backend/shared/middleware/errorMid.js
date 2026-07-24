const logger = require("../logger/logger");
const { sendError } = require("../utils/response");

function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode >= 500
      ? "Internal Server Error"
      : err.message || "Something went wrong";

  return sendError(res, {
    statusCode,
    message,
  });
}

module.exports = errorHandler;
