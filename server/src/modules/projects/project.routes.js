import { Router } from "express";
import { authorize, verifyJWT } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { create, getAll, join, setProgress } from "./project.controller.js";
import {
	createProjectSchema,
	projectListQuerySchema,
	updateProgressSchema
} from "./project.validation.js";

const router = Router();

router.post("/", verifyJWT, authorize(PERMISSIONS.PROJECT_CREATE), validate(createProjectSchema), create);
router.get("/", authorize(PERMISSIONS.PROJECT_READ), validate(projectListQuerySchema), getAll);
router.post("/:id/join", verifyJWT, authorize(PERMISSIONS.PROJECT_JOIN), join);
router.patch("/:id/progress", verifyJWT, authorize(PERMISSIONS.PROJECT_UPDATE_PROGRESS_OWN), validate(updateProgressSchema), setProgress);

export default router;
