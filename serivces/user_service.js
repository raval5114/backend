const User = require("../models/user.model");
const Role = require("../models/role.model");

class UserService {
  async getAllUsers() {
    return await User.find().select(
      "-password -refreshToken"
    );
  }

  async getUserById(userId) {
    const user = await User.findOne({
      userId,
    }).select("-password -refreshToken");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async assignRole(userId, roleId) {
    const user = await User.findOne({
      userId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const role = await Role.findOne({
      roleId,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    user.roleId = role.roleId;

    await user.save();

    return {
      userId: user.userId,
      username: user.username,
      roleId: user.roleId,
    };
  }

  async revokeRole(userId) {
    const user = await User.findOne({
      userId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    /*
     * Every user must have a role.
     * Revoke means return to player role.
     */
    const playerRole = await Role.findOne({
      roleName: "player",
    });

    if (!playerRole) {
      throw new Error(
        "Default player role does not exist"
      );
    }

    user.roleId = playerRole.roleId;

    await user.save();

    return {
      userId: user.userId,
      roleId: user.roleId,
    };
  }

  async updateUserStatus(userId, isActive) {
    const user = await User.findOne({
      userId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    user.isActive = isActive;

    await user.save();

    return {
      userId: user.userId,
      isActive: user.isActive,
    };
  }
}

module.exports = UserService;