const Player = require("../models/player.data");
const User = require("../models/user.model");
const Assignment = require("../models/coachPlayerAssignment.model");

function fail(message, code, statusCode) {
  throw Object.assign(new Error(message), { code, statusCode });
}

const editableFields = ["sport", "position", "age", "height", "weight", "dominantSide"];

class PlayerService {
  static async createForUser(userId, input = {}) {
    const user = await User.findOne({ userId, roleId: "ROLE_PLAYER", isActive: true }).lean();
    if (!user) fail("Active player account not found", "PLAYER_USER_NOT_FOUND", 404);
    const playerId = input.playerId || `PLY-${userId}`;
    return Player.findOneAndUpdate(
      { userId },
      { $setOnInsert: {
        playerId,
        userId,
        sport: input.sport || "general",
        position: input.position,
        age: input.age,
        height: input.height,
        weight: input.weight,
        dominantSide: input.dominantSide,
        isActive: true,
      } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
  }

  static async listForUser(user, { page = 1, limit = 50, search, sport, isActive } = {}) {
    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const filter = {};

    if (user.roleId === "ROLE_PLAYER") {
      filter.userId = user.userId;
    } else if (user.roleId === "ROLE_COACH") {
      const assignedIds = await Assignment.distinct("playerId", { coachId: user.userId });
      filter.playerId = { $in: assignedIds };
    } else if (user.roleId !== "ROLE_ADMIN") {
      fail("Your role cannot view player profiles", "FORBIDDEN", 403);
    }

    if (sport) filter.sport = sport;
    if (typeof isActive !== "undefined") filter.isActive = isActive === true || isActive === "true";
    if (search) {
      const expression = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ playerId: expression }, { userId: expression }];
    }

    const [items, total] = await Promise.all([
      Player.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Player.countDocuments(filter),
    ]);
    return { items, pagination: { page, limit, total } };
  }

  static async getForUser(user, playerId) {
    const player = await Player.findOne({ playerId }).lean();
    if (!player) fail("Player not found", "PLAYER_NOT_FOUND", 404);
    if (user.roleId === "ROLE_ADMIN") return player;
    if (user.roleId === "ROLE_PLAYER" && player.userId === user.userId) return player;
    if (user.roleId === "ROLE_COACH" && await Assignment.exists({ coachId: user.userId, playerId })) return player;
    fail("You cannot view this player profile", "FORBIDDEN", 403);
  }

  static async updateForUser(user, playerId, input = {}) {
    const current = await this.getForUser(user, playerId);
    if (user.roleId !== "ROLE_ADMIN" && !(user.roleId === "ROLE_PLAYER" && current.userId === user.userId)) {
      fail("Only the player or an administrator can update this profile", "FORBIDDEN", 403);
    }
    const changes = Object.fromEntries(editableFields.filter((key) => Object.hasOwn(input, key)).map((key) => [key, input[key]]));
    if (user.roleId === "ROLE_ADMIN" && Object.hasOwn(input, "isActive")) changes.isActive = input.isActive;
    if (!Object.keys(changes).length) fail("No editable profile fields were provided", "VALIDATION_ERROR", 400);
    return Player.findOneAndUpdate({ playerId }, { $set: changes }, { new: true, runValidators: true }).lean();
  }

  static async deactivate(playerId) {
    const player = await Player.findOneAndUpdate({ playerId, isActive: true }, { $set: { isActive: false } }, { new: true, runValidators: true }).lean();
    if (!player) fail("Active player profile not found", "PLAYER_NOT_FOUND", 404);
    return player;
  }
}

module.exports = PlayerService;
