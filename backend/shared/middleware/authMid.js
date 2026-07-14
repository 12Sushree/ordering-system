const { sendError } = require("../utils/response");
const { verifyToken } = require("../utils/token");

function getTokenFromHeader(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function authenticate(req, res, next) {
  const token = getTokenFromHeader(req);

  if (!token) {
    return sendError(res, {
      statusCode: 401,
      message: "Please sign in to continue",
    });
  }

  try {
    const payload = verifyToken(token, process.env.JWT_SECRET || "dev-secret");

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      isSuperAdmin: Boolean(payload.isSuperAdmin),
    };

    return next();
  } catch (error) {
    return sendError(res, {
      statusCode: 401,
      message: "Your session expired. Please sign in again.",
    });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: "Please sign in to continue",
      });
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: "Admin access required",
      });
    }

    return next();
  };
}

function authorizeSuperAdmin(req, res, next) {
  if (!req.user) {
    return sendError(res, {
      statusCode: 401,
      message: "Please sign in to continue",
    });
  }

  if (!req.user.isSuperAdmin) {
    return sendError(res, {
      statusCode: 403,
      message: "Super admin access required",
    });
  }

  return next();
}

module.exports = {
  authenticate,
  authorizeRoles,
  authorizeSuperAdmin,
};
