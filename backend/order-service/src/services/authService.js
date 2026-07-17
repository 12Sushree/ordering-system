const User = require("../../../shared/models/userModel");
const PasswordResetToken = require("../../../shared/models/passwordResetTokenModel");
const AuditLog = require("../../../shared/models/auditLogModel");
const Notification = require("../../../shared/models/notificationModel");
const {
  hashPassword,
  verifyPassword,
} = require("../../../shared/utils/password");
const { signToken } = require("../../../shared/utils/token");
const ROLES = require("../../../shared/constants/roles");
const {
  recordAuditLog,
  createNotification,
} = require("../../../shared/utils/activity");
const crypto = require("crypto");

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
    process.env.JWT_SECRET || "dev-secret",
    TOKEN_TTL_SECONDS,
  );
}

async function login({ email, password }) {
  const user = await User.findOne({
    email: String(email || "")
      .toLowerCase()
      .trim(),
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
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const normalizedName = String(name || "").trim();
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

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

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

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    role: requestedRole,
    isSuperAdmin: false,
    passwordHash: hashPassword(password),
  });

  await recordAuditLog({
    actor,
    action: requestedRole === ROLES.ADMIN ? "ADMIN_CREATED" : "USER_REGISTERED",
    entityType: "User",
    entityId: user._id.toString(),
    summary:
      requestedRole === ROLES.ADMIN
        ? `Created admin account for ${user.email}`
        : `Created user account for ${user.email}`,
    metadata: {
      role: user.role,
    },
  });

  await createNotification({
    userId: user._id,
    audience: user.role === ROLES.ADMIN ? "ADMIN" : "USER",
    type: "ACCOUNT_CREATED",
    title: "Account created",
    message:
      user.role === ROLES.ADMIN
        ? "Your admin account is ready."
        : "Your user account is ready.",
    metadata: {
      email: user.email,
    },
  });

  return {
    user,
  };
}

async function getCurrentUser(userId) {
  return await User.findById(userId);
}

async function ensureDefaultUsers() {
  const seedAdmin = {
    name: "Super Admin",
    email: "admin@gmail.com",
    password: "Admin@123",
    role: ROLES.ADMIN,
    isSuperAdmin: true,
  };

  await User.findOneAndUpdate(
    { email: seedAdmin.email },
    {
      $set: {
        name: seedAdmin.name,
        role: seedAdmin.role,
        isSuperAdmin: seedAdmin.isSuperAdmin,
        passwordHash: hashPassword(seedAdmin.password),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );
}

function buildUserQuery({ search = "", role = "" } = {}) {
  const query = {};

  if (role) {
    query.role = role;
  }

  const normalizedSearch = String(search || "").trim();

  if (normalizedSearch) {
    query.$or = [
      { name: { $regex: normalizedSearch, $options: "i" } },
      { email: { $regex: normalizedSearch, $options: "i" } },
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
  const query = buildUserQuery({ search, role });

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

  if (![ROLES.USER, ROLES.ADMIN].includes(role)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  targetUser.role = role;
  await targetUser.save();

  await recordAuditLog({
    actor,
    action: role === ROLES.ADMIN ? "USER_PROMOTED_TO_ADMIN" : "ADMIN_REVOKED",
    entityType: "User",
    entityId: targetUser._id.toString(),
    summary:
      role === ROLES.ADMIN
        ? `Promoted ${targetUser.email} to admin`
        : `Revoked admin access for ${targetUser.email}`,
    metadata: {
      role,
    },
  });

  await createNotification({
    userId: targetUser._id,
    audience: role === ROLES.ADMIN ? "ADMIN" : "USER",
    type: "ROLE_CHANGED",
    title: "Role updated",
    message:
      role === ROLES.ADMIN
        ? "You now have admin access."
        : "Your admin access was removed.",
    metadata: {
      role,
    },
  });

  return targetUser;
}

async function requestPasswordReset({ email }) {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      requested: true,
      resetToken: null,
    };
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashPassword(resetToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

  await PasswordResetToken.deleteMany({
    userId: user._id,
    usedAt: null,
  });

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  await recordAuditLog({
    actor: user,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "User",
    entityId: user._id.toString(),
    summary: `Password reset requested for ${user.email}`,
  });

  await createNotification({
    userId: user._id,
    audience: user.role === ROLES.ADMIN ? "ADMIN" : "USER",
    type: "PASSWORD_RESET_REQUESTED",
    title: "Password reset requested",
    message: "A password reset was requested for your account.",
    metadata: {
      expiresAt,
    },
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

  const tokens = await PasswordResetToken.find({
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate("userId");

  const matchedToken = tokens.find((entry) =>
    verifyPasswordCandidate(token, entry.tokenHash),
  );

  if (!matchedToken) {
    const error = new Error("Reset token is invalid or expired");
    error.statusCode = 400;
    throw error;
  }

  const user = matchedToken.userId;

  user.passwordHash = hashPassword(password);
  await user.save();

  matchedToken.usedAt = new Date();
  await matchedToken.save();

  await recordAuditLog({
    actor: user,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId: user._id.toString(),
    summary: `Password reset completed for ${user.email}`,
  });

  await createNotification({
    userId: user._id,
    audience: user.role === ROLES.ADMIN ? "ADMIN" : "USER",
    type: "PASSWORD_RESET_COMPLETED",
    title: "Password updated",
    message: "Your password has been changed successfully.",
  });

  return {
    user,
  };
}

function verifyPasswordCandidate(candidate, storedHash) {
  return verifyPassword(candidate, storedHash);
}

async function getAuditLogs({ page = 1, limit = 10 } = {}) {
  const nextPage = Math.max(Number(page) || 1, 1);
  const nextLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const [items, total] = await Promise.all([
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .skip((nextPage - 1) * nextLimit)
      .limit(nextLimit),
    AuditLog.countDocuments({}),
  ]);

  return {
    items,
    page: nextPage,
    limit: nextLimit,
    total,
    totalPages: Math.max(Math.ceil(total / nextLimit), 1),
  };
}

async function getNotifications(user, { page = 1, limit = 10 } = {}) {
  const nextPage = Math.max(Number(page) || 1, 1);
  const nextLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const audience = user?.isSuperAdmin
    ? ["SUPER_ADMIN", "ADMIN", "ALL"]
    : user?.role === ROLES.ADMIN
      ? ["ADMIN", "ALL"]
      : ["USER", "ALL"];

  const query = {
    $or: [
      { userId: user?.id || null },
      {
        audience: {
          $in: audience,
        },
      },
    ],
  };

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((nextPage - 1) * nextLimit)
      .limit(nextLimit),
    Notification.countDocuments(query),
    Notification.countDocuments({
      ...query,
      readAt: null,
    }),
  ]);

  return {
    items,
    page: nextPage,
    limit: nextLimit,
    total,
    unreadCount,
    totalPages: Math.max(Math.ceil(total / nextLimit), 1),
  };
}

async function markNotificationRead(notificationId, user) {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId && notification.userId.toString() !== user.id) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  notification.readAt = new Date();
  await notification.save();

  return notification;
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
  getAuditLogs,
  getNotifications,
  markNotificationRead,
};
