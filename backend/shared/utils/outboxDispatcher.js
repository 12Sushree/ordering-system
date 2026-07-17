const OutboxEvent = require("../models/outboxEventModel");
const logger = require("../logger/logger");

const DEFAULT_RETRY_DELAY_MS = 5000;
const STALE_LOCK_MS = 60000;

let draining = false;

function getRetryDelayMs(attempts) {
  const retryCount = Math.max(0, attempts - 1);

  return Math.min(DEFAULT_RETRY_DELAY_MS * 2 ** retryCount, 60000);
}

async function drainOutbox({ service, publishRecord }) {
  if (draining) {
    return;
  }

  draining = true;

  try {
    while (true) {
      const now = new Date();
      const staleBefore = new Date(Date.now() - STALE_LOCK_MS);

      const record = await OutboxEvent.findOneAndUpdate(
        {
          service,
          nextAttemptAt: {
            $lte: now,
          },
          $or: [
            {
              status: "PENDING",
            },
            {
              status: "DISPATCHING",
              lockedAt: {
                $lte: staleBefore,
              },
            },
          ],
        },
        {
          $set: {
            status: "DISPATCHING",
            lockedAt: now,
            lastError: null,
          },
        },
        {
          sort: {
            createdAt: 1,
          },
          returnDocument: "after",
        },
      );

      if (!record) {
        return;
      }

      try {
        await publishRecord(record);

        await OutboxEvent.updateOne(
          {
            _id: record._id,
          },
          {
            $set: {
              status: "DISPATCHED",
              dispatchedAt: new Date(),
              lockedAt: null,
              lastError: null,
            },
          },
        );

        logger.info(
          `Outbox event dispatched :: ${record.service} :: ${record.eventType} :: ${record.eventId}`,
        );
      } catch (error) {
        const attempts = (record.attempts || 0) + 1;
        const nextAttemptAt = new Date(Date.now() + getRetryDelayMs(attempts));

        await OutboxEvent.updateOne(
          {
            _id: record._id,
          },
          {
            $set: {
              status: "PENDING",
              lockedAt: null,
              lastError: error.message,
              nextAttemptAt,
            },
            $inc: {
              attempts: 1,
            },
          },
        );

        logger.error(
          `Outbox dispatch failed :: ${record.service} :: ${record.eventType} :: ${record.eventId} :: ${error.message}`,
        );

        return;
      }
    }
  } finally {
    draining = false;
  }
}

module.exports = drainOutbox;
