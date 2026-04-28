import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import { app } from "./app.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("Shutting down...");
  server?.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();