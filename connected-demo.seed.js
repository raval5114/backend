/**
 * Connected demo seed for the FitLink backend models.
 * Run from any directory with: node <path-to-this-file>
 * Uses BACKEND_ROOT when set, otherwise the supplied project path.
 * Safe to rerun: only records with the DEMO_ prefix are replaced.
 */
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const backendRoot = process.env.BACKEND_ROOT || __dirname;

dotenv.config({
  path: path.join(backendRoot, ".env"),
});
//const mongoose = require(path.join(process.env.BACKEND_ROOT || "D:\\project\\backend", "node_modules", "mongoose"));
//const bcrypt = require(path.join(process.env.BACKEND_ROOT || "D:\\project\\backend", "node_modules", "bcryptjs"));
// const dotenv = require(path.join(process.env.BACKEND_ROOT || "D:\\project\\backend", "node_modules", "dotenv"));
// const backendRoot = process.env.BACKEND_ROOT || "D:\\project\\backend";
// dotenv.config({ path: path.join(backendRoot, ".env") });

const model = (file) => require(path.join(backendRoot, "models", file));
const User = model("user.model.js");
const Player = model("player.data.js");
const Workout = model("workout.model.js");
const TrainingSession = model("session.model.js");
const SessionParticipation = model("sessionParticipation.model.js");
const WorkoutSession = model("player.session.js");
const WorkoutExecution = model("workoutExecution.model.js");
const WatchPairing = model("watchPairing.model.js");
const WearableData = model("wearableData.model.js");
const UserLog = model("user_log.model.js");

const stamp = new Date("2026-10-15T08:00:00.000Z");
const coaches = Array.from({ length: 4 }, (_, i) => ({
  userId: `DEMO_COACH_${String(i + 1).padStart(2, "0")}`,
  username: ["Hari Rawal","Asha Mehta", "Kabir Shah", "Mira Nair", "Arjun Rao"][i],
  email: `coach${i + 1}@demo.fitlink.test`,
  roleId: "ROLE_COACH",
}));
const players = Array.from({ length: 12 }, (_, i) => ({
  userId: `DEMO_PLAYER_${String(i + 1).padStart(2, "0")}`,
  username: ["Bruce Wayne","Diya Patel", "Dev Malhotra", "Anaya Iyer", "Ishaan Gupta", "Sara Khan", "Reyansh Joshi", "Tara Das", "Vivaan Shah", "Kiara Rao", "Aditya Sen", "Myra Kapoor", "Arnav Bose"][i],
  email: `player${i + 1}@demo.fitlink.test`,
  roleId: "ROLE_PLAYER",
}));
const allUsers = [...coaches, ...players];
const playerRows = players.map((u, i) => ({
  playerId: `DEMO_P${String(i + 1).padStart(3, "0")}`,
  userId: u.userId,
  sport: ["football", "cricket", "basketball", "tennis"][i % 4],
  position: ["midfielder", "all-rounder", "guard", "singles"][i % 4],
  age: 18 + (i % 9), height: 160 + (i % 21), weight: 52 + (i % 24),
  dominantSide: i % 3 === 0 ? "left" : "right", isActive: true,
}));
const workouts = Array.from({ length: 8 }, (_, i) => ({
  workoutId: `DEMO_W${String(i + 1).padStart(3, "0")}`,
  name: ["Tempo Run", "Agility Ladder", "Core Circuit", "Interval Ride", "Squat Series", "Passing Drills", "Mobility Flow", "Sprint Repeats"][i],
  description: "Demo training plan for connected seed data.",
  exerciseType: ["running", "agility", "strength", "cycling", "strength", "football", "mobility", "running"][i],
  exerciseTypeId: i + 1, sets: 3 + (i % 2), reps: 8 + i,
  durationSeconds: 300 + i * 60, createdBy: coaches[i % coaches.length].userId, isActive: true,
}));
const sessions = Array.from({ length: 6 }, (_, i) => {
  const assignedPlayers = playerRows.filter((_, p) => p % 3 === i % 3).map((p) => p.playerId);
  const chosenWorkouts = [workouts[i % workouts.length], workouts[(i + 1) % workouts.length]];
  const scheduledAt = new Date(stamp.getTime() + (i + 1) * 86400000);
  return {
    sessionId: `DEMO_S${String(i + 1).padStart(3, "0")}`,
    name: ["Foundation", "Speed and Footwork", "Strength Basics", "Endurance Block", "Skills Practice", "Recovery and Mobility"][i],
    description: "Connected demo session with coach, players, and workout templates.",
    coachId: coaches[i % coaches.length].userId,
    playerIds: assignedPlayers,
    workouts: chosenWorkouts.map((w, j) => ({ workoutId: w.workoutId, name: w.name, exerciseType: w.exerciseType, exerciseTypeId: w.exerciseTypeId, order: j + 1, sets: w.sets, reps: w.reps, durationSeconds: w.durationSeconds })),
    status: "PUBLISHED", scheduledAt, publishedAt: new Date(scheduledAt.getTime() - 3600000),
  };
});
const participations = sessions.flatMap((s) => s.playerIds.map((playerId, i) => ({
  sessionId: s.sessionId, playerId, status: i % 4 === 0 ? "COMPLETED" : "JOINED",
  syncStatus: "SYNCED", invitedAt: new Date(s.scheduledAt.getTime() - 86400000),
  joinedAt: new Date(s.scheduledAt.getTime() - 1800000),
})));
const executions = sessions.flatMap((s) => s.playerIds.map((playerId, i) => {
  const workout = workouts[(Number(s.sessionId.slice(-3)) + i) % workouts.length];
  const startedAt = new Date(s.scheduledAt.getTime() + i * 60000);
  return {
    executionId: `DEMO_EX_${s.sessionId.slice(-3)}_${playerId.slice(-3)}`,
    sessionId: s.sessionId, playerId, workoutId: workout.workoutId,
    exerciseTypeId: workout.exerciseTypeId, attempt: 1, status: "COMPLETED",
    startedAt, completedAt: new Date(startedAt.getTime() + workout.durationSeconds * 1000),
    actualDurationSeconds: workout.durationSeconds, wearableSyncStatus: "SYNCED",
  };
}));
const workoutSessions = executions.map((e, i) => ({
  sessionId: `DEMO_WS_${String(i + 1).padStart(3, "0")}`,
  playerId: e.playerId,
  workoutType: ({ agility: "general", mobility: "general" }[workouts.find((w) => w.workoutId === e.workoutId).exerciseType] || workouts.find((w) => w.workoutId === e.workoutId).exerciseType),
  title: `Activity for ${e.sessionId}`,
  description: "Player activity linked to a scheduled training session and execution.",
  state: "completed", scheduledAt: e.startedAt, startedAt: e.startedAt,
  completedAt: e.completedAt, duration: e.actualDurationSeconds,
  distance: 1.2 + (i % 8) * 0.35, caloriesBurned: 180 + i * 7,
  averageHeartRate: 118 + (i % 25), maxHeartRate: 145 + (i % 30),
  averageSpeed: 7 + (i % 5) * 0.4, maxSpeed: 11 + (i % 4) * 0.5,
}));
const wearableRecords = executions.flatMap((e, i) => [0, 1].map((batch) => {
  const startedAt = new Date(e.startedAt.getTime() + batch * 120000);
  return {
    executionId: e.executionId, sessionId: e.sessionId, playerId: e.playerId,
    source: "WEAR_OS", batchId: `DEMO_BATCH_${batch + 1}`,
    startedAt, endedAt: new Date(startedAt.getTime() + 60000),
    metrics: { durationSeconds: 60, steps: 90 + (i % 40), calories: 8 + (i % 12), distanceMeters: 70 + (i % 90), averageHeartRateBpm: 115 + (i % 30), maxHeartRateBpm: 140 + (i % 35) },
    receivedAt: new Date(startedAt.getTime() + 65000),
  };
}));
const watches = playerRows.map((p, i) => ({
  watchId: `DEMO_WATCH_${String(i + 1).padStart(3, "0")}`,
  pairingTokenHash: `demo-token-hash-${i + 1}`, playerId: p.playerId,
  isPaired: true, expiresAt: null, pairedAt: stamp,
  deviceKeyHash: `demo-device-key-hash-${i + 1}`,
}));
const userLogs = allUsers.map((u, i) => ({
  userId: u.userId, email: u.email, action: i < coaches.length ? "REGISTER" : "LOGIN",
  status: "SUCCESS", ipAddress: `192.0.2.${i + 1}`,
  userAgent: "FitLink Demo Seed", createdAt: stamp, updatedAt: stamp,
}));

