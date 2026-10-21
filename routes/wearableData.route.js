const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");
const WearableDataService = require("../serivces/wearableData.service");
const router = express.Router();
const sendError = (res, error) => { const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500); return res.status(status).json({ success: false, error: error.code || (status === 409 ? "CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR"), message: status < 500 ? error.message : "Unable to process wearable data" }); };

/** @swagger
 * tags:
 *   name: Wearable Data
 *   description: Idempotent Wear OS summary batch ingestion
 * /api/executions/{executionId}/wearable-data:
 *   post:
 *     summary: Upload a wearable summary batch for the authenticated player's execution
 *     tags: [Wearable Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: executionId, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [batchId, startedAt, endedAt, metrics]
 *             properties:
 *               batchId: { type: string, maxLength: 128 }
 *               startedAt: { type: string, format: date-time }
 *               endedAt: { type: string, format: date-time }
 *               metrics:
 *                 type: object
 *                 properties:
 *                   durationSeconds: { type: number, minimum: 0 }
 *                   steps: { type: number, minimum: 0 }
 *                   calories: { type: number, minimum: 0 }
 *                   distanceMeters: { type: number, minimum: 0 }
 *                   averageHeartRateBpm: { type: number, minimum: 0 }
 *                   maxHeartRateBpm: { type: number, minimum: 0 }
 *     responses:
 *       201: { description: Batch stored }
 *       200: { description: Duplicate batch acknowledged idempotently }
 *       400: { description: Invalid payload }
 *       403: { description: Not the execution owner }
 *       404: { description: Execution not found }
 *   get:
 *     summary: List wearable batches for the authenticated player's execution
 *     tags: [Wearable Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: executionId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Wearable batches returned }
 *       403: { description: Not the execution owner }
 *       404: { description: Execution not found }
 */
router.post("/executions/:executionId/wearable-data", authenticate, authorize("WEARABLE_SYNC"), async (req, res) => { try { const result = await WearableDataService.upload(req.user.userId, req.params.executionId, req.body); return res.status(result.duplicate ? 200 : 201).json({ success: true, duplicate: result.duplicate, data: result.record }); } catch (error) { return sendError(res, error); } });
router.get("/executions/:executionId/wearable-data", authenticate, authorize("WEARABLE_SYNC"), async (req, res) => { try { return res.json({ success: true, data: await WearableDataService.list(req.user.userId, req.params.executionId) }); } catch (error) { return sendError(res, error); } });
module.exports = router;
