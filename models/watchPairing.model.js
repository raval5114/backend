const mongoose = require("mongoose");

const watchPairingSchema = new mongoose.Schema(
  {
    watchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    pairingTokenHash: {
      type: String,
      default: null,
    },

    playerId: {
      type: String,
      default: null,
      index: true,
    },

    isPaired: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    pairedAt: {
      type: Date,
      default: null,
    },
    deviceKeyHash: {
  type: String,
  required: true,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "WatchPairing",
  watchPairingSchema
);