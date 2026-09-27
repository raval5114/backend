const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    roleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    privilegesId: [
      {
        type: Number,
        ref: "Privilege",
      },
    ],

    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", roleSchema);