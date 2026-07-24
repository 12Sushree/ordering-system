const mongoose = require("mongoose");

async function runInTransaction(work) {
  if (typeof work !== "function") {
    throw new TypeError("runInTransaction expects a callback function.");
  }
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  runInTransaction,
};
