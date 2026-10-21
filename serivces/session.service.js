const { randomUUID } = require("crypto");
const TrainingSession = require("../models/session.model");
const Participation = require("../models/sessionParticipation.model");
const Workout = require("../models/workout.model");
const Player = require("../models/player.data");
const CoachPlayerAssignment = require("../models/coachPlayerAssignment.model");

function fail(message, code = "VALIDATION_ERROR", statusCode = 400) { throw Object.assign(new Error(message), { code, statusCode }); }
async function assertPlayers(coachId, playerIds) {
  if (!Array.isArray(playerIds) || !playerIds.length) fail("At least one player must be assigned");
  if (new Set(playerIds).size !== playerIds.length) fail("Player assignments must be unique");
  const [playerCount, assignmentCount] = await Promise.all([
    Player.countDocuments({ playerId: { $in: playerIds }, isActive: true }),
    CoachPlayerAssignment.countDocuments({ coachId, playerId: { $in: playerIds } }),
  ]);
  if (playerCount !== playerIds.length || assignmentCount !== playerIds.length) fail("One or more players are inactive or outside this coach's assigned roster", "INVALID_PLAYER_ASSIGNMENT", 403);
}
async function assertCoachSession(sessionId, userId) {
  const session = await TrainingSession.findOne({ sessionId });
  if (!session) fail("Session not found", "SESSION_NOT_FOUND", 404);
  if (session.coachId !== userId) fail("You cannot manage this session", "FORBIDDEN", 403);
  return session;
}

