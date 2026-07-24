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

function ensureAuthenticated(req, res) {
  if (!req.user) {
    sendError(res, {
      statusCode: 401,
      message: "Please sign in to continue",
    });
    return false;
  }
  return true;
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
  } catch {
    return sendError(res, {
      statusCode: 401,
      message: "Invalid or expired authentication token.",
    });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!ensureAuthenticated(req, res)) {
      return;
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}

function authorizeSuperAdmin(req, res, next) {
  if (!ensureAuthenticated(req, res)) {
    return;
  }

  if (!req.user.isSuperAdmin) {
    return sendError(res, {
      statusCode: 403,
      message: "Super Admin access required.",
    });
  }

  return next();
}

module.exports = {
  authenticate,
  authorizeRoles,
  authorizeSuperAdmin,
};
