const sendSuccess = (
  res,
  { statusCode = 200, message = "Success", data } = {},
) => {
  const response = { success: true, message };
  if (data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

const sendError = (
  res,
  { statusCode = 500, message = "Something went wrong", errors } = {},
) => {
  const response = { success: false, message };
  if (errors !== undefined) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
