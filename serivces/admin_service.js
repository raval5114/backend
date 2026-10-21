const User = require("../models/user.model.js");
const Player = require("../models/player.data.js");
const Role = require("../models/role.model.js");

/**
 * Admin Service
 *
 * Responsible for platform-level administrative
 * dashboard and management operations.
 *
 * Important:
 * Workout/session/wearable analytics are intentionally
 * not queried here yet because those domain models are
 * not part of the current backend specification.
 */

class AdminService {
  /**
   * Get platform overview for Admin Dashboard.
   *
   * Current KPIs are based on the models currently
   * defined in the project:
   *
   * - Users
   * - Players
   * - Coaches
   * - Active/inactive accounts
   * - Role distribution
   * - Player status
   */
  static async getPlatformOverview() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalPlayers,
      activePlayers,
      inactivePlayers,
      totalCoaches,
      activeCoaches,
      inactiveCoaches,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),

      Player.countDocuments(),

      Player.countDocuments({
        isActive: true,
      }),

      Player.countDocuments({
        isActive: false,
      }),

      User.countDocuments({
        roleId: "ROLE_COACH",
      }),

      User.countDocuments({
        roleId: "ROLE_COACH",
        isActive: true,
      }),

      User.countDocuments({
        roleId: "ROLE_COACH",
        isActive: false,
      }),
    ]);

    const activeRate =
      totalUsers > 0
        ? Number(((activeUsers / totalUsers) * 100).toFixed(2))
        : 0;

    const memberActivityRate =
      totalPlayers > 0
        ? Number(((activePlayers / totalPlayers) * 100).toFixed(2))
        : 0;

    const memberCoachRatio =
      activeCoaches > 0
        ? Number((activePlayers / activeCoaches).toFixed(2))
        : 0;

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          activeRate,
        },

        members: {
          total: totalPlayers,
          active: activePlayers,
          inactive: inactivePlayers,
          activityRate: memberActivityRate,
        },

        coaches: {
          total: totalCoaches,
          active: activeCoaches,
          inactive: inactiveCoaches,
        },

        operations: {
          activeMemberCoachRatio: memberCoachRatio,
        },

        // Future values intentionally remain outside
        // this service until the corresponding models exist.
        futureMetrics: {
          workoutCompletionRate: null,
          sessionCompletionRate: null,
          retentionRate: null,
          wearableSyncSuccessRate: null,
        },
      },
    };
  }

  /**
   * Get user statistics.
   */
  static async getUserStatistics() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      admins,
      coaches,
      players,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),

      User.countDocuments({
        roleId: "ROLE_ADMIN",
      }),

      User.countDocuments({
        roleId: "ROLE_COACH",
      }),

      User.countDocuments({
        roleId: "ROLE_PLAYER",
      }),
    ]);

    return {
      success: true,
      data: {
        total: totalUsers,

        status: {
          active: activeUsers,
          inactive: inactiveUsers,
        },

        roles: {
          admin: admins,
          coach: coaches,
          player: players,
        },
      },
    };
  }

  /**
   * Get member/player statistics.
   */
  static async getMemberStatistics() {
    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
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
      totalMembers > 0
        ? Number(((activeMembers / totalMembers) * 100).toFixed(2))
        : 0;

    return {
      success: true,
      data: {
        total: totalMembers,
        active: activeMembers,
        inactive: inactiveMembers,
        activityRate,
      },
    };
  }

  /**
   * Get coach statistics.
   */
  static async getCoachStatistics() {
    const [
      total,
      active,
      inactive,
    ] = await Promise.all([
      User.countDocuments({
        roleId: "ROLE_COACH",
      }),

      User.countDocuments({
        roleId: "ROLE_COACH",
        isActive: true,
      }),

      User.countDocuments({
        roleId: "ROLE_COACH",
        isActive: false,
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
      },
    };
  }

  /**
   * Get role distribution.
   *
   * Uses aggregation rather than hardcoding only
   * ADMIN / COACH / PLAYER counts.
   */
  static async getRoleDistribution() {
    const distribution = await User.aggregate([
      {
        $group: {
          _id: "$roleId",
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
        roleId: item._id,
        count: item.count,
      })),
    };
  }

  /**
   * Get recent users.
   *
   * Password is excluded automatically by the User model
   * according to the project specification.
   */
  static async getRecentUsers(limit = 10) {
    const parsedLimit = Math.min(
      Math.max(Number(limit) || 10, 1),
      50
    );

    const users = await User.find({})
      .select("-password -refreshToken")
      .sort({
        createdAt: -1,
      })
      .limit(parsedLimit)
      .lean();

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Get platform health.
   *
   * This is intentionally application-level health,
   * not MongoDB infrastructure health.
   */
  static async getPlatformHealth() {
    const [
      users,
      activeUsers,
      players,
      coaches,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        isActive: true,
      }),

      Player.countDocuments(),

      User.countDocuments({
        roleId: "ROLE_COACH",
        isActive: true,
      }),
    ]);

    return {
      success: true,
      data: {
        status: "UP",

        entities: {
          users,
          activeUsers,
          players,
          activeCoaches: coaches,
        },

        modules: {
          authentication: "AVAILABLE",
          rbac: "AVAILABLE",
          playerManagement: "AVAILABLE",
          workoutManagement: "PLANNED",
          sessionManagement: "PLANNED",
          wearableAnalytics: "PLANNED",
        },
      },
    };
  }
}

module.exports = AdminService;