async function replaceDemoRecords(Model, key) {
  await Model.deleteMany({ [key]: /^DEMO_/ });
}
async function seed() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured (set it in backend/.env)");
  await mongoose.connect(process.env.MONGO_URI);
  try {
    // Both user.model.js and usser_model.js use the same `users` collection.
    // Write the union of their fields through the native collection to avoid
    // Mongoose's duplicate `User` model registration and satisfy both shapes.
    await User.collection.deleteMany({ userId: /^DEMO_/ });
    const passwordHash = await bcrypt.hash("DemoFitlink@123", 10);
    const userDocs = allUsers.map((u) => ({
      ...u, name: u.username, password: passwordHash, passwordHash,
      mobileNo: `+1555000${String(allUsers.indexOf(u) + 1).padStart(4, "0")}`,
      tokenVersion: 0, refreshToken: null, isActive: true,
      createdAt: stamp, updatedAt: stamp,
    }));
    await User.collection.insertMany(userDocs);

    const rows = [
      [Player, "playerId", playerRows], [Workout, "workoutId", workouts],
      [TrainingSession, "sessionId", sessions], [SessionParticipation, "sessionId", participations],
      [WorkoutSession, "sessionId", workoutSessions], [WorkoutExecution, "executionId", executions],
      [WatchPairing, "watchId", watches], [WearableData, "executionId", wearableRecords],
      [UserLog, "userId", userLogs],
    ];
    for (const [Model, key] of rows) await replaceDemoRecords(Model, key);
    for (const [Model, , docs] of rows) if (docs.length) await Model.insertMany(docs);

    const total = userDocs.length + playerRows.length + workouts.length + sessions.length + participations.length + workoutSessions.length + executions.length + watches.length + wearableRecords.length + userLogs.length;
    console.log(`Seeded ${total} connected demo records across 10 models.`);
    console.log(`Users: ${allUsers.length} (4 coaches, 12 players); sessions: ${sessions.length}; participations: ${participations.length}; executions: ${executions.length}; wearable batches: ${wearableRecords.length}.`);
    console.log("Analytics-ready players (each has sessions, executions, wearable batches, and a paired watch):");
    for (const player of playerRows.slice(0, 4)) {
      const user = allUsers.find((item) => item.userId === player.userId);
      console.log(`- ${user.username} | playerId: ${player.playerId} | userId: ${player.userId} | watchId: ${watches.find((watch) => watch.playerId === player.playerId).watchId}`);
      console.log(`  Analytics: GET /api/analytics/players/${player.playerId}/report?period=custom&startDate=2026-10-16&endDate=2026-10-21`);
    }
    console.log("Demo account password: DemoFitlink@123");
  } finally {
    await mongoose.disconnect();
  }
}
seed().catch((error) => { console.error("Connected seed failed:", error); process.exitCode = 1; });

