const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Privilege = require("../models/privilege.model");
const Player = require("../models/player.data");
const Assignment = require("../models/coachPlayerAssignment.model");
const AnalyticsService = require("../serivces/analytics.service");
const router = require("../routes/analytics.routes");

test("analytics routes enforce authentication, RBAC and player scope", async () => {
  const previousSecret = process.env.JWT_ACCESS_SECRET;
  const saved = {
    userFindOne: User.findOne,
    roleFindOne: Role.findOne,
    privilegeFindOne: Privilege.findOne,
    playerFindOne: Player.findOne,
    assignmentExists: Assignment.exists,
  };
  const analyticsMethods = [
    "getOverview", "getActivityAnalytics", "getHeartRateAnalytics", "getDurationAnalytics",
    "getConsistencyAnalytics", "getProgressAnalytics", "getAnalyticsReport",
  ];
  const savedAnalytics = Object.fromEntries(analyticsMethods.map((name) => [name, AnalyticsService[name]]));
  const users = new Map([
    ["PLAYER-1", { userId: "PLAYER-1", roleId: "ROLE_PLAYER", tokenVersion: 0, isActive: true }],
    ["PLAYER-2", { userId: "PLAYER-2", roleId: "ROLE_PLAYER", tokenVersion: 0, isActive: true }],
    ["COACH-1", { userId: "COACH-1", roleId: "ROLE_COACH", tokenVersion: 0, isActive: true }],
    ["ADMIN-1", { userId: "ADMIN-1", roleId: "ROLE_ADMIN", tokenVersion: 0, isActive: true }],
  ]);
  const players = new Map([
    ["PLY-1", { playerId: "PLY-1", userId: "PLAYER-1" }],
    ["PLY-2", { playerId: "PLY-2", userId: "PLAYER-2" }],
  ]);
  try {
    process.env.JWT_ACCESS_SECRET = "analytics-route-test-secret";
    User.findOne = async ({ userId }) => users.get(userId) || null;
    Role.findOne = async ({ roleId }) => ({
      roleId,
      roleName: roleId === "ROLE_ADMIN" ? "admin" : roleId === "ROLE_COACH" ? "coach" : "player",
      privilegesId: [20],
    });
    Privilege.findOne = async () => ({ privilegeId: 20, privilegeName: "PLAYER_READ" });
    Player.findOne = ({ playerId }) => ({ lean: async () => players.get(playerId) || null });
    Assignment.exists = async ({ coachId, playerId }) => coachId === "COACH-1" && playerId === "PLY-1";
    for (const name of analyticsMethods) AnalyticsService[name] = async ({ playerId }) => ({ playerId, section: name });

    const tokenFor = (userId) => jwt.sign({ userId, tokenVersion: 0 }, process.env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
    async function call(playerId, { userId, query = {}, authenticated = true } = {}) {
      const route = router.stack.find((layer) => layer.route?.path === "/players/:playerId/overview");
      const handlers = route.route.stack.map((layer) => layer.handle);
      const req = {
        method: "GET",
        headers: authenticated ? { authorization: `Bearer ${tokenFor(userId)}` } : {},
        params: { playerId },
        query,
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; this.sent = true; return this; },
      };
      for (const handler of handlers) {
        let nextCalled = false;
        await handler(req, res, (error) => {
          if (error) throw error;
          nextCalled = true;
        });
        if (res.sent || !nextCalled) break;
      }
      return res;
    }

    const unauthenticated = await call("PLY-1", { authenticated: false });
    assert.equal(unauthenticated.statusCode, 401);

    const ownPlayer = await call("PLY-1", { userId: "PLAYER-1", query: { period: "daily", startDate: "2026-11-11" } });
    assert.equal(ownPlayer.statusCode, 200);
    assert.equal(ownPlayer.body.data.playerId, "PLY-1");

    const otherPlayer = await call("PLY-2", { userId: "PLAYER-1", query: { period: "daily", startDate: "2026-11-11" } });
    assert.equal(otherPlayer.statusCode, 403);

    const assignedCoach = await call("PLY-1", { userId: "COACH-1", query: { period: "daily", startDate: "2026-11-11" } });
    assert.equal(assignedCoach.statusCode, 200);

    const unassignedCoach = await call("PLY-2", { userId: "COACH-1", query: { period: "daily", startDate: "2026-11-11" } });
    assert.equal(unassignedCoach.statusCode, 403);

    const admin = await call("PLY-2", { userId: "ADMIN-1", query: { period: "daily", startDate: "2026-11-11" } });
    assert.equal(admin.statusCode, 200);

    const invalidDate = await call("PLY-1", { userId: "ADMIN-1", query: { period: "custom", startDate: "2026-12-02", endDate: "2026-12-01" } });
    assert.equal(invalidDate.statusCode, 400);
  } finally {
    User.findOne = saved.userFindOne;
    Role.findOne = saved.roleFindOne;
    Privilege.findOne = saved.privilegeFindOne;
    Player.findOne = saved.playerFindOne;
    Assignment.exists = saved.assignmentExists;
    for (const name of analyticsMethods) AnalyticsService[name] = savedAnalytics[name];
    if (previousSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = previousSecret;
  }
});
