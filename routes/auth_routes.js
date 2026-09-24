// const express = require("express");
// const bcrypt = require("bcryptjs");

// const User = require("../models/usser_model");

// const router = express.Router();

// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // 1. Check required fields
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         message: "Name, email and password are required",
//       });
//     }

//     // 2. Check if user already exists
//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res.status(409).json({
//         message: "User already exists",
//       });
//     }

//     // 3. Hash password
//     const passwordHash = await bcrypt.hash(password, 10);

//     // 4. Create user
//     const user = await User.create({
//       name,
//       email,
//       passwordHash,
//     });

//     // 5. Send response
//     return res.status(201).json({
//       message: "User registered successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// });

// module.exports = router;

const express = require("express");

const router = express.Router();

router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required",
    });
  }

  return res.status(201).json({
    message: "Registration successful",
    user: {
      name: name,
      email: email,
    },
  });
});
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  // Temporary login response
  return res.status(200).json({
    message: "Login successful",
    user: {
      email: email,
    },
  });
});

module.exports = router;

// const express = require("express");
// const bcrypt = require("bcryptjs");
// const User = require("../models/usser_model");

// const router = express.Router();

// // ================================
// // REGISTER
// // POST /api/auth/register
// // ================================

// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // 1. Check required fields
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         message: "Name, email and password are required",
//       });
//     }

//     // 2. Check if user already exists
//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res.status(409).json({
//         message: "User already exists",
//       });
//     }

//     // 3. Hash password
//     const passwordHash = await bcrypt.hash(password, 10);

//     // 4. Create user in MongoDB
//     const user = await User.create({
//       name,
//       email,
//       passwordHash,
//     });

//     // 5. Send response
//     return res.status(201).json({
//       message: "Registration successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// });


// // ================================
// // LOGIN
// // POST /api/auth/login
// // ================================

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 1. Check required fields
//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required",
//       });
//     }

//     // 2. Find user
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(401).json({
//         message: "Invalid email or password",
//       });
//     }

//     // 3. Compare password with hashed password
//     const isPasswordCorrect = await bcrypt.compare(
//       password,
//       user.passwordHash
//     );

//     if (!isPasswordCorrect) {
//       return res.status(401).json({
//         message: "Invalid email or password",
//       });
//     }

//     // 4. Login successful
//     return res.status(200).json({
//       message: "Login successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });

//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// });

// module.exports = router;