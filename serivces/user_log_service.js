const UserLog = require("../models/user_log.model");

class UserLogService {
  static async logAction({ userId, email, action, status, reason, ipAddress, userAgent }) {
    try {
      await UserLog.create({
        userId,
        email,
        action,
        status,
        reason,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error("Failed to write user log:", error);
    }
  }

  static async getUserLogs(limit = 50, skip = 0) {
    const logs = await UserLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await UserLog.countDocuments();
    
    return {
      success: true,
      data: {
        logs,
        total,
      }
    };
  }
}

module.exports = UserLogService;

