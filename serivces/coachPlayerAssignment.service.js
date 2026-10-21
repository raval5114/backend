const Assignment = require("../models/coachPlayerAssignment.model");
const User = require("../models/user.model");
const Player = require("../models/player.data");

function fail(message, code = "VALIDATION_ERROR", statusCode = 400) { throw Object.assign(new Error(message), { code, statusCode }); }

class CoachPlayerAssignmentService {
  static async create(coachId, playerId, assignedBy) {
    const [coach, player, actor] = await Promise.all([
      User.findOne({ userId: coachId, roleId: "ROLE_COACH", isActive: true }).lean(),
      Player.findOne({ playerId, isActive: true }).lean(),
      User.findOne({ userId: assignedBy, isActive: true }).lean(),
    ]);
    if (!coach) fail("Active coach account not found", "COACH_NOT_FOUND", 404);
    if (!player) fail("Active player profile not found", "PLAYER_NOT_FOUND", 404);
    if (!actor || (actor.roleId !== "ROLE_ADMIN" && !(actor.roleId === "ROLE_COACH" && actor.userId === coachId))) {
      fail("Only an administrator or the assigned coach can manage this roster", "ROSTER_MANAGE_FORBIDDEN", 403);
    }
    const playerUser = await User.findOne({ userId: player.userId, roleId: "ROLE_PLAYER", isActive: true }).lean();
    if (!playerUser) fail("Player profile is not linked to an active player account", "PLAYER_USER_NOT_FOUND", 409);
    return Assignment.findOneAndUpdate({ coachId, playerId }, { $setOnInsert: { coachId, playerId, assignedBy } }, { upsert: true, new: true, runValidators: true });
  }
  static async remove(coachId, playerId) {
    const result = await Assignment.findOneAndDelete({ coachId, playerId });
    if (!result) fail("Coach/player assignment not found", "ASSIGNMENT_NOT_FOUND", 404);
    return result;
  }
  static async list(coachId) {
    const assignments = await Assignment.find({ coachId }).sort({ createdAt: -1 }).lean();
    const playerIds = assignments.map(({ playerId }) => playerId);
    const players = await Player.find({ playerId: { $in: playerIds }, isActive: true }).lean();
    const byId = new Map(players.map((player) => [player.playerId, player]));
    return assignments.map((assignment) => ({ ...assignment, player: byId.get(assignment.playerId) || null }));
  }
}
module.exports = CoachPlayerAssignmentService;
