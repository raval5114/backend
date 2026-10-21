const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");
const ExecutionService = require("../serivces/execution.service");
const router = express.Router();
const sendError = (res, error) => { const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500); return res.status(status).json({ success: false, error: error.code || (status === 409 ? "CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR"), message: status < 500 ? error.message : "Unable to process execution request" }); };

/** @swagger
 * tags:
 *   name: Executions
 *   description: Per-player workout attempts
 * /api/sessions/{sessionId}/workouts/{workoutId}/start:
 *   post:
 *     summary: Start or return the active execution for a joined player
 *     tags: [Executions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string } }
 *       - { in: path, name: workoutId, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Execution started }
 *       200: { description: Existing active execution returned }
 *       403: { description: Join required }
 *       404: { description: Session or workout not found }
 * /api/executions/{executionId}:
 *   get:
 *     summary: Retrieve the authenticated player's execution
 *     tags: [Executions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: executionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Execution returned }
 *       403: { description: Not the execution owner }
 *       404: { description: Execution not found }
 * /api/executions/{executionId}/pause:
 *   post:
 *     summary: Pause an active execution
 *     tags: [Executions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: executionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Execution paused }
 *       409: { description: Invalid state transition }
 * /api/executions/{executionId}/resume:
 *   post:
 *     summary: Resume a paused execution
 *     tags: [Executions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: executionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Execution resumed }
 *       409: { description: Invalid state transition }
 * /api/executions/{executionId}/complete:
 *   post:
 *     summary: Complete an execution
 *     tags: [Executions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: executionId, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { actualDurationSeconds: { type: number, minimum: 0 } } }
 *     responses:
 *       200: { description: Execution completed }
 *       409: { description: Invalid state transition }
 * /api/executions/{executionId}/skip:
 *   post:
 *     summary: Skip an in-progress execution
 *     tags: [Executions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: executionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Execution skipped }
 *       409: { description: Invalid state transition }
 */
router.post("/sessions/:sessionId/workouts/:workoutId/start", authenticate, authorize("EXECUTION_MANAGE"), async (req, res) => { try { const result = await ExecutionService.start(req.user.userId, req.params.sessionId, req.params.workoutId); return res.status(result.created ? 201 : 200).json({ success: true, data: result.execution }); } catch (error) { return sendError(res, error); } });
router.get("/executions/:executionId", authenticate, authorize("EXECUTION_MANAGE"), async (req, res) => { try { return res.json({ success: true, data: await ExecutionService.get(req.user.userId, req.params.executionId) }); } catch (error) { return sendError(res, error); } });
for (const action of ["pause", "resume", "complete", "skip"]) {
  router.post(`/executions/:executionId/${action}`, authenticate, authorize("EXECUTION_MANAGE"), async (req, res) => {
    try { const item = await ExecutionService.transition(req.user.userId, req.params.executionId, action, req.body.actualDurationSeconds); return res.json({ success: true, data: item }); }
    catch (error) { return sendError(res, error); }
  });
}
module.exports = router;
