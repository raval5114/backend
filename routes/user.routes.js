const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");

const UserService = require("../serivces/user_service");
const userService = new UserService();
// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Returns a list of all registered users.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient privileges
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticate,
  authorize("USER_READ"),
  async (req, res) => {
    try {
      const users = await userService.getAllUsers();

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "USER_FETCH_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns a specific user using their user ID.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: USER_001
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient privileges
 *       404:
 *         description: User not found
 */
router.get(
  "/:userId",
  authenticate,
  authorize("USER_READ"),
  async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}/role:
 *   put:
 *     summary: Assign role to user
 *     description: Assigns a role to an existing user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: USER_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *                 example: ROLE_COACH
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: User or role not found
 */
router.put(
  "/:userId/role",
  authenticate,
  authorize("USER_ROLE_ASSIGN"),
  async (req, res) => {
    try {
      const user = await userService.assignRole(
        req.params.userId,
        req.body.roleId
      );

      return res.status(200).json({
        success: true,
        message: "Role assigned successfully",
        data: user,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "ROLE_ASSIGNMENT_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}/role:
 *   delete:
 *     summary: Revoke user role
 *     description: Removes the current role and assigns the default player role.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: USER_001
 *     responses:
 *       200:
 *         description: Role revoked successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: User not found
 */
router.delete(
  "/:userId/role",
  authenticate,
  authorize("USER_ROLE_REVOKE"),
  async (req, res) => {
    try {
      const user = await userService.revokeRole(req.params.userId);

      return res.status(200).json({
        success: true,
        message: "Role revoked successfully",
        data: user,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "ROLE_REVOKE_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}/status:
 *   patch:
 *     summary: Update user status
 *     description: Activates or deactivates a user account.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: USER_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: User not found
 */
router.patch(
  "/:userId/status",
  authenticate,
  authorize("USER_STATUS_UPDATE"),
  async (req, res) => {
    try {
      const user = await userService.updateStatus(
        req.params.userId,
        req.body.isActive
      );

      return res.status(200).json({
        success: true,
        message: "User status updated successfully",
        data: user,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "STATUS_UPDATE_FAILED",
        message: error.message,
      });
    }
  }
);

module.exports = router;