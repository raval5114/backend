  const mongoose = require("mongoose");

const wearableDataSchema = new mongoose.Schema({
  executionId: { type: String, required: false },
  sessionId: { type: String, required: false,},
  playerId: { type: String, required: true, index: true },
  source: { type: String, enum: ["WEAR_OS"], default: "WEAR_OS" },
  batchId: { type: String, required: false },
  startedAt: { type: Date, required: false },
  endedAt: { type: Date, required: false },
  metrics: {
    durationSeconds: { type: Number, min: 0 },
    steps: { type: Number, min: 0 },
    heartRate:{type:Number,min:0},
    calories: { type: Number, min: 0 },
    distanceMeters: { type: Number, min: 0 },
    averageHeartRateBpm: { type: Number, min: 0 },
    maxHeartRateBpm: { type: Number, min: 0 },
  },
  receivedAt: { type: Date, default: Date.now },
}, { timestamps: true, minimize: true });

//wearableDataSchema.index({ executionId: 1, batchId: 1 }, { unique: true });
//module.exports = mongoose.model("WearableData", wearableDataSchema);
module.exports =
  mongoose.models.WearableData ||
  mongoose.model("WearableData", wearableDataSchema);