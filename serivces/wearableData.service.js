const WearableData = require("../models/wearableData.model");
const Execution = require("../models/workoutExecution.model");
const Player = require("../models/player.data");

function fail(message, code = "VALIDATION_ERROR", statusCode = 400) { throw Object.assign(new Error(message), { code, statusCode }); }
const METRICS = ["durationSeconds", "steps", "calories", "distanceMeters", "averageHeartRateBpm", "maxHeartRateBpm"];

class WearableDataService {
  static async upload(userId, executionId, input) {
    const player = await Player.findOne({ userId, isActive: true }).lean(); if (!player) fail("Player profile not found", "PLAYER_NOT_FOUND", 404);
    const execution = await Execution.findOne({ executionId }); if (!execution) fail("Execution not found", "EXECUTION_NOT_FOUND", 404);
    if (execution.playerId !== player.playerId) fail("You cannot upload data for this execution", "FORBIDDEN", 403);
    if (!input.batchId || input.batchId.length > 128) fail("batchId is required and must be at most 128 characters");
    const startedAt = new Date(input.startedAt), endedAt = new Date(input.endedAt);
    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime()) || endedAt < startedAt) fail("A valid startedAt and later endedAt are required");
    if (endedAt > new Date(Date.now() + 5 * 60 * 1000)) fail("Wearable event timestamps cannot be more than five minutes in the future");
    if (!input.metrics || typeof input.metrics !== "object" || Array.isArray(input.metrics)) fail("metrics must be an object");
    const metrics = {};
    for (const key of METRICS) if (input.metrics[key] !== undefined) {
      const value = input.metrics[key]; if (!Number.isFinite(value) || value < 0) fail(`${key} must be a non-negative number`); metrics[key] = value;
    }
    try {
      const record = await WearableData.create({ executionId, sessionId: execution.sessionId, playerId: player.playerId, source: "WEAR_OS", batchId: input.batchId, startedAt, endedAt, metrics });
      execution.wearableSyncStatus = "SYNCED"; await execution.save();
      return { record, duplicate: false };
    } catch (error) {
      if (error.code !== 11000) throw error;
      const record = await WearableData.findOne({ executionId, batchId: input.batchId }).lean();
      return { record, duplicate: true };
    }
  }
  static async list(userId, executionId) {
    const player = await Player.findOne({ userId, isActive: true }).lean(); if (!player) fail("Player profile not found", "PLAYER_NOT_FOUND", 404);
    const execution = await Execution.findOne({ executionId }).lean(); if (!execution) fail("Execution not found", "EXECUTION_NOT_FOUND", 404);
    if (execution.playerId !== player.playerId) fail("You cannot access this execution data", "FORBIDDEN", 403);
    return WearableData.find({ executionId }).sort({ startedAt: 1 }).lean();
  }
}
module.exports = WearableDataService;
