
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const WearableData = require("./models/wearableData.model.js");

dotenv.config();

// Generate 30 players
const players = Array.from({ length: 30 }, (_, index) => ({
  playerId: `USR${String(index + 11).padStart(3, "0")}`,
}));

const generateWearableData = () => {
  const records = [];

  players.forEach((player, index) => {
    // Generate 7 days of wearable data
    for (let day = 6; day >= 0; day--) {
      const recordsPerDay = 5;

      for (let i = 0; i < recordsPerDay; i++) {
        const recordedAt = new Date();

        recordedAt.setDate(recordedAt.getDate() - day);
        recordedAt.setHours(7 + i * 2, 30, 0, 0);

        // Slight player-to-player variation
        const variation = index % 10;

        records.push({
          playerId: player.playerId,

          heartRate: Math.floor(
            70 + Math.random() * 35 + variation
          ),

          steps: Math.floor(
            1500 + Math.random() * 6500
          ),

          calories: Math.floor(
            80 + Math.random() * 450
          ),

          recordedAt,
        });
      }
    }
  });

  return records;
};

const seedWearableData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Clear existing wearable records
    await WearableData.deleteMany({});

    const wearableRecords = generateWearableData();

    await WearableData.insertMany(wearableRecords);

    console.log(
      `Successfully seeded ${wearableRecords.length} wearable records`
    );

    console.log("Players seeded:", players.length);
    console.log("Records per player:", 35);
    console.log("Data duration: 7 days");

  } catch (error) {
    console.error("Error seeding wearable data:", error);
    process.exitCode = 1;

  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  }
};

seedWearableData();
