const OutboxEvent = require("../models/outboxEventModel");
const logger = require("../logger/logger");
const OUTBOX_STATUS = require("../constants/outboxStatus");

const DEFAULT_RETRY_DELAY_MS = 5000;
const STALE_LOCK_MS = 60000;
const MAX_RETRIES = 10;
const activeDispatchers = new Set();

function getRetryDelayMs(attempts) {
  const retryCount = Math.max(0, attempts - 1);
  return Math.min(DEFAULT_RETRY_DELAY_MS * 2 ** retryCount, 60000);
}

async function drainOutbox({ service, publishRecord }) {
  if (activeDispatchers.has(service)) {
    return;
  }
  activeDispatchers.add(service);

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
              status: OUTBOX_STATUS.PENDING,
            },
            {
              status: OUTBOX_STATUS.DISPATCHING,
              lockedAt: {
                $lte: staleBefore,
              },
            },
          ],
        },
        {
          $set: {
            status: OUTBOX_STATUS.DISPATCHING,
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
              status: OUTBOX_STATUS.DISPATCHED,
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
        if (attempts >= MAX_RETRIES) {
          await OutboxEvent.updateOne(
            {
              _id: record._id,
            },
            {
              $set: {
                status: OUTBOX_STATUS.FAILED,
                lockedAt: null,
                lastError: error.message,
              },
              $inc: {
                attempts: 1,
              },
            },
          );
          logger.error(
            `Outbox permanently failed :: ${record.service} :: ${record.eventType} :: ${record.eventId} :: ${error.message}`,
          );
          continue;
        }

        const nextAttemptAt = new Date(Date.now() + getRetryDelayMs(attempts));

        await OutboxEvent.updateOne(
          {
            _id: record._id,
          },
          {
            $set: {
              status: OUTBOX_STATUS.PENDING,
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
          `Outbox dispatch failed :: ${record.service} :: ${record.eventType} :: ${record.eventId} :: Attempt ${attempts}/${MAX_RETRIES} :: ${error.message}`,
        );
        return;
      }
    }
  } finally {
    activeDispatchers.delete(service);
  }
}

module.exports = {
  drainOutbox,
};
