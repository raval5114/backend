const { randomUUID } = require("crypto");
const Execution = require("../models/workoutExecution.model");
const Session = require("../models/session.model");
const Participation = require("../models/sessionParticipation.model");
const Player = require("../models/player.data");

function fail(message, code = "VALIDATION_ERROR", statusCode = 400) { throw Object.assign(new Error(message), { code, statusCode }); }
async function playerFor(userId) { const player = await Player.findOne({ userId, isActive: true }).lean(); if (!player) fail("Player profile not found", "PLAYER_NOT_FOUND", 404); return player; }
async function ownedExecution(executionId, playerId) { const item = await Execution.findOne({ executionId }); if (!item) fail("Execution not found", "EXECUTION_NOT_FOUND", 404); if (item.playerId !== playerId) fail("You cannot access this execution", "FORBIDDEN", 403); return item; }

class ExecutionService {
  static async start(userId, sessionId, workoutId) {
    const player = await playerFor(userId);
    const participation = await Participation.findOne({ sessionId, playerId: player.playerId, status: "JOINED" });
    if (!participation) fail("Player must join this session before starting its workouts", "JOIN_REQUIRED", 403);
    const session = await Session.findOne({ sessionId, status: "PUBLISHED" }).lean(); if (!session) fail("Published session not found", "SESSION_NOT_FOUND", 404);
    const workout = session.workouts.find((item) => item.workoutId === workoutId); if (!workout) fail("Workout is not part of this session", "WORKOUT_NOT_IN_SESSION", 404);
    let current = await Execution.findOne({ sessionId, playerId: player.playerId, workoutId, status: { $in: ["IN_PROGRESS", "PAUSED"] } });
    if (current) return { execution: current, created: false };
    const previous = await Execution.find({ sessionId, playerId: player.playerId, workoutId }).sort({ attempt: -1 }).limit(1).lean();
    try {
      const execution = await Execution.create({ executionId: randomUUID(), sessionId, playerId: player.playerId, workoutId, exerciseTypeId: workout.exerciseTypeId, attempt: previous.length ? previous[0].attempt + 1 : 1 });
      return { execution, created: true };
    } catch (error) {
      if (error.code !== 11000) throw error;
      current = await Execution.findOne({ sessionId, playerId: player.playerId, workoutId, status: { $in: ["IN_PROGRESS", "PAUSED"] } });
      if (current) return { execution: current, created: false };
      throw error;
    }
  }
  static async get(userId, executionId) { const player = await playerFor(userId); return ownedExecution(executionId, player.playerId); }
  static async transition(userId, executionId, action, actualDurationSeconds) {
    const player = await playerFor(userId); const item = await ownedExecution(executionId, player.playerId);
    const transitions = { pause: ["IN_PROGRESS", "PAUSED"], resume: ["PAUSED", "IN_PROGRESS"], complete: [["IN_PROGRESS", "PAUSED"], "COMPLETED"], skip: [["IN_PROGRESS", "PAUSED"], "SKIPPED"] };
    const [from, to] = transitions[action] || []; const allowedFrom = Array.isArray(from) ? from : [from];
    if (!to || !allowedFrom.includes(item.status)) fail(`Cannot ${action} execution from ${item.status}`, "INVALID_STATE", 409);
    item.status = to;
    if (action === "pause") item.pausedAt = new Date();
    if (action === "resume") item.pausedAt = undefined;
    if (action === "complete" || action === "skip") { item.completedAt = new Date(); if (actualDurationSeconds !== undefined) { if (!Number.isFinite(actualDurationSeconds) || actualDurationSeconds < 0) fail("actualDurationSeconds must be a non-negative number"); item.actualDurationSeconds = actualDurationSeconds; } }
    await item.save();
    if (action === "complete" || action === "skip") {
      const session = await Session.findOne({ sessionId: item.sessionId }).lean();
      if (session && session.workouts.length) {
        const finished = await Execution.distinct("workoutId", { sessionId: item.sessionId, playerId: player.playerId, status: { $in: ["COMPLETED", "SKIPPED"] } });
        if (session.workouts.every((workout) => finished.includes(workout.workoutId))) {
          await Participation.updateOne({ sessionId: item.sessionId, playerId: player.playerId, status: "JOINED" }, { $set: { status: "COMPLETED" } });
          const completedPlayers = await Participation.countDocuments({ sessionId: item.sessionId, status: "COMPLETED" });
          if (completedPlayers >= session.playerIds.length) {
            await Session.updateOne({ sessionId: item.sessionId, status: "PUBLISHED" }, { $set: { status: "COMPLETED" } });
          }
        }
      }
    }
    return item;
  }
}
module.exports = ExecutionService;
