const AuditLog = require("../models/auditLogModel");
const Notification = require("../models/notificationModel");

async function recordAuditLog({
  actor = null,
  action,
  entityType = null,
  entityId = null,
  summary,
  metadata = {},
}) {
  return AuditLog.create({
    actorId: actor?.id || actor?._id || null,
    actorName: actor?.name || null,
    actorEmail: actor?.email || null,
    actorRole: actor?.role || null,
    action,
    entityType,
    entityId,
    summary,
    metadata,
  });
}

async function createNotification({
  userId = null,
  audience = "USER",
  type,
  title,
  message,
  metadata = {},
}) {
  return Notification.create({
    userId,
    audience,
    type,
    title,
    message,
    metadata,
  });
}

module.exports = {
  recordAuditLog,
  createNotification,
};
