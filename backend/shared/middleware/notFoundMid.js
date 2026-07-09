const { sendError } = require("../utils/response");

function notFound(req, res) {
  sendError(res, { statusCode: 404, message: "Route not found" });
}

module.exports = notFound;
