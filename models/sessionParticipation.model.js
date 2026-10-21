const mongoose = require("mongoose");

const participationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  playerId: { type: String, required: true },
  status: { type: String, enum: ["INVITED", "JOINED", "DECLINED", "COMPLETED", "CANCELLED"], default: "INVITED" },
  syncStatus: { type: String, enum: ["NOT_SYNCED", "PENDING", "SYNCED", "FAILED"], default: "NOT_SYNCED" },
  invitedAt: { type: Date, default: Date.now },
  joinedAt: Date,
}, { timestamps: true });

participationSchema.index({ sessionId: 1, playerId: 1 }, { unique: true });
participationSchema.index({ playerId: 1, status: 1, updatedAt: -1 });
module.exports = mongoose.model("SessionParticipation", participationSchema);
