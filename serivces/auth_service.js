const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const Role = require("../models/role.model");
const Player = require("../models/player.data");

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.userId,
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "15m",
      }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.userId,
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

    // Default role
    const playerRole = await Role.findOne({
      roleName: "player",
    });

    if (!playerRole) {
      throw new Error(
        "Default player role is not configured"
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
      roleId: playerRole.roleId,
    });

    // Player profile is automatically created
    const playerId = `PLY-${Date.now()}`;

    await Player.create({
      playerId,
      userId: user.userId,
      sport: "general",
    });

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      playerId,
    };
  }

  async login(identifier, password) {
    const query = identifier.includes("@")
      ? {
          email: identifier.toLowerCase(),
        }
      : {
          mobileNo: identifier,
        };

    const user = await User.findOne(query).select(
      "+password +refreshToken"
    );

    if (!user) {
      throw new Error(
        "Invalid email/mobile number or password"
      );
    }

    if (!user.isActive) {
      throw new Error("User account is inactive");
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      throw new Error(
        "Invalid email/mobile number or password"
      );
    }

    const accessToken =
      this.generateAccessToken(user);

    const refreshToken =
      this.generateRefreshToken(user);

    user.refreshToken = refreshToken;

    await user.save();

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

    user.refreshToken = null;

    await user.save();
  }
}

module.exports = AuthService;