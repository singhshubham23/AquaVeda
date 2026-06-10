import { Router } from "express";
import { verifyJWT, authorize } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import {
  getAdminDashboard,
  getUserDashboard,
  getLeaderboard,
  getModerationQueue,
} from "./dashboard.controller.js";

const router = Router();

router.get("/user", verifyJWT, authorize(PERMISSIONS.USER_DASHBOARD_READ), getUserDashboard);
router.get("/admin", verifyJWT, authorize(PERMISSIONS.ADMIN_DASHBOARD_READ), getAdminDashboard);
router.get("/leaderboard", verifyJWT, authorize(PERMISSIONS.LEADERBOARD_READ), getLeaderboard);
router.get("/moderation", verifyJWT, authorize(PERMISSIONS.MODERATION_QUEUE_READ), getModerationQueue);

export default router;
