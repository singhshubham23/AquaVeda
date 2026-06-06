import { Router } from "express";
import { authorize, verifyJWT } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import { recommend, classify, checkDuplicates } from "./ai.controller.js";

const router = Router();

router.get("/recommend/:id", recommend);
router.post("/classify", verifyJWT, authorize(PERMISSIONS.AI_CLASSIFY), classify);
router.post("/duplicates", verifyJWT, authorize(PERMISSIONS.AI_DUPLICATES), checkDuplicates);

export default router;
