const User = require("../models/user.model.js");
const Player = require("../models/player.data.js");
const CoachPlayerAssignment = require("../models/coachPlayerAssignment.model.js");
const AssignmentService = require("./coachPlayerAssignment.service.js");
const PlayerService = require("./player.service.js");

async function assignedPlayerIds(coachId) {
  return CoachPlayerAssignment.distinct("playerId", { coachId });
}

/**
 * Coach Service
 *
 * Handles Coach Dashboard business logic.
 *
 * Current project scope:
 * - Coach identity
 * - Player statistics
 * - Active/inactive players
 *
 * Future scope:
 * - Assigned players
 * - Workout completion
 * - Sessions
 * - Attendance
 * - Wearable analytics
 *
 * These future metrics are intentionally not calculated
 * until their corresponding domain models are implemented.
 */

class CoachService {
  static async searchAvailablePlayers(coachId, query) {
    const normalized = String(query || "").trim();
    if (normalized.length < 2) {
      const error = new Error("Enter at least 2 characters to search players");
      error.statusCode = 400;
      error.code = "SEARCH_QUERY_TOO_SHORT";
      throw error;
    }
    const coach = await User.findOne({ userId: coachId, roleId: "ROLE_COACH", isActive: true }).lean();
    if (!coach) {
      const error = new Error("Active coach account was not found");
      error.statusCode = 404;
      error.code = "COACH_NOT_FOUND";
      throw error;
    }
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const assignedIds = await assignedPlayerIds(coachId);
    const assignedProfiles = await Player.find({ playerId: { $in: assignedIds } }).select("userId").lean();
    const excludedUserIds = assignedProfiles.map((profile) => profile.userId);
    const users = await User.find({
      roleId: "ROLE_PLAYER",
      isActive: true,
      userId: { $nin: excludedUserIds },
      username: { $regex: escaped, $options: "i" },
    }).select("userId username email").limit(20).lean();
    const profiles = await Player.find({ userId: { $in: users.map((user) => user.userId) } }).lean();
    const userById = new Map(users.map((user) => [user.userId, user]));
    const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
    return users
      .filter((user) => !profileByUserId.has(user.userId) || profileByUserId.get(user.userId).isActive)
      .map((user) => ({ ...(profileByUserId.get(user.userId) || { userId: user.userId, playerId: null, sport: "general" }), user }));
  }

  static async addPlayer(coachId, userId) {
    const coach = await User.findOne({ userId: coachId, roleId: "ROLE_COACH", isActive: true }).lean();
    if (!coach) {
      const error = new Error("Active coach account was not found");
      error.statusCode = 404;
      error.code = "COACH_NOT_FOUND";
      throw error;
    }
    const player = await PlayerService.createForUser(userId);
    return AssignmentService.create(coachId, player.playerId, coachId);
  }

  static async removePlayer(coachId, playerId) {
    return AssignmentService.remove(coachId, playerId);
  }

  /**
   * Get the currently authenticated coach's dashboard.
   *
   * req.user should be supplied by authentication middleware.
   */
  static async getDashboard(userId) {
    if (!userId) {
      const error = new Error(
        "Authenticated user ID is required"
      );

      error.statusCode = 401;

      throw error;
    }

    const coach = await User.findOne({
      userId,
      roleId: "ROLE_COACH",
      isActive: true,
    })
      .select("-password -refreshToken")
      .lean();

    if (!coach) {
      const error = new Error(
        "Active coach account was not found"
      );

      error.statusCode = 404;

      throw error;
    }

    const playerIds = await assignedPlayerIds(userId);
    const playerScope = { playerId: { $in: playerIds } };
    const [
      totalPlayers,
      activePlayers,
      inactivePlayers,
    ] = await Promise.all([
      Player.countDocuments(playerScope),

      Player.countDocuments({ ...playerScope,
        isActive: true,
      }),

      Player.countDocuments({ ...playerScope,
        isActive: false,
      }),
    ]);

    const activityRate =
      totalPlayers > 0
        ? Number(
            ((activePlayers / totalPlayers) * 100).toFixed(2)
          )
        : 0;

    return {
      success: true,

      data: {
        coach: {
          userId: coach.userId,
          username: coach.username,
          email: coach.email,
          mobileNo: coach.mobileNo,
          roleId: coach.roleId,
        },

        members: {
          total: totalPlayers,
          active: activePlayers,
          inactive: inactivePlayers,
          activityRate,
        },

        // These values are deliberately null until
        // the corresponding domains are implemented.
        training: {
          workoutCompletionRate: null,
          attendanceRate: null,
          upcomingSessions: null,
          completedSessions: null,
        },

        performance: {
          membersShowingProgress: null,
          personalRecords: null,
          averageTrainingTime: null,
        },

        wearable: {
          connectedDevices: null,
          activeDevices: null,
          averageSteps: null,
          averageHeartRate: null,
          syncSuccessRate: null,
        },

        attention: {
          membersNeedingAttention: null,
        },
      },
    };
  }

  /**
   * Get all players visible to the coach.
   *
 * Returns only players linked to this coach through the
 * admin-managed CoachPlayerAssignment roster.
   */
  static async getPlayers({
    coachId,
    page = 1,
    limit = 20,
    search,
    sport,
    isActive,
  } = {}) {
    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const playerIds = await assignedPlayerIds(coachId);
    const filter = { playerId: { $in: playerIds } };

    if (sport) {
      filter.sport = sport;
    }

    if (typeof isActive !== "undefined") {
      filter.isActive =
        isActive === true ||
        isActive === "true";
    }

    if (search) {
      filter.$or = [
        {
          playerId: {
            $regex: search,
            $options: "i",
          },
        },
        {
          userId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [
      rawPlayers,
      total,
    ] = await Promise.all([
      Player.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Player.countDocuments(filter),
    ]);

    const playerUsers = await User.find({ userId: { $in: rawPlayers.map((player) => player.userId) } })
      .select("userId username email")
      .lean();
    const usersById = new Map(playerUsers.map((user) => [user.userId, user]));
    const players = rawPlayers.map((player) => ({ ...player, user: usersById.get(player.userId) || null }));

    return {
      success: true,

      data: {
        players,

        pagination: {
          page,
          limit,
          total,
          totalPages:
            Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get player statistics visible from
   * the Coach Dashboard.
   */
  static async getPlayerStatistics(coachId) {
    const playerIds = await assignedPlayerIds(coachId);
    const filter = { playerId: { $in: playerIds } };
    const [
      total,
      active,
      inactive,
    ] = await Promise.all([
      Player.countDocuments(filter),

      Player.countDocuments({ ...filter,
        isActive: true,
      }),

      Player.countDocuments({ ...filter,
        isActive: false,
      }),
    ]);

    const activityRate =
      total > 0
        ? Number(
            ((active / total) * 100).toFixed(2)
          )
        : 0;

    return {
      success: true,

      data: {
        total,
        active,
        inactive,
        activityRate,
      },
    };
  }

  /**
   * Get players grouped by sport.
   */
  static async getSportDistribution(coachId) {
    const playerIds = await assignedPlayerIds(coachId);
    const distribution =
      await Player.aggregate([
        { $match: { playerId: { $in: playerIds } } },
        {
          $group: {
            _id: "$sport",
            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);

    return {
      success: true,

      data: distribution.map((item) => ({
        sport: item._id,
        count: item.count,
      })),
    };
  }
}

module.exports = CoachService;
