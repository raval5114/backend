const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDb = require("./config/db_config.js");
const playerRoutes = require("./routes/player.routes.js");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

connectDb();

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Wearable Analytics Service is running",
  });
});

// Player routes
app.use("/api/players", playerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
