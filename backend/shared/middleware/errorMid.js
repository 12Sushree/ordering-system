const { sendError } = require("../utils/response");

function errorHandler(err, req, res, next) {
  console.error(err);
  sendError(res, { statusCode: err.status, message: err.message });
}

module.exports = errorHandler;
