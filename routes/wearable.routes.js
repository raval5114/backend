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

router.post("/data", async (req, res) => {
  try {
    console.log("1. REQUEST RECEIVED");
    console.log(req.body);

    console.log("2. ABOUT TO SAVE TO MONGODB");

    const wearableData = await WearableData.create({
      playerId: req.body.playerId,
      heartRate: req.body.heartRate,
      steps: req.body.steps,
      calories: req.body.calories,
    });

    console.log("3. SAVED TO MONGODB");
    console.log(wearableData);

    return res.status(200).json({
      success: true,
      message: "Wearable data received and saved successfully",
      data: wearableData,
    });

  } catch (error) {
    console.error("4. ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save wearable data",
      error: error.message,
    });
  }
});


// GET - Fetch wearable data for a player
router.get("/data/:playerId", async (req, res) => {
  try {
    const data = await WearableData.find({
      playerId: req.params.playerId,
    }).sort({ recordedAt: 1 });

    return res.status(200).json({
      success: true,
      data: data,
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


module.exports = router;