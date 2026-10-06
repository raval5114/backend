const User = require("../models/user.model.js");
const Player = require("../models/player.data.js");

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

    const [
      totalPlayers,
      activePlayers,
      inactivePlayers,
    ] = await Promise.all([
      Player.countDocuments(),

      Player.countDocuments({
        isActive: true,
      }),

      Player.countDocuments({
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
   * IMPORTANT:
   * There is currently no coach-player assignment model.
   *
   * Therefore this method returns players globally rather
   * than claiming they are assigned to this coach.
   *
   * Once CoachAssignment/Team is implemented, this method
   * should be changed to filter by coach ownership/scope.
   */
  static async getPlayers({
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

    const filter = {};

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
      players,
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
  static async getPlayerStatistics() {
    const [
      total,
      active,
      inactive,
    ] = await Promise.all([
      Player.countDocuments(),

      Player.countDocuments({
        isActive: true,
      }),

      Player.countDocuments({
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
  static async getSportDistribution() {
    const distribution =
      await Player.aggregate([
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