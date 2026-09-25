const express = require("express");
const authRouter = express.Router();
const authenticate = require("../middleware/authentication.middleware");

const AuthService = require("../serivces/auth_service");
const authService = new AuthService()
// ============================================================
// AUTHENTICATION
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and JWT token management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - roleId
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               mobileNo:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               roleId:
 *                 type: string
 *                 example: ROLE_PLAYER
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request or user already exists
 *       500:
 *         description: Internal server error
 */
authRouter.post("/register", async (req, res) => {
  try {
    const result = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "REGISTRATION_FAILED",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns access and refresh tokens.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 format: email or mobileno
 *                 example: john@example.com or 1234567890
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: User account is inactive
 *       500:
 *         description: Internal server error
 */
authRouter.post("/login", async (req, res) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "LOGIN_FAILED",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIs...
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */
authRouter.post("/refresh-token", async (req, res) => {
  try {
    const result = await authService.generateRefreshToken(req.body.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "REFRESH_TOKEN_FAILED",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidates the authenticated user's refresh token.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Authentication required or invalid access token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
authRouter.post("/logout", authenticate, async (req, res) => {
  try {
    await authService.logout(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "LOGOUT_FAILED",
      message: error.message,
    });
  }
});


module.exports = authRouter;