const mongoose = require("mongoose");

const processedEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
    },

    eventType: {
      type: String,
      required: true,
    },

    service: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

processedEventSchema.index(
  {
    eventId: 1,
    eventType: 1,
    service: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("ProcessedEvent", processedEventSchema);
