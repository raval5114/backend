const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false, // In case of failed login with unknown user
      index: true,
    },
    email: {
      type: String, // To track attempts even if user doesn't exist
    },
    action: {
      type: String,
      required: true,
      enum: ["LOGIN", "REGISTER"],
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS"
    },
    reason: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserLog", userLogSchema);

