const express = require("express");

const AuthService = require("../serivces/auth_service");

const router = express.Router();
const authService = new AuthService();

// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================

router.post("/register", async (req, res) => {
try {
const {
username,
email,
mobileNo,
password,
roleId,
} = req.body;

// Required fields
if (!username || !email || !password || !roleId) {
  return res.status(400).json({
    message:
      "Username, email, password and roleId are required",
  });
}

const result = await authService.register({
  username,
  email,
  mobileNo,
  password,
  roleId,
});

return res.status(201).json({
  message: "Registration successful",
  user: {
    userId: result.userId,
    username: result.username,
    email: result.email,
    roleId: result.roleId,
    playerId: result.playerId,
  },
});

} catch (error) {
console.error("REGISTER ERROR:", error);

if (error.message === "User already exists") {
  return res.status(409).json({
    message: error.message,
  });
}

if (
  error.message.startsWith("Invalid role") ||
  error.message.includes("role is not configured")
) {
  return res.status(400).json({
    message: error.message,
  });
}

return res.status(500).json({
  message: "Server error",
  error: error.message,
});

}
});

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

router.post("/login", async (req, res) => {
try {
const {
identifier,
password,
} = req.body;

if (!identifier || !password) {
  return res.status(400).json({
    message:
      "Email/mobile number and password are required",
  });
}

const result = await authService.login({
  identifier,
  password,
});

return res.status(200).json({
  message: "Login successful",

  user: {
    userId: result.user.userId,
    username: result.user.username,
    email: result.user.email,
    mobileNo: result.user.mobileNo,
    roleId: result.user.roleId,
  },

  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
});

} catch (error) {
console.error("LOGIN ERROR:", error);

if (
  error.message ===
    "Invalid email/mobile number or password" ||
  error.message === "User account is inactive"
) {
  return res.status(401).json({
    message: error.message,
  });
}

return res.status(500).json({
  message: "Server error",
  error: error.message,
});

}
});

// ==========================================
// REFRESH ACCESS TOKEN
// POST /api/auth/refresh
// ==========================================

router.post("/refresh", async (req, res) => {
try {
const { refreshToken } = req.body;

```
if (!refreshToken) {
  return res.status(400).json({
    message: "Refresh token is required",
  });
}

const result =
  await authService.refreshAccessToken(refreshToken);

return res.status(200).json({
  message: "Access token refreshed successfully",
  accessToken: result.accessToken,
});
```

} catch (error) {
console.error("REFRESH ERROR:", error);

if (
  error.message === "Invalid or expired refresh token" ||
  error.message === "Refresh token revoked"
) {
  return res.status(401).json({
    message: error.message,
  });
}

if (error.message === "User not found") {
  return res.status(404).json({
    message: error.message,
  });
}

if (error.message === "User account is inactive") {
  return res.status(401).json({
    message: error.message,
  });
}

return res.status(500).json({
  message: "Server error",
  error: error.message,
});

}
});

// ==========================================
// LOGOUT
// POST /api/auth/logout
// ==========================================

router.post("/logout", async (req, res) => {
try {
/*
* The authentication middleware should put
* the logged-in user's information in req.user.
*
* Example:
* req.user = {
*   userId: "USR-123456"
* }
*/


if (!req.user || !req.user.userId) {
  return res.status(401).json({
    message: "Authentication required",
  });
}

const result = await authService.logout(
  req.user.userId
);

return res.status(200).json({
  message: result.message,
  userId: result.userId,
});


} catch (error) {
console.error("LOGOUT ERROR:", error);

if (error.message === "User not found") {
  return res.status(404).json({
    message: error.message,
  });
}

return res.status(500).json({
  message: "Server error",
  error: error.message,
});
``

}
});

module.exports = router;
