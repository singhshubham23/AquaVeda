import { success } from "../../utils/response.js";
import {
  getAdminDashboardStats,
  getUserDashboardStats,
  getLeaderboardStats,
  getModerationQueue as getModerationQueueService,
} from "./dashboard.service.js";

export const getUserDashboard = async (req, res, next) => {
  try {
    const data = await getUserDashboardStats(req.user.id, req.tenantId);
    return success(res, data, "User dashboard fetched");
  } catch (err) {
    return next(err);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await getAdminDashboardStats(req.tenantId);
    return success(res, data, "Admin dashboard fetched");
  } catch (err) {
    return next(err);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const data = await getLeaderboardStats(req.tenantId);
    return success(res, data, "Leaderboard fetched");
  } catch (err) {
    return next(err);
  }
};

export const getModerationQueue = async (req, res, next) => {
  try {
    const data = await getModerationQueueService(req.tenantId);
    return success(res, data, "Moderation queue fetched");
  } catch (err) {
    return next(err);
  }
};
