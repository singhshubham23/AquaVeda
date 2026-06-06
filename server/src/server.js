import dotenv from "dotenv";
dotenv.config();

import { validateEnv } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import app from "./app.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  try {
    validateEnv();
    await connectDB();
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        env: process.env.NODE_ENV || "development",
        node: process.version,
      });
    });
  } catch (error) {
    logger.error("Startup failed:", { message: error.message });
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`${signal} received - shutting down gracefully...`);

  // Force exit after 10 seconds if graceful shutdown hangs
  const forceTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out - forcing exit");
    process.exit(1);
  }, 10_000);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info("HTTP server closed");
    }

    await disconnectDB();
    clearTimeout(forceTimeout);
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown:", { message: err.message });
    clearTimeout(forceTimeout);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
