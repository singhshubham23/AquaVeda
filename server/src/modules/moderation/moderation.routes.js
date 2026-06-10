import { Router } from "express";
import { verifyJWT, authorize } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { report, listReports, reviewReport } from "./moderation.controller.js";
import {
  createReportSchema,
  listReportsQuerySchema,
  reviewReportSchema
} from "./moderation.validation.js";

const router = Router();

// Any authenticated user with contribution access can submit a report
router.post("/", verifyJWT, authorize(PERMISSIONS.REPORT_CREATE), validate(createReportSchema), report);

// Only admin users can view and review moderation queues
router.get(
  "/",
  verifyJWT,
  authorize(PERMISSIONS.MODERATION_QUEUE_READ),
  validate(listReportsQuerySchema),
  listReports
);

router.patch(
  "/:id/review",
  verifyJWT,
  authorize(PERMISSIONS.REPORT_REVIEW, PERMISSIONS.MODERATION_REVIEW),
  validate(reviewReportSchema),
  reviewReport
);

export default router;
