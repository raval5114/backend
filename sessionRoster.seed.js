const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("./models/user.model");
const Player = require("./models/player.data");
const CoachPlayerAssignment = require("./models/coachPlayerAssignment.model");

dotenv.config();

const coachUserIds = Array.from({ length: 8 }, (_, index) =>
  `USR${String(index + 3).padStart(3, "0")}`
);
const playerUserIds = Array.from({ length: 30 }, (_, index) =>
  `USR${String(index + 11).padStart(3, "0")}`
);

async function seedSessionRoster() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const [admin, coaches, playerUsers] = await Promise.all([
    User.findOne({ userId: "USR000", roleId: "ROLE_ADMIN", isActive: true }).lean(),
    User.find({ userId: { $in: coachUserIds }, roleId: "ROLE_COACH", isActive: true })
      .select("userId")
      .lean(),
    User.find({ userId: { $in: playerUserIds }, roleId: "ROLE_PLAYER", isActive: true })
      .select("userId")
      .sort({ userId: 1 })
      .lean(),
  ]);

  if (!admin) throw new Error("Seed admin USR000 was not found");
  if (coaches.length !== coachUserIds.length) {
    throw new Error("Expected all seeded active coach users USR003-USR010");
  }
  if (playerUsers.length !== playerUserIds.length) {
    throw new Error("Expected all seeded active player users USR011-USR040");
  }

  const profiles = [];
  for (const user of playerUsers) {
    const number = Number(user.userId.slice(3)) - 10;
    const profile = await Player.findOneAndUpdate(
      { userId: user.userId },
      {
        $setOnInsert: {
          playerId: `P${String(number).padStart(3, "0")}`,
          userId: user.userId,
          sport: "general",
          isActive: true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    profiles.push(profile);
  }

  for (const [index, profile] of profiles.entries()) {
    const coachId = coaches[index % coaches.length].userId;
    await CoachPlayerAssignment.updateOne(
      { coachId, playerId: profile.playerId },
      {
        $setOnInsert: {
          coachId,
          playerId: profile.playerId,
          assignedBy: admin.userId,
        },
      },
      { upsert: true, runValidators: true }
    );
  }

  console.log(
    `Session roster ready: ${profiles.length} player profiles assigned across ${coaches.length} coaches.`
  );
}

seedSessionRoster()
  .catch((error) => {
    console.error("Session roster seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
