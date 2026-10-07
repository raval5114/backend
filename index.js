const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables FIRST
dotenv.config();

// Database
const connectDb = require("./config/db_config.js");

// Routes
const playerRoutes = require("./routes/player.routes.js");
const authRoutes = require("./routes/auth_routes.js");
const wearableRoutes = require("./routes/wearable.routes.js");

// RBAC
const seedRBAC = require("./seed/rbac.seed.js");

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.js");

// ==========================================
// APP
// ==========================================

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
cors({
origin: "*",
methods: [
"GET",
"POST",
"PUT",
"DELETE",
"PATCH",
"OPTIONS",
],
allowedHeaders: [
"Content-Type",
"Authorization",
],
})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// SWAGGER
// ==========================================

app.use(
"/api-docs",
swaggerUi.serve,
swaggerUi.setup(swaggerSpec)
);

// ==========================================
// ROUTES
// ==========================================

//wearable data
app.use("/api/wearable", wearableRoutes);
// Authentication
app.use("/api/auth", authRoutes);

// Player APIs
app.use("/api/players", playerRoutes);

// Wearable APIs
app.use("/api/wearable", wearableRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
return res.status(200).json({
success: true,
message: "Wearable Analytics Service is running",
});
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
return res.status(404).json({
success: false,
error: "ROUTE_NOT_FOUND",
message: `Route ${req.method} ${req.originalUrl} not found`,
});
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
console.error("Unhandled error:", err);

return res.status(500).json({
success: false,
error: "INTERNAL_SERVER_ERROR",
message: "An unexpected error occurred",
});
});

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
try {
console.log("Starting Wearable Analytics Service...");

// 1. Connect to MongoDB
console.log("Connecting to MongoDB...");
await connectDb();

// 2. Seed RBAC roles and privileges
console.log("Seeding RBAC...");
await seedRBAC();

// 3. Start Express server
app.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log("Wearable Analytics Service Started");
  console.log("==========================================");
  console.log(`Server:  http://localhost:${PORT}`);
  console.log(`Health:  http://localhost:${PORT}/`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`Auth:    http://localhost:${PORT}/api/auth`);
  console.log("==========================================");
});

} catch (error) {
console.error("");
console.error("==========================================");
console.error("FAILED TO START SERVER");
console.error("==========================================");
console.error(error);
console.error("==========================================");

process.exit(1);


}
};

// ==========================================
// START APPLICATION
// ==========================================

startServer();
