const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");

const Player = require("../models/player.data");

// ============================================================
// PLAYER MANAGEMENT
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Players
 *   description: Player profile and wearable analytics management
 */

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get all players
 *     description: Returns all player profiles.
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Players retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 */
router.get(
  "/",
  authenticate,
  authorize("PLAYER_READ"),
  async (req, res) => {
    try {
      const players = await Player.find();

      return res.status(200).json({
        success: true,
        data: players,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "PLAYER_FETCH_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}:
 *   get:
 *     summary: Get player by ID
 *     description: Returns a specific player profile.
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         example: PLAYER_001
 *     responses:
 *       200:
 *         description: Player retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Player not found
 */
router.get(
  "/:playerId",
  authenticate,
  authorize("PLAYER_READ"),
  async (req, res) => {
    try {
      const player = await Player.findOne({
        playerId: req.params.playerId,
      });

      if (!player) {
        return res.status(404).json({
          success: false,
          error: "PLAYER_NOT_FOUND",
          message: "Player not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: player,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "PLAYER_FETCH_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/players:
 *   post:
 *     summary: Create player
 *     description: Creates a new player profile associated with a user.
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playerId
 *               - userId
 *               - sport
 *             properties:
 *               playerId:
 *                 type: string
 *                 example: PLAYER_001
 *               userId:
 *                 type: string
 *                 example: USER_001
 *               sport:
 *                 type: string
 *                 enum:
 *                   - football
 *                   - cricket
 *                   - basketball
 *                   - tennis
 *                   - general
 *                 example: football
 *               position:
 *                 type: string
 *                 example: midfielder
 *               age:
 *                 type: integer
 *                 example: 22
 *               height:
 *                 type: number
 *                 example: 175
 *               weight:
 *                 type: number
 *                 example: 68
 *               dominantSide:
 *                 type: string
 *                 enum:
 *                   - left
 *                   - right
 *                   - both
 *                 example: right
 *     responses:
 *       201:
 *         description: Player created successfully
 *       400:
 *         description: Invalid player data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 */
router.post(
  "/",
  authenticate,
  authorize("PLAYER_CREATE"),
  async (req, res) => {
    try {
      const player = await Player.create(req.body);

      return res.status(201).json({
        success: true,
        message: "Player created successfully",
        data: player,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "PLAYER_CREATE_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}:
 *   put:
 *     summary: Update player
 *     description: Updates an existing player profile.
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         example: PLAYER_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sport:
 *                 type: string
 *               position:
 *                 type: string
 *               age:
 *                 type: integer
 *               height:
 *                 type: number
 *               weight:
 *                 type: number
 *               dominantSide:
 *                 type: string
 *                 enum:
 *                   - left
 *                   - right
 *                   - both
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Player updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Player not found
 */
router.put(
  "/:playerId",
  authenticate,
  authorize("PLAYER_UPDATE"),
  async (req, res) => {
    try {
      const player = await Player.findOneAndUpdate(
        { playerId: req.params.playerId },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!player) {
        return res.status(404).json({
          success: false,
          error: "PLAYER_NOT_FOUND",
          message: "Player not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Player updated successfully",
        data: player,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "PLAYER_UPDATE_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}:
 *   delete:
 *     summary: Delete player
 *     description: Deletes a player profile.
 *     tags:
 *       - Players
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         example: PLAYER_001
 *     responses:
 *       200:
 *         description: Player deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Player not found
 */
router.delete(
  "/:playerId",
  authenticate,
  authorize("PLAYER_DELETE"),
  async (req, res) => {
    try {
      const player = await Player.findOneAndDelete({
        playerId: req.params.playerId,
      });

      if (!player) {
        return res.status(404).json({
          success: false,
          error: "PLAYER_NOT_FOUND",
          message: "Player not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Player deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "PLAYER_DELETE_FAILED",
        message: error.message,
      });
    }
  }
);

module.exports = router;  