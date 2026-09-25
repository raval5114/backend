const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    playerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    sport: {
      type: String,
      required: true,
      enum: [
        "football",
        "cricket",
        "basketball",
        "tennis",
        "general",
      ],
    },

    position: {
      type: String,
      trim: true,
    },

    age: {
      type: Number,
      min: 5,
      max: 100,
    },

    height: {
      type: Number,
      min: 30,
      max: 300,
    },

    weight: {
      type: Number,
      min: 1,
      max: 500,
    },

    dominantSide: {
      type: String,
      enum: ["left", "right", "both"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Player", playerSchema);