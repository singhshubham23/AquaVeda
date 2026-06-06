import { Router } from "express";
import { authorize, verifyJWT } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { enforceImageUploadRange, upload } from "../../middlewares/upload.middleware.js";
import {
  create,
  getAll,
  getById,
  getFiltered,
  getMapData,
  getNearby,
  getRadiusData,
  updateStatus,
  deleteIssue
} from "./issue.controller.js";
import {
  createIssueSchema,
  filterIssueQuerySchema,
  listIssueQuerySchema,
  nearbyIssueQuerySchema,
  radiusIssueQuerySchema,
  issueIdParamSchema,
  updateIssueStatusSchema
} from "./issue.validation.js";

const router = Router();

const parseMultipart = (req, res, next) => {
  if (req.body.location && typeof req.body.location === "string") {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch {}
  }
  next();
};

router.post(
  "/",
  verifyJWT,
  authorize(PERMISSIONS.ISSUE_CREATE),
  upload.array("images", 3),
  enforceImageUploadRange(1, 3),
  parseMultipart,
  validate(createIssueSchema),
  create
);
router.get("/", validate(listIssueQuerySchema), getAll);
router.get("/filter", validate(filterIssueQuerySchema), getFiltered);
router.get("/map", validate(filterIssueQuerySchema), getMapData);
router.get("/nearby", validate(nearbyIssueQuerySchema), getNearby);
router.get("/radius", validate(radiusIssueQuerySchema), getRadiusData);
router.get("/:id", validate(issueIdParamSchema), getById);
router.patch("/:id/status", verifyJWT, authorize(PERMISSIONS.ISSUE_VERIFY), validate(updateIssueStatusSchema), updateStatus);
router.delete("/:id", verifyJWT, authorize(PERMISSIONS.ISSUE_DELETE_OWN), validate(issueIdParamSchema), deleteIssue);

export default router;
