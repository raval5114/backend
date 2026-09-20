const express = require("express");
const Player = require("../models/player_data.js");

const router = express.Router();

// ========================================
// CREATE PLAYER
// POST /api/players
// ========================================

router.post("/", async (req, res) => {
  try {
    const player = await Player.create(req.body);

    res.status(201).json({
      success: true,
      message: "Player created successfully",
      data: player,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// GET ALL PLAYERS
// GET /api/players
// ========================================

router.get("/", async (req, res) => {
  try {
    const players = await Player.find();

    res.status(200).json({
      success: true,
      count: players.length,
      data: players,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// GET PLAYER BY PLAYER ID
// GET /api/players/:playerId
// ========================================

router.get("/:playerId", async (req, res) => {
  try {
    const player = await Player.findOne({
      playerId: req.params.playerId,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    res.status(200).json({
      success: true,
      data: player,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// UPDATE PLAYER
// PUT /api/players/:playerId
// ========================================

router.put("/:playerId", async (req, res) => {
  try {
    const player = await Player.findOneAndUpdate(
      {
        playerId: req.params.playerId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Player updated successfully",
      data: player,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// DELETE PLAYER
// DELETE /api/players/:playerId
// ========================================

router.delete("/:playerId", async (req, res) => {
  try {
    const player = await Player.findOneAndDelete({
      playerId: req.params.playerId,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Player deleted successfully",
      data: player,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;