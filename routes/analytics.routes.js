const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");
const Player = require("../models/player.data");
const CoachPlayerAssignment = require("../models/coachPlayerAssignment.model");
const AnalyticsService = require("../serivces/analytics.service");
const AnalyticsContract = require("../serivces/analytics.contract");

const router = express.Router();
const ROLE_PLAYER = "ROLE_PLAYER";
const ROLE_COACH = "ROLE_COACH";
const ROLE_ADMIN = "ROLE_ADMIN";

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Player-scoped descriptive wearable and workout analytics
 * /api/analytics/players/{playerId}/overview:
 *   get:
 *     summary: Get an analytics overview for an authorized player
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *       - { $ref: '#/components/parameters/AnalyticsPeriod' }
 *       - { $ref: '#/components/parameters/AnalyticsStartDate' }
 *       - { $ref: '#/components/parameters/AnalyticsEndDate' }
 *       - { $ref: '#/components/parameters/AnalyticsTimezone' }
 *     responses:
 *       200: { description: Overview returned }
 *       400: { description: Invalid period, date range or timezone }
 *       401: { description: Authentication required }
 *       403: { description: Player is outside the caller's access scope }
 *       404: { description: Player not found }
 *       409: { description: Stored wearable intervals overlap or use an unsupported contract }
 * /api/analytics/players/{playerId}/activity:
 *   get:
 *     summary: Get steps, distance, calorie and duration trends
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *       - { $ref: '#/components/parameters/AnalyticsPeriod' }
 *       - { $ref: '#/components/parameters/AnalyticsStartDate' }
 *       - { $ref: '#/components/parameters/AnalyticsEndDate' }
 *       - { $ref: '#/components/parameters/AnalyticsTimezone' }
 *       - { in: query, name: groupBy, schema: { type: string, enum: [daily, weekly, monthly] } }
 *     responses:
 *       200: { description: Activity trends returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Player is outside the caller's access scope }
 *       404: { description: Player not found }
 *       409: { description: Stored wearable intervals overlap or use an unsupported contract }
 * /api/analytics/players/{playerId}/heart-rate:
 *   get:
 *     summary: Get recorded average and maximum heart-rate analytics
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *       - { $ref: '#/components/parameters/AnalyticsPeriod' }
 *       - { $ref: '#/components/parameters/AnalyticsStartDate' }
 *       - { $ref: '#/components/parameters/AnalyticsEndDate' }
 *       - { $ref: '#/components/parameters/AnalyticsTimezone' }
 *     responses:
 *       200: { description: Recorded heart-rate analytics returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Player is outside the caller's access scope }
 *       404: { description: Player not found }
 *       409: { description: Stored wearable intervals overlap or use an unsupported contract }
 * /api/analytics/players/{playerId}/duration:
 *   get:
 *     summary: Get execution duration analytics
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *       - { $ref: '#/components/parameters/AnalyticsPeriod' }
 *       - { $ref: '#/components/parameters/AnalyticsStartDate' }
 *       - { $ref: '#/components/parameters/AnalyticsEndDate' }
 *       - { $ref: '#/components/parameters/AnalyticsTimezone' }
 *     responses:
 *       200: { description: Duration analytics returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Player is outside the caller's access scope }
 *       404: { description: Player not found }
 *       409: { description: Stored wearable intervals overlap or use an unsupported contract }
 * /api/analytics/players/{playerId}/consistency:
 *   get:
 *     summary: Get activity days, execution counts and streaks
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *       - { $ref: '#/components/parameters/AnalyticsPeriod' }
 *       - { $ref: '#/components/parameters/AnalyticsStartDate' }
 *       - { $ref: '#/components/parameters/AnalyticsEndDate' }
 *       - { $ref: '#/components/parameters/AnalyticsTimezone' }
 *     responses:
 *       200: { description: Consistency analytics returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Player is outside the caller's access scope }
 *       404: { description: Player not found }
 *       409: { description: Stored wearable intervals overlap or use an unsupported contract }
 * /api/analytics/players/{playerId}/progress:
 *   get:
 *     summary: Compare a period with the preceding calendar period
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *       - { $ref: '#/components/parameters/AnalyticsPeriod' }
 *       - { $ref: '#/components/parameters/AnalyticsStartDate' }
 *       - { $ref: '#/components/parameters/AnalyticsEndDate' }
 *       - { $ref: '#/components/parameters/AnalyticsTimezone' }
 *     responses:
 *       200: { description: Period comparison returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Player is outside the caller's access scope }
 *       404: { description: Player not found }
 *       409: { description: Stored wearable intervals overlap or use an unsupported contract }
 * /api/analytics/players/{playerId}/report:
 *   get:
 *     summary: Get the combined analytics report
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: playerId, required: true, schema: { type: string } }
 *       - { $ref: '#/components/parameters/AnalyticsPeriod' }
 *       - { $ref: '#/components/parameters/AnalyticsStartDate' }
 *       - { $ref: '#/components/parameters/AnalyticsEndDate' }
 *       - { $ref: '#/components/parameters/AnalyticsTimezone' }
 *       - { in: query, name: groupBy, schema: { type: string, enum: [daily, weekly, monthly] } }
 *     responses:
 *       200: { description: Combined analytics report returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Player is outside the caller's access scope }
 *       404: { description: Player not found }
 *       409: { description: Stored wearable intervals overlap or use an unsupported contract }
 * components:
 *   parameters:
 *     AnalyticsPeriod:
 *       in: query
 *       name: period
 *       required: true
 *       schema: { type: string, enum: [daily, weekly, monthly, custom] }
 *     AnalyticsStartDate:
 *       in: query
 *       name: startDate
 *       required: false
 *       description: YYYY-MM-DD. Required with custom; anchors other periods.
 *       schema: { type: string, format: date }
 *     AnalyticsEndDate:
 *       in: query
 *       name: endDate
 *       required: false
 *       description: Inclusive YYYY-MM-DD for custom periods; internal query end is exclusive.
 *       schema: { type: string, format: date }
 *     AnalyticsTimezone:
 *       in: query
 *       name: timezone
 *       required: false
 *       description: Valid IANA timezone; defaults to UTC until player timezone storage exists.
 *       schema: { type: string, example: Asia/Kolkata }
 */

function sendError(res, error) {
  const status = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  return res.status(status).json({
    success: false,
    error: error.code || (status === 400 ? "VALIDATION_ERROR" : status === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR"),
    message: status < 500 ? error.message : "Unable to retrieve analytics",
  });
}

async function authorizePlayerScope(req) {
  const player = await Player.findOne({ playerId: req.params.playerId }).lean();
  if (!player) {
    throw Object.assign(new Error("Player not found"), { code: "PLAYER_NOT_FOUND", statusCode: 404 });
  }

  if (req.user.roleId === ROLE_ADMIN) return player;
  if (req.user.roleId === ROLE_PLAYER && player.userId === req.user.userId) return player;
  if (req.user.roleId === ROLE_COACH && await CoachPlayerAssignment.exists({ coachId: req.user.userId, playerId: player.playerId })) return player;

  throw Object.assign(new Error("You cannot access analytics for this player"), { code: "FORBIDDEN", statusCode: 403 });
}

function buildServiceOptions(req) {
  const period = req.query.period;
  const timezone = req.query.timezone || AnalyticsContract.timezoneFallback;
  // Validate the full date and timezone contract before reaching the service.
  AnalyticsService._internals.resolveDateRange({
    period,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    timezone,
  });

  return {
    playerId: req.params.playerId,
    period,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    timezone,
    groupBy: req.query.groupBy,
    // This contract is server-controlled. The client cannot choose how
    // wearable records are interpreted.
    batchSemantics: AnalyticsContract.batchSemantics,
    durationSemantics: AnalyticsContract.durationSemantics,
  };
}

function endpoint(method) {
  return async (req, res) => {
    try {
      await authorizePlayerScope(req);
      const result = await AnalyticsService[method](buildServiceOptions(req));
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return sendError(res, error);
    }
  };
}

const analyticsAccess = [authenticate, authorize("PLAYER_READ")];
router.get("/players/:playerId/overview", ...analyticsAccess, endpoint("getOverview"));
router.get("/players/:playerId/activity", ...analyticsAccess, endpoint("getActivityAnalytics"));
router.get("/players/:playerId/heart-rate", ...analyticsAccess, endpoint("getHeartRateAnalytics"));
router.get("/players/:playerId/duration", ...analyticsAccess, endpoint("getDurationAnalytics"));
router.get("/players/:playerId/consistency", ...analyticsAccess, endpoint("getConsistencyAnalytics"));
router.get("/players/:playerId/progress", ...analyticsAccess, endpoint("getProgressAnalytics"));
router.get("/players/:playerId/report", ...analyticsAccess, endpoint("getAnalyticsReport"));

module.exports = router;
module.exports._internals = { authorizePlayerScope, buildServiceOptions, sendError };
