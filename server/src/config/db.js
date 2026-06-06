import mongoose from "mongoose";
import logger from "./logger.js";

let listenersRegistered = false;
let disconnectWarnTimer = null;
let isIntentionalShutdown = false;

const registerConnectionListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on("connected", () => {
    if (disconnectWarnTimer) {
      clearTimeout(disconnectWarnTimer);
      disconnectWarnTimer = null;
    }
    logger.info("Mongoose connection established");
  });

  mongoose.connection.on("disconnected", () => {
    // Suppress warning during expected app shutdown.
    if (isIntentionalShutdown) return;

    // Avoid noisy warnings for short transient reconnects.
    disconnectWarnTimer = setTimeout(() => {
      if (mongoose.connection.readyState !== 1 && !isIntentionalShutdown) {
        logger.warn("Mongoose connection lost");
      }
      disconnectWarnTimer = null;
    }, 3000);
  });

  mongoose.connection.on("error", (err) => {
    logger.error("Mongoose connection error:", { message: err.message });
  });
};

export const connectDB = async () => {
  registerConnectionListeners();

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed:", { message: error.message });
    throw error;
  }
};

export const disconnectDB = async () => {
  isIntentionalShutdown = true;
  if (disconnectWarnTimer) {
    clearTimeout(disconnectWarnTimer);
    disconnectWarnTimer = null;
  }
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
};
