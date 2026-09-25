const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");

const Privilege = require("../models/privilege.model");

// ============================================================
// PRIVILEGE MANAGEMENT
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Privileges
 *   description: Privilege management APIs
 */

/**
 * @swagger
 * /api/privileges:
 *   get:
 *     summary: Get all privileges
 *     description: Returns all privileges configured in the system.
 *     tags:
 *       - Privileges
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privileges retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 */
router.get(
  "/",
  authenticate,
  authorize("PRIVILEGE_READ"),
  async (req, res) => {
    try {
      const privileges = await Privilege.find().sort({
        privilegeId: 1,
      });

      return res.status(200).json({
        success: true,
        data: privileges,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "PRIVILEGE_FETCH_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/privileges/{privilegeId}:
 *   get:
 *     summary: Get privilege by ID
 *     description: Returns a specific privilege.
 *     tags:
 *       - Privileges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: privilegeId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 20
 *     responses:
 *       200:
 *         description: Privilege retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Privilege not found
 */
router.get(
  "/:privilegeId",
  authenticate,
  authorize("PRIVILEGE_READ"),
  async (req, res) => {
    try {
      const privilege = await Privilege.findOne({
        privilegeId: Number(req.params.privilegeId),
      });

      if (!privilege) {
        return res.status(404).json({
          success: false,
          error: "PRIVILEGE_NOT_FOUND",
          message: "Privilege not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: privilege,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "PRIVILEGE_FETCH_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/privileges:
 *   post:
 *     summary: Create privilege
 *     description: Creates a new privilege in the RBAC system.
 *     tags:
 *       - Privileges
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - privilegeId
 *               - privilegeName
 *             properties:
 *               privilegeId:
 *                 type: integer
 *                 example: 30
 *               privilegeName:
 *                 type: string
 *                 example: PLAYER_ANALYTICS_READ
 *               description:
 *                 type: string
 *                 example: Allows access to player analytics
 *     responses:
 *       201:
 *         description: Privilege created successfully
 *       400:
 *         description: Invalid privilege data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 */
router.post(
  "/",
  authenticate,
  authorize("PRIVILEGE_CREATE"),
  async (req, res) => {
    try {
      const privilege = await Privilege.create(req.body);

      return res.status(201).json({
        success: true,
        message: "Privilege created successfully",
        data: privilege,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "PRIVILEGE_CREATE_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/privileges/{privilegeId}:
 *   delete:
 *     summary: Delete privilege
 *     description: Deletes an existing privilege.
 *     tags:
 *       - Privileges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: privilegeId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 30
 *     responses:
 *       200:
 *         description: Privilege deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Privilege not found
 */
router.delete(
  "/:privilegeId",
  authenticate,
  authorize("PRIVILEGE_DELETE"),
  async (req, res) => {
    try {
      const privilege = await Privilege.findOneAndDelete({
        privilegeId: Number(req.params.privilegeId),
      });

      if (!privilege) {
        return res.status(404).json({
          success: false,
          error: "PRIVILEGE_NOT_FOUND",
          message: "Privilege not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Privilege deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "PRIVILEGE_DELETE_FAILED",
        message: error.message,
      });
    }
  }
);

module.exports = router;