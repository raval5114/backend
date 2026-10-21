const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");
const PlayerService = require("../serivces/player.service");

const router = express.Router();

/** @swagger
 * tags:
 *   name: Players
 *   description: Player profiles and coach roster access
 * /api/players:
 *   get:
 *     summary: List profiles visible to the authenticated user
 *     tags: [Players]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Player profiles and pagination }
 * /api/players/{playerId}:
 *   get:
 *     summary: Get a visible player profile
 *     tags: [Players]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Player profile }
 *       403: { description: Profile is outside the user's roster }
 *   put:
 *     summary: Update an own or administratively managed player profile
 *     tags: [Players]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Player profile updated }
 *   delete:
 *     summary: Deactivate a player profile (administrator)
 *     tags: [Players]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Player profile deactivated }
 * /api/players/users/{userId}/profile:
 *   post:
 *     summary: Create the missing profile for a player account (administrator)
 *     tags: [Players]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Profile ready }
 */

function sendError(res, error) {
  const status = error.statusCode || (error.name === "ValidationError" ? 400 : error.code === 11000 ? 409 : 500);
  return res.status(status).json({
    success: false,
    error: error.code || (status === 409 ? "CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR"),
    message: status < 500 ? error.message : "Unable to process player profile",
  });
}

// Player list access is scoped in the service: players see themselves, coaches
// see their assigned roster, and administrators can see all profiles.
router.get("/", authenticate, authorize("PLAYER_READ"), async (req, res) => {
  try {
    const result = await PlayerService.listForUser(req.user, req.query);
    return res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) { return sendError(res, error); }
});

router.get("/:playerId", authenticate, authorize("PLAYER_READ"), async (req, res) => {
  try { return res.json({ success: true, data: await PlayerService.getForUser(req.user, req.params.playerId) }); }
  catch (error) { return sendError(res, error); }
});

// An administrator can create a missing profile for an existing PLAYER user.
// Normal player registration continues to create its own profile in AuthService.
router.post("/users/:userId/profile", authenticate, authorize("PLAYER_CREATE"), async (req, res) => {
  try {
    const profile = await PlayerService.createForUser(req.params.userId, req.body);
    return res.status(201).json({ success: true, message: "Player profile is ready", data: profile });
  } catch (error) { return sendError(res, error); }
});

router.put("/:playerId", authenticate, authorize("PLAYER_UPDATE"), async (req, res) => {
  try { return res.json({ success: true, message: "Player profile updated", data: await PlayerService.updateForUser(req.user, req.params.playerId, req.body) }); }
  catch (error) { return sendError(res, error); }
});

router.delete("/:playerId", authenticate, authorize("PLAYER_DELETE"), async (req, res) => {
  try { await PlayerService.deactivate(req.params.playerId); return res.json({ success: true, message: "Player profile deactivated" }); }
  catch (error) { return sendError(res, error); }
});

module.exports = router;
