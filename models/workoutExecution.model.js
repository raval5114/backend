const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema({
  executionId: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  playerId: { type: String, required: true, index: true },
  workoutId: { type: String, required: true },
  exerciseTypeId: { type: Number, required: true },
  attempt: { type: Number, required: true, min: 1, default: 1 },
  status: { type: String, enum: ["IN_PROGRESS", "PAUSED", "COMPLETED", "SKIPPED"], default: "IN_PROGRESS", index: true },
  startedAt: { type: Date, default: Date.now },
  pausedAt: Date,
  completedAt: Date,
  actualDurationSeconds: { type: Number, min: 0 },
  wearableSyncStatus: { type: String, enum: ["PENDING", "PARTIAL", "SYNCED"], default: "PENDING" },
}, { timestamps: true });

executionSchema.index({ sessionId: 1, playerId: 1, workoutId: 1, attempt: 1 }, { unique: true });
module.exports = mongoose.model("WorkoutExecution", executionSchema);
