const mongoose = require("mongoose");

const wearableDataSchema = new mongoose.Schema(
  {
    playerId: {
      type: String,
      required: true,
      index: true,
    },

    heartRate: {
      type: Number,
      required: true,
    },

    steps: {
      type: Number,
      required: true,
    },

    calories: {
      type: Number,
      required: true,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
module.exports =
  mongoose.models.WearableData ||
  mongoose.model("WearableData", wearableDataSchema);