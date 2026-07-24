const { sendSuccess } = require("../../../shared/utils/response");
const ROLES = require("../../../shared/constants/roles");
const authService = require("../services/authService");

async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    return sendSuccess(res, {
      message: "Logged in successfully",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const { user } = await authService.register(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: "Account created successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function registerAdmin(req, res, next) {
  try {
    const { user } = await authService.register(
      {
        ...req.body,
        role: ROLES.ADMIN,
      },
      req.user,
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: "Admin account created successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return sendSuccess(res, {
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await authService.listUsers(req.query);
    return sendSuccess(res, {
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const user = await authService.updateUserRole(
      {
        userId: req.params.id,
        role: req.body.role,
      },
      req.user,
    );
    return sendSuccess(res, {
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const result = await authService.requestPasswordReset(req.body);
    return sendSuccess(res, {
      message: "If the account exists, a reset token was generated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, {
      message: "Password reset successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register,
  registerAdmin,
  me,
  listUsers,
  updateUserRole,
  requestPasswordReset,
  resetPassword,
};
