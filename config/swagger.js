const swaggerJSDoc = require("swagger-jsdoc");
const PORT = process.env.PORT || 3000;
const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Wearable Analytics & Player Management API",
      version: "1.0.0",
      description:
        "API documentation for the Wearable Analytics and Player Management Service",
    },

    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local development server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: [
    "./routes/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;