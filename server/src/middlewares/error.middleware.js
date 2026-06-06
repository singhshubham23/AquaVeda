import logger from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let isOperational = err.isOperational || false;
  let errors = err.errors || null;

  // --- Mongoose Validation Error ---
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(", ");
    isOperational = true;
    errors = messages.map((item) => ({ message: item }));
  }

  // --- Mongoose Cast Error (invalid ObjectId, etc.) ---
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    isOperational = true;
    errors = [{ path: err.path, message }];
  }

  // --- Mongoose Duplicate Key ---
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {}).join(", ");
    message = `Duplicate value for: ${field}`;
    isOperational = true;
    errors = [{ field, message }];
  }

  // --- JWT Errors ---
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    isOperational = true;
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    isOperational = true;
  }

  // --- Multer upload errors ---
  if (err.name === "MulterError") {
    statusCode = 400;
    isOperational = true;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Each image must be 5MB or smaller";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Too many files uploaded. Maximum 3 images allowed";
    } else {
      message = err.message || "Invalid file upload";
    }
  }

  // --- AppError instances ---
  if (err instanceof AppError) {
    isOperational = true;
  }

  // Log based on severity
  if (!isOperational) {
    logger.error("Unhandled error:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  } else {
    logger.warn(`${statusCode} ${req.method} ${req.originalUrl}: ${message}`);
  }

  return sendResponse(res, {
    success: false,
    status: statusCode,
    message,
    errors:
      process.env.NODE_ENV !== "production" && !isOperational
        ? [...(errors || []), { stack: err.stack }]
        : errors
  });
};
