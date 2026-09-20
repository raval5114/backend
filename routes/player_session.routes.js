const express = require("express");
const WorkoutSession = require("../models/WorkoutSession");
const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const session = await WorkoutSession.create(req.body);

    res.status(201).json({
      success: true,
      message: "Workout session created successfully",
      data: session,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/", async (req, res) => {
  try {
    const sessions = await WorkoutSession.find();

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/player/:playerId", async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      playerId: req.params.playerId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/:sessionId", async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found",
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.put("/:sessionId", async (req, res) => {
  try {
    const session = await WorkoutSession.findOneAndUpdate(
      {
        sessionId: req.params.sessionId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout session updated successfully",
      data: session,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.patch("/:sessionId/start", async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found",
      });
    }

    if (
      session.state !== "scheduled" &&
      session.state !== "paused"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot start workout from ${session.state} state`,
      });
    }

    session.state = "active";

    if (!session.startedAt) {
      session.startedAt = new Date();
    }

    session.pausedAt = null;

    await session.save();

    res.status(200).json({
      success: true,
      message: "Workout started",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.patch("/:sessionId/pause", async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found",
      });
    }

    if (session.state !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active workouts can be paused",
      });
    }

    session.state = "paused";
    session.pausedAt = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: "Workout paused",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.patch("/:sessionId/complete", async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found",
      });
    }

    if (
      session.state !== "active" &&
      session.state !== "paused"
    ) {
      return res.status(400).json({
        success: false,
        message: "Workout cannot be completed from current state",
      });
    }

    session.state = "completed";
    session.completedAt = new Date();

    if (session.startedAt) {
      session.duration =
        Math.floor(
          (session.completedAt - session.startedAt) / 1000
        );
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: "Workout completed",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}); 
router.patch("/:sessionId/cancel", async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found",
      });
    }

    if (
      session.state === "completed" ||
      session.state === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${session.state} workout`,
      });
    }

    session.state = "cancelled";
    session.cancelledAt = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: "Workout cancelled",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.delete("/:sessionId", async (req, res) => {
  try {
    const session = await WorkoutSession.findOneAndDelete({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout session deleted successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

modules.exports = router;