const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");
const AssignmentService = require("../serivces/coachPlayerAssignment.service");
const router = express.Router();
const sendError = (res, error) => { const status = error.statusCode || (error.name === "ValidationError" ? 400 : error.code === 11000 ? 409 : 500); return res.status(status).json({ success: false, error: error.code || (status === 409 ? "CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR"), message: status < 500 ? error.message : "Unable to process coach-player assignment" }); };

/** @swagger
 * tags:
 *   name: Coach Player Assignments
 *   description: Admin-managed coach roster scope
 * /api/admin/coaches/{coachId}/players/{playerId}:
 *   put:
 *     summary: Assign an active player to a coach
 *     tags: [Coach Player Assignments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: coachId, required: true, schema: { type: string } }
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Assignment created or returned idempotently }
 *       401: { description: Authentication required }
 *       403: { description: Admin privilege required }
 *       404: { description: Coach or player not found }
 *   delete:
 *     summary: Remove a player from a coach's managed roster
 *     tags: [Coach Player Assignments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: coachId, required: true, schema: { type: string } }
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Assignment removed }
 *       404: { description: Assignment not found }
 */
router.get("/coaches/:coachId/players", authenticate, authorize("COACH_PLAYER_ASSIGN"), async (req, res) => { try { return res.json({ success: true, data: await AssignmentService.list(req.params.coachId) }); } catch (error) { return sendError(res, error); } });
router.put("/coaches/:coachId/players/:playerId", authenticate, authorize("COACH_PLAYER_ASSIGN"), async (req, res) => { try { return res.json({ success: true, data: await AssignmentService.create(req.params.coachId, req.params.playerId, req.user.userId) }); } catch (error) { return sendError(res, error); } });
router.delete("/coaches/:coachId/players/:playerId", authenticate, authorize("COACH_PLAYER_ASSIGN"), async (req, res) => { try { await AssignmentService.remove(req.params.coachId, req.params.playerId); return res.json({ success: true, message: "Coach/player assignment removed" }); } catch (error) { return sendError(res, error); } });
module.exports = router;