class SessionService {
  static async create(userId, input) {
    if (!input.name || !input.name.trim()) fail("Session name is required");
    return TrainingSession.create({ sessionId: randomUUID(), name: input.name, description: input.description, scheduledAt: input.scheduledAt, coachId: userId });
  }
  static async listForCoach(userId, { page = 1, limit = 20 } = {}) {
    page = Math.max(Number(page) || 1, 1); limit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const [items, total] = await Promise.all([TrainingSession.find({ coachId: userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), TrainingSession.countDocuments({ coachId: userId })]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  static async listForPlayer(playerId, { page = 1, limit = 20 } = {}) {
    page = Math.max(Number(page) || 1, 1); limit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const relations = await Participation.find({ playerId, status: { $in: ["INVITED", "JOINED", "COMPLETED"] } }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const ids = relations.map((item) => item.sessionId);
    const sessions = await TrainingSession.find({ sessionId: { $in: ids }, status: { $in: ["PUBLISHED", "COMPLETED"] } }).lean();
    const byId = new Map(sessions.map((item) => [item.sessionId, item]));
    return { items: relations.map((relation) => ({ ...byId.get(relation.sessionId), participation: relation })).filter((item) => item.sessionId), pagination: { page, limit, total: await Participation.countDocuments({ playerId, status: { $in: ["INVITED", "JOINED", "COMPLETED"] } }) } };
  }
  static async get(sessionId, user) {
    const session = await TrainingSession.findOne({ sessionId }).lean(); if (!session) fail("Session not found", "SESSION_NOT_FOUND", 404);
    if (user.roleId === "ROLE_COACH" || user.roleId === "ROLE_ADMIN") { if (user.roleId !== "ROLE_ADMIN" && session.coachId !== user.userId) fail("You cannot view this session", "FORBIDDEN", 403); }
    else { const player = await Player.findOne({ userId: user.userId }).lean(); if (!player || !session.playerIds.includes(player.playerId) || !["PUBLISHED", "COMPLETED"].includes(session.status)) fail("Session not found", "SESSION_NOT_FOUND", 404); }
    return session;
  }
  static async update(userId, sessionId, input) {
    const session = await assertCoachSession(sessionId, userId); if (session.status !== "DRAFT") fail("Only draft sessions can be edited", "INVALID_STATE", 409);
    if (input.playerIds !== undefined) { await assertPlayers(userId, input.playerIds); session.playerIds = input.playerIds; }
    if (input.workouts !== undefined) {
      if (!Array.isArray(input.workouts)) fail("workouts must be an array");
      const ids = input.workouts.map((item) => item.workoutId);
      if (new Set(ids).size !== ids.length) fail("Workout IDs must be unique in a session");
      const records = await Workout.find({ workoutId: { $in: ids }, isActive: true }).lean();
      if (records.length !== ids.length) fail("One or more workouts do not exist or are inactive", "INVALID_WORKOUT", 400);
      const byId = new Map(records.map((item) => [item.workoutId, item]));
      session.workouts = input.workouts.map((item, index) => {
        const workout = byId.get(item.workoutId);
        const order = item.order ?? index + 1;
        if (!Number.isInteger(order) || order < 1) fail("Workout order must be a positive integer");
        return { workoutId: workout.workoutId, name: workout.name, exerciseType: workout.exerciseType, exerciseTypeId: workout.exerciseTypeId, order, sets: item.sets ?? workout.sets, reps: item.reps ?? workout.reps, durationSeconds: item.durationSeconds ?? workout.durationSeconds };
      }).sort((a, b) => a.order - b.order);
      if (new Set(session.workouts.map((item) => item.order)).size !== session.workouts.length) fail("Workout order values must be unique");
    }
    for (const key of ["name", "description", "scheduledAt"]) if (input[key] !== undefined) session[key] = input[key];
    return session.save();
  }
  static async publish(userId, sessionId) {
    const session = await assertCoachSession(sessionId, userId); if (session.status !== "DRAFT") fail("Only draft sessions can be published", "INVALID_STATE", 409);
    if (!session.workouts.length || !session.playerIds.length) fail("Publishing requires at least one workout and one assigned player");
    await assertPlayers(userId, session.playerIds);
    session.status = "PUBLISHED"; session.publishedAt = new Date();
    await session.save();
    await Participation.bulkWrite(
      session.playerIds.map((playerId) => ({
        updateOne: {
          filter: { sessionId, playerId },
          update: { $setOnInsert: { sessionId, playerId, status: "INVITED", invitedAt: new Date() } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    return session;
  }
  static async cancel(userId, sessionId) {
    const session = await assertCoachSession(sessionId, userId); if (!["DRAFT", "PUBLISHED"].includes(session.status)) fail("Session cannot be cancelled in its current state", "INVALID_STATE", 409);
    session.status = "CANCELLED"; session.cancelledAt = new Date(); await session.save();
    await Participation.updateMany({ sessionId, status: { $in: ["INVITED", "JOINED"] } }, { $set: { status: "CANCELLED" } }); return session;
  }
  static async join(userId, sessionId, decline = false) {
    const player = await Player.findOne({ userId, isActive: true }).lean(); if (!player) fail("Player profile not found", "PLAYER_NOT_FOUND", 404);
    const session = await TrainingSession.findOne({ sessionId, status: "PUBLISHED", playerIds: player.playerId }); if (!session) fail("Invitation not found", "INVITATION_NOT_FOUND", 404);
    const relation = await Participation.findOne({ sessionId, playerId: player.playerId }); if (!relation) fail("Invitation not found", "INVITATION_NOT_FOUND", 404);
    if (relation.status === "CANCELLED" || relation.status === "COMPLETED") fail("Participation cannot be changed", "INVALID_STATE", 409);
    if (decline) { if (relation.status === "JOINED") fail("A joined session cannot be declined", "INVALID_STATE", 409); relation.status = "DECLINED"; }
    else { if (relation.status === "DECLINED") fail("A declined invitation cannot be joined", "INVALID_STATE", 409); relation.status = "JOINED"; relation.joinedAt ||= new Date(); }
    return relation.save();
  }
  static async syncStatus(userId, sessionId, syncStatus) {
    if (!["PENDING", "SYNCED", "FAILED"].includes(syncStatus)) fail("Invalid syncStatus");
    const player = await Player.findOne({ userId }).lean(); if (!player) fail("Player profile not found", "PLAYER_NOT_FOUND", 404);
    const relation = await Participation.findOne({ sessionId, playerId: player.playerId, status: "JOINED" }); if (!relation) fail("Joined participation not found", "PARTICIPATION_NOT_FOUND", 404);
    relation.syncStatus = syncStatus; return relation.save();
  }
  static async progress(userId, sessionId) {
    const session = await assertCoachSession(sessionId, userId);
    const participations = await Participation.find({ sessionId }).lean();
    return { sessionId, participants: participations };
  }
}
module.exports = SessionService;
