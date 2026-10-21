  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");

  const User = require("../models/user.model");
  const Role = require("../models/role.model");
  const Player = require("../models/player.data");
  const UserLogService = require("./user_log_service");

  class AuthService {
    generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.userId,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "60m",
      }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.userId,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "45h",
      }
    );
  }

    async register({
    username,
    email,
    mobileNo,
    password,
    roleId,
    ipAddress,
    userAgent
  }) {
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(mobileNo ? [{ mobileNo }] : []),
      ],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Only PLAYER and COACH are allowed during registration
    const normalizedRoleId = roleId?.toUpperCase();

    if (!["ROLE_PLAYER", "ROLE_COACH"].includes(normalizedRoleId)) {
      throw new Error(
        "Invalid role. Registration is allowed only for PLAYER or COACH"
      );
    }

    const roleName =
      normalizedRoleId === "ROLE_COACH" ? "coach" : "player";

    const selectedRole = await Role.findOne({
      roleName, 
    });

    if (!selectedRole) {
      throw new Error(
        `${roleName} role is not configured`
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const userId = `USR-${Date.now()}`;

    const user = await User.create({
      userId,
      username,
      email: email.toLowerCase(),
      mobileNo,
      password: hashedPassword,
      roleId: selectedRole.roleId,
    });

    // Player profile should only be created for PLAYER
    let playerId = null;

    if (normalizedRoleId === "PLAYER") {
      playerId = `PLY-${Date.now()}`;

      await Player.create({
        playerId,
        userId: user.userId,
        sport: "general",
      });
    }

    await UserLogService.logAction({
      userId: user.userId,
      email: user.email,
      action: "REGISTER",
      status: "SUCCESS",
      ipAddress,
      userAgent,
    });

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      playerId,
    };
  }

  async login({ identifier, password, ipAddress, userAgent }) {
    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { mobileNo: identifier };

    const user = await User.findOne(query).select("+password +refreshToken");

    if (!user) {
      await UserLogService.logAction({
        email: identifier,
        action: "LOGIN",
        status: "FAILED",
        reason: "Invalid email/mobile number or password",
        ipAddress,
        userAgent,
      });
      throw new Error("Invalid email/mobile number or password");
    }

    if (!user.isActive) {
      await UserLogService.logAction({
        userId: user.userId,
        email: user.email,
        action: "LOGIN",
        status: "FAILED",
        reason: "User account is inactive",
        ipAddress,
        userAgent,
      });
      throw new Error("User account is inactive");
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      await UserLogService.logAction({
        userId: user.userId,
        email: user.email,
        action: "LOGIN",
        status: "FAILED",
        reason: "Invalid email/mobile number or password",
        ipAddress,
        userAgent,
      });
      throw new Error("Invalid email/mobile number or password");
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    await UserLogService.logAction({
      userId: user.userId,
      email: user.email,
      action: "LOGIN",
      status: "SUCCESS",
      ipAddress,
      userAgent,
    });

    return {
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        mobileNo: user.mobileNo,
        roleId: user.roleId,
      },
      accessToken,
      refreshToken,
    };
  }
  async refreshAccessToken(refreshToken) {
    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (error) {
      throw new Error(
        "Invalid or expired refresh token"
      );
    }

    const user = await User.findOne({
      userId: decoded.userId,
    }).select("+refreshToken");

    if (!user) {
      throw new Error("User not found");
    }

    if (user.refreshToken !== refreshToken) {
      throw new Error("Refresh token revoked");
    }

    if (
      decoded.tokenVersion === undefined ||
      decoded.tokenVersion !== user.tokenVersion
    ) {
      throw new Error("Refresh token revoked");
    }

    if (!user.isActive) {
      throw new Error("User account is inactive");
    }

    const accessToken =
      this.generateAccessToken(user);

    return {
      accessToken,
    };
  }

    async logout(userId) {
    const user = await User.findOne({
      userId,
    }).select("+refreshToken");

    if (!user) {
      throw new Error("User not found");
    }

    // Revoke all existing access tokens
    user.tokenVersion += 1;

    // Revoke refresh token
    user.refreshToken = null;

    await user.save();

    return {
      userId: user.userId,
      message: "All authentication tokens revoked",
    };
  }  
  }

  module.exports = AuthService;
