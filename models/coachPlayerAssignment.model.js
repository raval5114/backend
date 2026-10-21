const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  // These are the application's stable business IDs (User.userId and
  // Player.playerId), rather than Mongo document ObjectIds.
  coachId: { type: String, required: true, trim: true, index: true },
  playerId: { type: String, required: true, trim: true, index: true },
  assignedBy: { type: String, required: true, trim: true },
}, { timestamps: true, strict: "throw" });

assignmentSchema.index({ coachId: 1, playerId: 1 }, { unique: true });
module.exports = mongoose.model("CoachPlayerAssignment", assignmentSchema);
