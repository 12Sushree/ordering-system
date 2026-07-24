const mongoose = require("mongoose");

const outboxEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
    },

    service: {
      type: String,
      required: true,
    },

    topic: {
      type: String,
      required: true,
    },

    eventType: {
      type: String,
      required: true,
    },

    payload: {
      type: Object,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "DISPATCHING", "DISPATCHED", "FAILED"],
      default: "PENDING",
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lockedAt: Date,

    nextAttemptAt: {
      type: Date,
      default: Date.now,
    },

    lastError: String,

    dispatchedAt: Date,
  },
  {
    timestamps: true,
  },
);

outboxEventSchema.index(
  {
    eventId: 1,
    service: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("OutboxEvent", outboxEventSchema);
