const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    actorName: {
      type: String,
      trim: true,
    },

    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    actorRole: {
      type: String,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entityType: {
      type: String,
      trim: true,
      index: true,
    },

    entityId: {
      type: String,
      trim: true,
      index: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
