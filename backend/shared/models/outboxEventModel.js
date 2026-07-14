const mongoose = require("mongoose");

const outboxEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
    },

    service: {
      type: String,
      required: true,
      trim: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "DISPATCHING", "DISPATCHED"],
      default: "PENDING",
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastError: {
      type: String,
      default: null,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    dispatchedAt: {
      type: Date,
      default: null,
    },

    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
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

outboxEventSchema.index({
  service: 1,
  status: 1,
  nextAttemptAt: 1,
  createdAt: 1,
});

module.exports = mongoose.model("OutboxEvent", outboxEventSchema);
