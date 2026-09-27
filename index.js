const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDb = require("./config/db_config.js");
const playerRoutes = require("./routes/player.routes.js");
const authRoutes = require("./routes/auth_routes");
dotenv.config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.js");

const app = express();

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
app.use("/api/players", playerRoutes);
const PORT = process.env.PORT || 3000;

//connectDb();

    await seedRBAC();

    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message:
          "Wearable Analytics Service is running",
      });
    });

// Player routes
//app.use("/api/players", playerRoutes);
app.use("/api/auth", authRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Auth routes
