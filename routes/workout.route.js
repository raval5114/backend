const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");
const Catalog = require("../serivces/exerciseCatalog.service");
const WorkoutService = require("../serivces/workout.service");
const router = express.Router();
const sendError = (res, error) => { const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500); return res.status(status).json({ success: false, error: error.code || (status === 409 ? "CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR"), message: status < 500 ? error.message : "Unable to process workout request" }); };

/** @swagger
 * tags:
 *   name: Workouts
 *   description: Exercise catalog and reusable workout templates
 * /api/exercises:
 *   get:
 *     summary: List the approved Android exercise catalog
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Catalog returned }
 *       401: { description: Authentication required }
 * /api/workouts:
 *   get:
 *     summary: List workout templates
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200: { description: Workouts returned }
 *       401: { description: Authentication required }
 *   post:
 *     summary: Create a workout template
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, exerciseTypeId]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               exerciseTypeId: { type: integer, example: 55 }
 *               exerciseType: { type: string, example: running }
 *               sets: { type: integer, minimum: 1 }
 *               reps: { type: integer, minimum: 1 }
 *               durationSeconds: { type: integer, minimum: 1 }
 *     responses:
 *       201: { description: Workout created }
 *       400: { description: Invalid input or unsupported exercise }
 *       401: { description: Authentication required }
 *       403: { description: Insufficient privilege }
 * /api/workouts/{workoutId}:
 *   get:
 *     summary: Retrieve a workout template
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: workoutId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Workout returned }
 *       404: { description: Workout not found }
 *   patch:
 *     summary: Update an owned workout template
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: workoutId, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { name: { type: string }, description: { type: string }, exerciseTypeId: { type: integer }, exerciseType: { type: string }, sets: { type: integer }, reps: { type: integer }, durationSeconds: { type: integer } } }
 *     responses:
 *       200: { description: Workout updated }
 *       403: { description: Not the owner }
 *       404: { description: Workout not found }
 * /api/workouts/{workoutId}/status:
 *   patch:
 *     summary: Activate or deactivate an owned workout
 *     tags: [Workouts]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: workoutId, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [isActive], properties: { isActive: { type: boolean } } }
 *     responses:
 *       200: { description: Workout status updated }
 *       403: { description: Not the owner }
 *       404: { description: Workout not found }
 */
router.get("/exercises", authenticate, authorize("WORKOUT_READ"), (req, res) => res.json({ success: true, data: Catalog.list() }));
router.get("/workouts", authenticate, authorize("WORKOUT_READ"), async (req, res) => { try { return res.json({ success: true, data: await WorkoutService.list(req.query) }); } catch (error) { return sendError(res, error); } });
router.post("/workouts", authenticate, authorize("WORKOUT_CREATE"), async (req, res) => { try { return res.status(201).json({ success: true, message: "Workout created", data: await WorkoutService.create(req.user.userId, req.body) }); } catch (error) { return sendError(res, error); } });
router.get("/workouts/:workoutId", authenticate, authorize("WORKOUT_READ"), async (req, res) => { try { const canReadInactive = ["admin", "coach"].includes(req.userRole?.roleName); return res.json({ success: true, data: await WorkoutService.get(req.params.workoutId, canReadInactive) }); } catch (error) { return sendError(res, error); } });
router.patch("/workouts/:workoutId", authenticate, authorize("WORKOUT_UPDATE"), async (req, res) => { try { return res.json({ success: true, data: await WorkoutService.update(req.user.userId, req.params.workoutId, req.body) }); } catch (error) { return sendError(res, error); } });
router.patch("/workouts/:workoutId/status", authenticate, authorize("WORKOUT_UPDATE"), async (req, res) => { try { return res.json({ success: true, data: await WorkoutService.setActive(req.user.userId, req.params.workoutId, req.body.isActive) }); } catch (error) { return sendError(res, error); } });
module.exports = router;
