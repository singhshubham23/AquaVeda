import { Router } from "express";
import { authorize, verifyJWT } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import { recommend, classify, checkDuplicates, assist } from "./ai.controller.js";

const router = Router();

router.get("/recommend/:id", verifyJWT, authorize(PERMISSIONS.AI_RECOMMEND), recommend);
router.post("/classify", verifyJWT, authorize(PERMISSIONS.AI_CLASSIFY), classify);
router.post("/duplicates", verifyJWT, authorize(PERMISSIONS.AI_DUPLICATES), checkDuplicates);
router.post("/assist", verifyJWT, authorize(PERMISSIONS.AI_CLASSIFY), assist);

export default router;
