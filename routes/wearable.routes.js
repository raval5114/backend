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

//const express = require("express");

const express = require("express");
const WearableData = require("../models/wearableData.model");
const crypto = require("crypto");
const WatchPairing = require("../models/watchPairing.model");
const Player = require("../models/player.data");
const authenticate = require("../middleware/authentication.middleware");
//const WearableData = require("../models/wearable_data.js");


const router = express.Router();

// Hash a secret before storing or comparing it.
function hashSecret(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Compare hashes without ordinary string comparison.
function verifySecret(value, storedHash) {
  if (!storedHash) return false;

  const receivedHash = Buffer.from(hashSecret(value), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  return (
    receivedHash.length === savedHash.length &&
    crypto.timingSafeEqual(receivedHash, savedHash)
  );
}

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
      metrics:{ 
        heartRate: Number(heartRate),
      steps: Number(steps),
      calories: Number(calories),
    }
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
      .sort({
        receivedAt: -1,
        _id: -1
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Wearable data fetched successfully",
      playerId,
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

// ============================================================
// POST - Register a watch
// ============================================================
/**
 * @swagger
 * /api/wearable/pairing/register:
 *   post:
 *     tags:
 *       - Watch Pairing
 *     summary: Register a wearable watch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - watchId
 *               - deviceKey
 *             properties:
 *               watchId:
 *                 type: string
 *                 example: FITLINK-WATCH-001
 *               deviceKey:
 *                 type: string
 *                 example: test-secret-key-123456789
 *     responses:
 *       201:
 *         description: Watch registered successfully
 *       200:
 *         description: Watch already registered
 *       401:
 *         description: Invalid device credentials
 */
router.post("/pairing/register", async (req, res) => {
  try {
    const { watchId, deviceKey } = req.body;

    if (!watchId || !deviceKey) {
      return res.status(400).json({
        success: false,
        message: "watchId and deviceKey are required",
      });
    }

    const existingWatch = await WatchPairing.findOne({ watchId });

    if (existingWatch) {
      if (!verifySecret(deviceKey, existingWatch.deviceKeyHash)) {
        return res.status(401).json({
          success: false,
          message: "Invalid device credentials",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Watch already registered",
      });
    }

    await WatchPairing.create({
      watchId,
      deviceKeyHash: hashSecret(deviceKey),
      isPaired: false,
    });

    return res.status(201).json({
      success: true,
      message: "Watch registered successfully",
    });
  } catch (error) {
    console.error("WATCH REGISTRATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register watch",
    });
  }
});
// ============================================================
// POST - Generate temporary QR pairing token
// ============================================================
/**
 * @swagger
 * /api/wearable/pairing/generate:
 *   post:
 *     tags:
 *       - Watch Pairing
 *     summary: Generate temporary pairing token
 *     description: Generates a pairing token valid for five minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - watchId
 *               - deviceKey
 *             properties:
 *               watchId:
 *                 type: string
 *                 example: FITLINK-WATCH-001
 *               deviceKey:
 *                 type: string
 *                 example: test-secret-key-123456789
 *     responses:
 *       200:
 *         description: Pairing token generated
 *       401:
 *         description: Invalid device credentials
 */
router.post("/pairing/generate", async (req, res) => {
  try {
    const { watchId, deviceKey } = req.body;

    if (!watchId || !deviceKey) {
      return res.status(400).json({
        success: false,
        message: "watchId and deviceKey are required",
      });
    }

    const watch = await WatchPairing.findOne({ watchId });

    if (!watch || !verifySecret(deviceKey, watch.deviceKeyHash)) {
      return res.status(401).json({
        success: false,
        message: "Invalid device credentials",
      });
    }

    const pairingToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    watch.pairingTokenHash = hashSecret(pairingToken);
    watch.expiresAt = expiresAt;

    await watch.save();

    return res.status(200).json({
      success: true,
      message: "Pairing token generated",
      qrData: JSON.stringify({
        watchId,
        pairingToken,
      }),
      expiresAt,
    });
  } catch (error) {
    console.error("PAIRING TOKEN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate pairing token",
    });
  }
});  
// ============================================================
// POST - Verify QR token and pair watch with player
// ============================================================
/**
 * @swagger
 * /api/wearable/pairing/verify:
 *   post:
 *     tags:
 *       - Watch Pairing
 *     summary: Verify QR token and pair watch with player
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - watchId
 *               - pairingToken
 *             properties:
 *               watchId:
 *                 type: string
 *                 example: FITLINK-WATCH-001
 *               pairingToken:
 *                 type: string
 *                 example: temporary-pairing-token
 *     responses:
 *       200:
 *         description: Watch paired successfully
 *       400:
 *         description: Invalid or expired pairing QR code
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only players can pair a watch
 *       404:
 *         description: Player profile not found
 */
router.post("/pairing/verify", authenticate, async (req, res) => {
  try {
    console.log("GENERATE PAIRING ROUTE HIT");
    const { watchId, pairingToken } = req.body;

    if (!watchId || !pairingToken) {
      return res.status(400).json({
        success: false,
        message: "watchId and pairingToken are required",
      });
    }

    if (req.user.roleId !== "ROLE_PLAYER") {
      return res.status(403).json({
        success: false,
        message: "Only players can pair a watch",
      });
    }

    const player = await Player.findOne({
      userId: req.user.userId,
      isActive: true,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player profile not found",
      });
    }

    const pairedWatch = await WatchPairing.findOneAndUpdate(
      {
        watchId,
        pairingTokenHash: hashSecret(pairingToken),
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          playerId: player.playerId,
          isPaired: true,
          pairedAt: new Date(),
          pairingTokenHash: null,
          expiresAt: null,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pairedWatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired pairing QR code",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Watch paired successfully",
      playerId: player.playerId,
    });
  } catch (error) {
    console.error("WATCH PAIRING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to pair watch",
    });
  }
});
// ============================================================
// POST - Check watch pairing status
// ============================================================
/**
 * @swagger
 * /api/wearable/pairing/status:
 *   post:
 *     tags:
 *       - Watch Pairing
 *     summary: Check watch pairing status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - watchId
 *               - deviceKey
 *             properties:
 *               watchId:
 *                 type: string
 *                 example: FITLINK-WATCH-001
 *               deviceKey:
 *                 type: string
 *                 example: test-secret-key-123456789
 *     responses:
 *       200:
 *         description: Pairing status retrieved successfully
 *       401:
 *         description: Invalid device credentials
 */
router.post("/pairing/status", async (req, res) => {
  try {
    const { watchId, deviceKey } = req.body;

    if (!watchId || !deviceKey) {
      return res.status(400).json({
        success: false,
        message: "watchId and deviceKey are required",
      });
    }

    const watch = await WatchPairing.findOne({ watchId });

    if (!watch || !verifySecret(deviceKey, watch.deviceKeyHash)) {
      return res.status(401).json({
        success: false,
        message: "Invalid device credentials",
      });
    }

    return res.status(200).json({
      success: true,
      isPaired: watch.isPaired,
      playerId: watch.isPaired ? watch.playerId : null,
    });
  } catch (error) {
    console.error("PAIRING STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check pairing status",
    });
  }
});

module.exports = router;
