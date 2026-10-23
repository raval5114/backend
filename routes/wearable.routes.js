// const WearableData = require("../models/wearable_data.js");

// router.post("/data", async (req, res) => {
//   try {
//     console.log("WEARABLE DATA RECEIVED:");
//     console.log(req.body);

//     const wearableData = await WearableData.create({
//       playerId: req.body.playerId,
//       heartRate: req.body.heartRate,
//       steps: req.body.steps,
//       calories: req.body.calories,
//     });

//     console.log("WEARABLE DATA SAVED TO MONGODB:");
//     console.log(wearableData);

//     return res.status(200).json({
//       success: true,
//       message: "Wearable data received and saved successfully",
//       data: wearableData,
//     });
//   } catch (error) {
//     console.error("ERROR SAVING WEARABLE DATA:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to save wearable data",
//       error: error.message,
//     });
//   }
// });
// // const express = require("express");

// // const router = express.Router();

// // router.post("/data", (req, res) => {
// //   console.log("WEARABLE DATA RECEIVED:");
// //   console.log(req.body);

// //   return res.status(200).json({
// //     success: true,
// //     message: "Wearable data received successfully",
// //     data: req.body,
// //   });
// // });

// // module.exports = router;


// const express = require("express");
// const WearableData = require("../models/wearable_data.js");

// const router = express.Router();

// router.post("/data", async (req, res) => {
//   try {
//     console.log("WEARABLE DATA RECEIVED:");
//     console.log(req.body);

//     const wearableData = await WearableData.create({
//       playerId: req.body.playerId,
//       heartRate: req.body.heartRate,
//       steps: req.body.steps,
//       calories: req.body.calories,
//     });

//     console.log("WEARABLE DATA SAVED TO MONGODB:");
//     console.log(wearableData);

//     return res.status(200).json({
//       success: true,
//       message: "Wearable data received and saved successfully",
//       data: wearableData,
//     });
//   } catch (error) {
//     console.error("ERROR SAVING WEARABLE DATA:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to save wearable data",
//       error: error.message,
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const WearableData = require("../models/wearable_data.js");

const router = express.Router();

// ============================================================
// POST - Save wearable data from the watch
// ============================================================
router.post("/data", async (req, res) => {
  try {
    console.log("1. WEARABLE DATA REQUEST RECEIVED");
    console.log(req.body);

    const { playerId, heartRate, steps, calories } = req.body;

    // Validate required fields
    if (
      !playerId ||
      heartRate === undefined ||
      steps === undefined ||
      calories === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "playerId, heartRate, steps and calories are required",
      });
    }

    // Validate numeric fields
    if (
      !Number.isFinite(Number(heartRate)) ||
      !Number.isFinite(Number(steps)) ||
      !Number.isFinite(Number(calories))
    ) {
      return res.status(400).json({
        success: false,
        message: "heartRate, steps and calories must be numeric",
      });
    }

    console.log("2. SAVING WEARABLE DATA");

    const wearableData = await WearableData.create({
      playerId: String(playerId),
      heartRate: Number(heartRate),
      steps: Number(steps),
      calories: Number(calories),
    });

    console.log("3. WEARABLE DATA SAVED");
    console.log(wearableData);

    return res.status(201).json({
      success: true,
      message: "Wearable data received and saved successfully",
      data: wearableData,
    });
  } catch (error) {
    console.error("SAVE WEARABLE DATA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save wearable data",
      error: error.message,
    });
  }
});

// ============================================================
// GET - Fetch wearable data for a specific player
// ============================================================
router.get("/data/:playerId", async (req, res) => {
  try {
    const { playerId } = req.params;

    console.log(`FETCHING WEARABLE DATA FOR: ${playerId}`);

    const readings = await WearableData.find({
      playerId: playerId,
    })
      .sort({ recordedAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      playerId: playerId,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error("GET WEARABLE DATA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wearable data",
      error: error.message,
    });
  }
});

// ============================================================
// GET - Fetch the latest wearable reading for a player
// ============================================================
router.get("/data/:playerId/latest", async (req, res) => {
  try {
    const { playerId } = req.params;

    const reading = await WearableData.findOne({
      playerId: playerId,
    })
      .sort({ recordedAt: -1 })
      .lean();

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: `No wearable data found for player ${playerId}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    console.error("GET LATEST WEARABLE DATA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest wearable data",
      error: error.message,
    });
  }
});

module.exports = router;
