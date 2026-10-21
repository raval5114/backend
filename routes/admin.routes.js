const express = require("express");

const AdminService = require("../serivces/admin_service.js");
const UserLogService = require("../serivces/user_log_service.js");

const authenticationMiddleware = require(
  "../middleware/authentication.middleware.js"
);

const authorizationMiddleware = require(
  "../middleware/authorization.middleware.js"
);

const adminRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard and platform management APIs
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get Admin Dashboard overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform overview retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient privileges
 */
adminRouter.get(
  "/dashboard",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const result = await AdminService.getPlatformOverview();

      return res.status(200).json({
        success: true,
        message: "Admin dashboard overview retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve admin dashboard overview",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  "/users/statistics",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const result =
        await AdminService.getUserStatistics();

      return res.status(200).json({
        success: true,
        message: "User statistics retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin user statistics error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve user statistics",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/members/statistics:
 *   get:
 *     summary: Get member statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  "/members/statistics",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const result =
        await AdminService.getMemberStatistics();

      return res.status(200).json({
        success: true,
        message: "Member statistics retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin member statistics error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve member statistics",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/coaches/statistics:
 *   get:
 *     summary: Get coach statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  "/coaches/statistics",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const result =
        await AdminService.getCoachStatistics();

      return res.status(200).json({
        success: true,
        message: "Coach statistics retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin coach statistics error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve coach statistics",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/roles/distribution:
 *   get:
 *     summary: Get platform role distribution
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  "/roles/distribution",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const result =
        await AdminService.getRoleDistribution();

      return res.status(200).json({
        success: true,
        message: "Role distribution retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin role distribution error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve role distribution",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/recent:
 *   get:
 *     summary: Get recently registered users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 */
adminRouter.get(
  "/users/recent",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const result =
        await AdminService.getRecentUsers(
          req.query.limit
        );

      return res.status(200).json({
        success: true,
        message: "Recent users retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin recent users error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve recent users",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     summary: Get platform module health
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  "/health",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const result =
        await AdminService.getPlatformHealth();

      return res.status(200).json({
        success: true,
        message: "Platform health retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin platform health error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve platform health",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/logs:
 *   get:
 *     summary: Get user action logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: User logs retrieved successfully
 */
adminRouter.get(
  "/users/logs",
  authenticationMiddleware,
  authorizationMiddleware("USER_READ"),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;
      
      const result = await UserLogService.getUserLogs(limit, skip);

      return res.status(200).json({
        success: true,
        message: "User logs retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Admin get user logs error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve user logs",
      });
    }
  }
);

module.exports = adminRouter;