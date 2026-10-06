const express = require("express");

const CoachService = require("../serivces/coach_service.js");

const authenticationMiddleware = require(
  "../middleware/authentication.middleware.js"
);

const authorizationMiddleware = require(
  "../middleware/authorization.middleware.js"
);

const coachRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coach
 *   description: Coach dashboard and player management APIs
 */

/**
 * @swagger
 * /api/coach/dashboard:
 *   get:
 *     summary: Get Coach Dashboard overview
 *     tags: [Coach]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coach dashboard retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient privileges
 */
coachRouter.get(
  "/dashboard",
  authenticationMiddleware,
  authorizationMiddleware("PLAYER_READ"),
  async (req, res) => {
    try {
      const result =
        await CoachService.getDashboard(
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Coach dashboard retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Coach dashboard error:",
        error
      );

      const statusCode =
        error.statusCode || 500;

      return res.status(statusCode).json({
        success: false,
        error:
          statusCode === 404
            ? "COACH_NOT_FOUND"
            : "INTERNAL_SERVER_ERROR",
        message:
          statusCode === 404
            ? error.message
            : "Unable to retrieve coach dashboard",
      });
    }
  }
);

/**
 * @swagger
 * /api/coach/players/statistics:
 *   get:
 *     summary: Get player statistics
 *     tags: [Coach]
 *     security:
 *       - bearerAuth: []
 */
coachRouter.get(
  "/players/statistics",
  authenticationMiddleware,
  authorizationMiddleware("PLAYER_READ"),
  async (req, res) => {
    try {
      const result =
        await CoachService.getPlayerStatistics();

      return res.status(200).json({
        success: true,
        message:
          "Player statistics retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Coach player statistics error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to retrieve player statistics",
      });
    }
  }
);

/**
 * @swagger
 * /api/coach/players:
 *   get:
 *     summary: Get players visible to coach
 *     tags: [Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 */
coachRouter.get(
  "/players",
  authenticationMiddleware,
  authorizationMiddleware("PLAYER_READ"),
  async (req, res) => {
    try {
      const result =
        await CoachService.getPlayers({
          page: req.query.page,
          limit: req.query.limit,
          search: req.query.search,
          sport: req.query.sport,
          isActive: req.query.isActive,
        });

      return res.status(200).json({
        success: true,
        message:
          "Players retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Coach players error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to retrieve players",
      });
    }
  }
);

/**
 * @swagger
 * /api/coach/players/sports:
 *   get:
 *     summary: Get player distribution by sport
 *     tags: [Coach]
 *     security:
 *       - bearerAuth: []
 */
coachRouter.get(
  "/players/sports",
  authenticationMiddleware,
  authorizationMiddleware("PLAYER_READ"),
  async (req, res) => {
    try {
      const result =
        await CoachService.getSportDistribution();

      return res.status(200).json({
        success: true,
        message:
          "Player sport distribution retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error(
        "Coach sport distribution error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to retrieve sport distribution",
      });
    }
  }
);

module.exports = coachRouter;