const mongoose = require("mongoose");

const processedEventSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate processing by the same service
processedEventSchema.index(
  {
    eventId: 1,
    service: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("ProcessedEvent", processedEventSchema);
