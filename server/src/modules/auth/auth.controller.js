import * as authService from "./auth.service.js";
import { success } from "../../utils/response.js";
import { AuthenticationError } from "../../utils/AppError.js";

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body, req.tenantId);
    return success(res, user, "User registered successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body, req.tenantId);
    return success(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AuthenticationError("Refresh token is required");
    }

    const tokens = await authService.refreshAccessToken(refreshToken, req.tenantId);
    return success(res, tokens, "Token refreshed successfully");
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user.id);
    return success(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email, req.tenantId);
    return success(
      res,
      null,
      "If the email exists in our system, a password reset link has been sent."
    );
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    return success(res, null, "Password reset successfully");
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    return success(res, req.user, "Current user fetched");
  } catch (err) {
    next(err);
  }
};
