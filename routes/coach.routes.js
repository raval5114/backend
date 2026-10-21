const express = require("express");

const CoachService = require("../serivces/coach_service.js");
const CoachPlayerAssignmentService = require("../serivces/coachPlayerAssignment.service.js");

const authenticationMiddleware = require(
  "../middleware/authentication.middleware.js"
);

const authorizationMiddleware = require(
  "../middleware/authorization.middleware.js"
);

const coachRouter = express.Router();

coachRouter.get(
  "/players/search",
  authenticationMiddleware,
  authorizationMiddleware("COACH_PLAYER_ASSIGN"),
  async (req, res) => {
    try {
      const players = await CoachService.searchAvailablePlayers(req.user.userId, req.query.query);
      return res.status(200).json({ success: true, data: players });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, error: error.code || "PLAYER_SEARCH_FAILED", message: error.statusCode ? error.message : "Unable to search player accounts" });
    }
  }
);

coachRouter.post(
  "/players",
  authenticationMiddleware,
  authorizationMiddleware("COACH_PLAYER_ASSIGN"),
  async (req, res) => {
    try {
      const assignment = await CoachService.addPlayer(req.user.userId, req.body.userId);
      return res.status(201).json({ success: true, message: "Player added to your roster", data: assignment });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, error: error.code || "PLAYER_ASSIGNMENT_FAILED", message: error.statusCode ? error.message : "Unable to add player to roster" });
    }
  }
);

coachRouter.delete(
  "/players/:playerId",
  authenticationMiddleware,
  authorizationMiddleware("COACH_PLAYER_ASSIGN"),
  async (req, res) => {
    try {
      await CoachPlayerAssignmentService.remove(req.user.userId, req.params.playerId);
      return res.status(200).json({ success: true, message: "Player removed from your roster" });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, error: error.code || "PLAYER_REMOVAL_FAILED", message: error.statusCode ? error.message : "Unable to remove player from roster" });
    }
  }
);

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
 * /api/coach/players/search:
 *   get:
 *     summary: Search registered players who can be added to this coach roster
 *     tags: [Coach]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: query, required: true, schema: { type: string, minLength: 2 } }
 *     responses:
 *       200: { description: Matching player accounts and profiles }
 * /api/coach/players/{playerId}:
 *   delete:
 *     summary: Remove a player from the signed-in coach roster
 *     tags: [Coach]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Player removed from roster }
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
        await CoachService.getPlayerStatistics(req.user.userId);

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
 *   post:
 *     summary: Add a registered player account to the signed-in coach roster
 *     tags: [Coach]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       201: { description: Player added to roster }
 */
coachRouter.get(
  "/players",
  authenticationMiddleware,
  authorizationMiddleware("PLAYER_READ"),
  async (req, res) => {
    try {
      const result =
        await CoachService.getPlayers({
          coachId: req.user.userId,
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
        await CoachService.getSportDistribution(req.user.userId);

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
