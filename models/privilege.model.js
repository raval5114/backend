const mongoose = require("mongoose");

const privilegeSchema = new mongoose.Schema(
  {
    privilegeId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    privilegeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    isSystemPrivilege: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Privilege",
  privilegeSchema
);