const crypto = require("crypto");
const User = require("../models/userModel");
const PasswordResetToken = require("../models/passwordResetTokenModel");
const { verifyPassword } = require("../utils/password");
const { signToken } = require("../../../shared/utils/token");
const ROLES = require("../../../shared/constants/roles");

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

function buildToken(user) {
  return signToken(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isSuperAdmin: Boolean(user.isSuperAdmin),
    },
    process.env.JWT_SECRET,
    TOKEN_TTL_SECONDS,
  );
}

async function login({ email, password }) {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user || !user.verifyPassword(password || "")) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    user,
    token: buildToken(user),
  };
}

function normalizeRole(role) {
  const nextRole = String(role || ROLES.USER).toUpperCase();
  return Object.values(ROLES).includes(nextRole) ? nextRole : ROLES.USER;
}

async function register(
  { name, email, password, confirmPassword, role },
  actor = null,
) {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  const requestedRole = normalizeRole(role);

  if (!normalizedName) {
    const error = new Error("Name is required");
    error.statusCode = 400;
    throw error;
  }
  if (!normalizedEmail) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  if (!password || password.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }
  if (password !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  if (requestedRole === ROLES.ADMIN && !actor?.isSuperAdmin) {
    const error = new Error("Only the Super Admin can create admin accounts");
    error.statusCode = 403;
    throw error;
  }

  const user = new User({
    name: normalizedName,
    email: normalizedEmail,
    role: requestedRole,
    isSuperAdmin: false,
  });

  user.setPassword(password);
  await user.save();

  return {
    user,
  };
}

async function getCurrentUser(userId) {
  return User.findById(userId);
}

async function ensureDefaultUsers() {
  const existingAdmin = await User.findOne({
    email: "admin@gmail.com",
  });

  if (existingAdmin) {
    return;
  }

  const admin = new User({
    name: "Super Admin",
    email: "admin@gmail.com",
    role: ROLES.ADMIN,
    isSuperAdmin: true,
  });

  admin.setPassword("Admin@123");
  await admin.save();
}

function buildUserQuery({ search = "", role = "" } = {}) {
  const query = {};
  if (role) {
    query.role = role;
  }

  const normalizedSearch = String(search).trim();
  if (normalizedSearch) {
    query.$or = [
      {
        name: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
      {
        email: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
    ];
  }
  return query;
}

async function listUsers({
  page = 1,
  limit = 10,
  search = "",
  role = "",
} = {}) {
  const nextPage = Math.max(Number(page) || 1, 1);
  const nextLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const query = buildUserQuery({
    search,
    role,
  });

  const [items, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((nextPage - 1) * nextLimit)
      .limit(nextLimit),
    User.countDocuments(query),
  ]);

  return {
    items,
    page: nextPage,
    limit: nextLimit,
    total,
    totalPages: Math.max(Math.ceil(total / nextLimit), 1),
  };
}

async function updateUserRole({ userId, role }, actor = null) {
  if (!actor?.isSuperAdmin) {
    const error = new Error("Only the Super Admin can manage admin accounts");
    error.statusCode = 403;
    throw error;
  }

  const normalizedRole = normalizeRole(role);

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  if (targetUser.isSuperAdmin) {
    const error = new Error("Super Admin role cannot be changed");
    error.statusCode = 400;
    throw error;
  }

  if (![ROLES.USER, ROLES.ADMIN].includes(normalizedRole)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  targetUser.role = normalizedRole;
  await targetUser.save();
  return targetUser;
}

async function requestPasswordReset({ email }) {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });
  if (!user) {
    return {
      requested: true,
      resetToken: null,
    };
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await PasswordResetToken.deleteMany({
    userId: user._id,
    usedAt: null,
  });

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  return {
    requested: true,
    resetToken,
  };
}

async function resetPassword({ token, password, confirmPassword }) {
  if (!token) {
    const error = new Error("Reset token is required");
    error.statusCode = 400;
    throw error;
  }

  if (!password || password.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }
  if (password !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetRecord = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: {
      $gt: new Date(),
    },
  }).populate("userId");
  if (!resetRecord) {
    const error = new Error("Reset token is invalid or expired");
    error.statusCode = 400;
    throw error;
  }

  const user = resetRecord.userId;
  user.setPassword(password);
  await user.save();

  resetRecord.usedAt = new Date();
  await resetRecord.save();

  return {
    user,
  };
}

module.exports = {
  login,
  register,
  getCurrentUser,
  ensureDefaultUsers,
  listUsers,
  updateUserRole,
  requestPasswordReset,
  resetPassword,
};
