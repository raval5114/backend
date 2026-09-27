const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Authorization header is required",
      });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        error: "INVALID_TOKEN_FORMAT",
        message: "Authorization format must be Bearer <token>",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    const user = await User.findOne({
      userId: decoded.userId,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "Authenticated user does not exist",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "USER_INACTIVE",
        message: "User account is inactive",
      });
    }

    // IMPORTANT:
    // Reject tokens generated before logout
    if (
      decoded.tokenVersion === undefined ||
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        error: "TOKEN_REVOKED",
        message: "Access token has been revoked",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "INVALID_ACCESS_TOKEN",
      message: "Invalid or expired access token",
    });
  }
};

module.exports = authenticate;