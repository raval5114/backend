const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");

const roleService = require("../serivces/role_service");

// ============================================================
// ROLE MANAGEMENT
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role and role-permission management
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     description: Returns all roles configured in the system.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 */
router.get(
  "/",
  authenticate,
  authorize("ROLE_READ"),
  async (req, res) => {
    try {
      const roles = await roleService.getAllRoles();

      return res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "ROLE_FETCH_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/roles/{roleId}:
 *   get:
 *     summary: Get role by ID
 *     description: Returns a specific role and its privileges.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         example: ROLE_COACH
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Role not found
 */
router.get(
  "/:roleId",
  authenticate,
  authorize("ROLE_READ"),
  async (req, res) => {
    try {
      const role = await roleService.getRoleById(req.params.roleId);

      return res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "ROLE_NOT_FOUND",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a role
 *     description: Creates a new role in the RBAC system.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - roleName
 *             properties:
 *               roleId:
 *                 type: string
 *                 example: ROLE_ANALYST
 *               roleName:
 *                 type: string
 *                 example: analyst
 *               privilegesId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [20, 21]
 *     responses:
 *       201:
 *         description: Role created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       400:
 *         description: Invalid role data
 */
router.post(
  "/",
  authenticate,
  authorize("ROLE_CREATE"),
  async (req, res) => {
    try {
      const role = await roleService.createRole(req.body);

      return res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: role,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "ROLE_CREATE_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/roles/{roleId}:
 *   delete:
 *     summary: Delete a role
 *     description: Deletes an existing role.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         example: ROLE_ANALYST
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Role not found
 */
router.delete(
  "/:roleId",
  authenticate,
  authorize("ROLE_DELETE"),
  async (req, res) => {
    try {
      await roleService.deleteRole(req.params.roleId);

      return res.status(200).json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "ROLE_DELETE_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/roles/{roleId}/privileges:
 *   post:
 *     summary: Grant privilege to role
 *     description: Adds a privilege to an existing role.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         example: ROLE_COACH
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - privilegeId
 *             properties:
 *               privilegeId:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       200:
 *         description: Privilege granted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Role or privilege not found
 */
router.post(
  "/:roleId/privileges",
  authenticate,
  authorize("ROLE_PRIVILEGE_GRANT"),
  async (req, res) => {
    try {
      const role = await roleService.grantPrivilege(
        req.params.roleId,
        req.body.privilegeId
      );

      return res.status(200).json({
        success: true,
        message: "Privilege granted successfully",
        data: role,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "PRIVILEGE_GRANT_FAILED",
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/roles/{roleId}/privileges/{privilegeId}:
 *   delete:
 *     summary: Revoke privilege from role
 *     description: Removes a privilege from an existing role.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         example: ROLE_COACH
 *       - in: path
 *         name: privilegeId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 20
 *     responses:
 *       200:
 *         description: Privilege revoked successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ROLE_VIOLATION
 *       404:
 *         description: Role or privilege not found
 */
router.delete(
  "/:roleId/privileges/:privilegeId",
  authenticate,
  authorize("ROLE_PRIVILEGE_REVOKE"),
  async (req, res) => {
    try {
      const role = await roleService.revokePrivilege(
        req.params.roleId,
        Number(req.params.privilegeId)
      );

      return res.status(200).json({
        success: true,
        message: "Privilege revoked successfully",
        data: role,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "PRIVILEGE_REVOKE_FAILED",
        message: error.message,
      });
    }
  }
);

module.exports = router;