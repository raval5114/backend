const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  workoutId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000 },
  exerciseType: { type: String, required: true, trim: true, lowercase: true },
  exerciseTypeId: { type: Number, required: true },
  sets: { type: Number, min: 1 },
  reps: { type: Number, min: 1 },
  durationSeconds: { type: Number, min: 1 },
  createdBy: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Workout", workoutSchema);
