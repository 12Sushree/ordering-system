const { sendError } = require("../utils/response");

function errorHandler(err, req, res, next) {
  console.error(err);
  sendError(res, {
    statusCode: err.statusCode || err.status || 500,
    message: err.message,
  });
}

module.exports = errorHandler;
