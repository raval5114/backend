const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDb = require("./config/db_config.js");



const authRoutes = require(
  "./routes/authentication.routes.js"
);
const playerRoutes = require(
  "./routes/player.routes.js"
);
const userRoutes = require(
  "./routes/user.routes.js"
);
const roleRoutes = require(
  "./routes/role.routes.js"
);
const privilegeRoutes = require(
  "./routes/privilege.routes.js"
);


const seedRBAC = require(
  "./seed/rbac.seed.js"
);

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
app.use(
  express.urlencoded({
    extended: true,
  })
);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDb();

    await seedRBAC();

    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message:
          "Wearable Analytics Service is running",
      });
    });

    //Swagger
   app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);
    // Authentication
    app.use(
      "/api/auth",
      authRoutes
    );

    // Player
    app.use(
      "/api/players",
      playerRoutes
    );

    // User management
    app.use(
      "/api/users",
      userRoutes
    );

    // Role management
    app.use(
      "/api/roles",
      roleRoutes
    );

    // Privilege management
    app.use(
      "/api/privileges",
      privilegeRoutes
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
      console.log(`
        Api endpoint overview:http://localhost:${PORT}/api-docs
        `);
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();