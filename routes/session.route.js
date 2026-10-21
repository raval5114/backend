const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");
const SessionService = require("../serivces/session.service");
const router = express.Router();
const sendError = (res, error) => { const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500); return res.status(status).json({ success: false, error: error.code || (status === 409 ? "CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR"), message: status < 500 ? error.message : "Unable to process session request" }); };

/** @swagger
 * tags:
 *   name: Sessions
 *   description: Coach plans and player participation
 * /api/sessions:
 *   post:
 *     summary: Create a draft training session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [name], properties: { name: { type: string }, description: { type: string }, scheduledAt: { type: string, format: date-time } } }
 *     responses:
 *       201: { description: Draft created }
 *       401: { description: Authentication required }
 *       403: { description: Insufficient privilege }
 *   get:
 *     summary: List sessions created by the authenticated coach
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: page, schema: { type: integer } }, { in: query, name: limit, schema: { type: integer } }]
 *     responses:
 *       200: { description: Sessions returned }
 * /api/player/sessions:
 *   get:
 *     summary: List sessions assigned to the authenticated player
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Assigned sessions returned }
 *       404: { description: Player profile not found }
 * /api/sessions/{sessionId}:
 *   get:
 *     summary: Retrieve an authorized session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Session returned }
 *       403: { description: Not authorized }
 *       404: { description: Session not found }
 *   patch:
 *     summary: Update a draft session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *               playerIds: { type: array, items: { type: string } }
 *               workouts: { type: array, items: { type: object, required: [workoutId], properties: { workoutId: { type: string }, order: { type: integer }, sets: { type: integer }, reps: { type: integer }, durationSeconds: { type: integer } } } }
 *     responses:
 *       200: { description: Draft updated }
 *       400: { description: Invalid assignment or workout list }
 *       403: { description: Not the owner }
 *       409: { description: Session is not editable }
 * /api/sessions/{sessionId}/publish:
 *   post:
 *     summary: Validate and publish a draft session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Session published and invitations created }
 *       400: { description: Session lacks valid players or workouts }
 *       409: { description: Invalid session state }
 * /api/sessions/{sessionId}/cancel:
 *   post:
 *     summary: Cancel a draft or published session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Session cancelled }
 *       409: { description: Invalid session state }
 * /api/sessions/{sessionId}/join:
 *   post:
 *     summary: Join the authenticated player's invitation
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Participation joined }
 *       404: { description: Invitation not found }
 *       409: { description: Invalid participation state }
 * /api/sessions/{sessionId}/decline:
 *   post:
 *     summary: Decline an invitation
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Invitation declined }
 *       409: { description: Invalid participation state }
 * /api/sessions/{sessionId}/workouts:
 *   get:
 *     summary: Retrieve the ordered workouts for an authorized session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Ordered workout snapshot returned }
 *       403: { description: Not assigned or session owner mismatch }
 * /api/sessions/{sessionId}/sync-status:
 *   patch:
 *     summary: Record player plan synchronization status
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [syncStatus], properties: { syncStatus: { type: string, enum: [PENDING, SYNCED, FAILED] } } }
 *     responses:
 *       200: { description: Sync acknowledgement stored }
 *       404: { description: Joined participation not found }
 * /api/sessions/{sessionId}/progress:
 *   get:
 *     summary: Retrieve participation progress for an owned session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Participation list returned }
 *       403: { description: Not the session owner }
 */
router.post("/sessions", authenticate, authorize("SESSION_CREATE"), async (req, res) => { try { return res.status(201).json({ success: true, data: await SessionService.create(req.user.userId, req.body) }); } catch (error) { return sendError(res, error); } });
router.get("/sessions", authenticate, authorize("SESSION_READ"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.listForCoach(req.user.userId, req.query) }); } catch (error) { return sendError(res, error); } });
router.get("/player/sessions", authenticate, authorize("SESSION_READ"), async (req, res) => { try { const Player = require("../models/player.data"); const player = await Player.findOne({ userId: req.user.userId }).lean(); if (!player) return res.status(404).json({ success: false, error: "PLAYER_NOT_FOUND", message: "Player profile not found" }); return res.json({ success: true, data: await SessionService.listForPlayer(player.playerId, req.query) }); } catch (error) { return sendError(res, error); } });
router.get("/sessions/:sessionId", authenticate, authorize("SESSION_READ"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.get(req.params.sessionId, req.user) }); } catch (error) { return sendError(res, error); } });
router.patch("/sessions/:sessionId", authenticate, authorize("SESSION_CREATE"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.update(req.user.userId, req.params.sessionId, req.body) }); } catch (error) { return sendError(res, error); } });
router.post("/sessions/:sessionId/publish", authenticate, authorize("SESSION_CREATE"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.publish(req.user.userId, req.params.sessionId) }); } catch (error) { return sendError(res, error); } });
router.post("/sessions/:sessionId/cancel", authenticate, authorize("SESSION_CREATE"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.cancel(req.user.userId, req.params.sessionId) }); } catch (error) { return sendError(res, error); } });
router.post("/sessions/:sessionId/join", authenticate, authorize("SESSION_JOIN"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.join(req.user.userId, req.params.sessionId) }); } catch (error) { return sendError(res, error); } });
router.post("/sessions/:sessionId/decline", authenticate, authorize("SESSION_JOIN"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.join(req.user.userId, req.params.sessionId, true) }); } catch (error) { return sendError(res, error); } });
router.get("/sessions/:sessionId/workouts", authenticate, authorize("SESSION_READ"), async (req, res) => { try { const session = await SessionService.get(req.params.sessionId, req.user); return res.json({ success: true, data: session.workouts }); } catch (error) { return sendError(res, error); } });
router.patch("/sessions/:sessionId/sync-status", authenticate, authorize("SESSION_JOIN"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.syncStatus(req.user.userId, req.params.sessionId, req.body.syncStatus) }); } catch (error) { return sendError(res, error); } });
router.get("/sessions/:sessionId/progress", authenticate, authorize("SESSION_READ"), async (req, res) => { try { return res.json({ success: true, data: await SessionService.progress(req.user.userId, req.params.sessionId) }); } catch (error) { return sendError(res, error); } });
module.exports = router;
