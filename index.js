const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDb = require("./config/db_config.js");
const playerRoutes = require("./routes/player.routes.js");
const authRoutes = require("./routes/auth_routes.js");
const seedRBAC = require("./seed/rbac.seed.js");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.js");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// Middleware
// =========================

app.use(
  cors({
    origin: "*",
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// Swagger
// =========================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// =========================
// Routes
// =========================

app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);

// =========================
// Health Check
// =========================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Wearable Analytics Service is running",
  });
});

// =========================
// 404 Handler
// =========================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "ROUTE_NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// =========================
// Global Error Handler
// =========================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
});

// =========================
// Start Server
// =========================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDb();

    // Seed roles and privileges
    await seedRBAC();

    // Start Express server
    app.listen(PORT, () => {
      console.log(
        `Wearable Analytics Service running on port ${PORT}`
      );

      console.log(
        `Health: http://localhost:${PORT}/`
      );

      console.log(
        `Swagger: http://localhost:${PORT}/api-docs`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start Wearable Analytics Service:",
      error
    );

    process.exit(1);
  }
};

startServer();