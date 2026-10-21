const mongoose = require("mongoose");

const workoutSnapshotSchema = new mongoose.Schema({
  workoutId: { type: String, required: true },
  name: { type: String, required: true },
  exerciseType: { type: String, required: true },
  exerciseTypeId: { type: Number, required: true },
  order: { type: Number, required: true, min: 1 },
  sets: { type: Number, min: 1 },
  reps: { type: Number, min: 1 },
  durationSeconds: { type: Number, min: 1 },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000 },
  coachId: { type: String, required: true, index: true },
  playerIds: { type: [String], default: [] },
  workouts: { type: [workoutSnapshotSchema], default: [] },
  status: { type: String, enum: ["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"], default: "DRAFT", index: true },
  scheduledAt: Date,
  publishedAt: Date,
  cancelledAt: Date,
}, { timestamps: true });

sessionSchema.index({ coachId: 1, createdAt: -1 });
module.exports = mongoose.model("TrainingSession", sessionSchema);
