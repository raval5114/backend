const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    playerId: {
      type: String,
      required: true,
      index: true,
    },

    workoutType: {
      type: String,
      required: true,
      enum: [
        "running",
        "cycling",
        "strength",
        "cardio",
        "football",
        "cricket",
        "basketball",
        "tennis",
        "general",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      enum: [
        "scheduled",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
      index: true,
    },

    scheduledAt: {
      type: Date,
    },

    startedAt: {
      type: Date,
    },

    pausedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    distance: {
      type: Number,
      default: 0,
      min: 0,
    },

    caloriesBurned: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageHeartRate: {
      type: Number,
      min: 0,
    },

    maxHeartRate: {
      type: Number,
      min: 0,
    },

    averageSpeed: {
      type: Number,
      min: 0,
    },

    maxSpeed: {
      type: Number,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "WorkoutSession",
  workoutSessionSchema
);