import { Router } from "express";
import { verifyJWT, authorize } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { approve, create, getAll, getMine, reject, update, vote } from "./wiki.controller.js";
import {
  createWikiSchema,
  updateWikiSchema,
  voteWikiSchema,
  wikiIdParamSchema,
} from "./wiki.validation.js";

const router = Router();

router.post("/", verifyJWT, authorize(PERMISSIONS.WIKI_CREATE), validate(createWikiSchema), create);
router.get("/", authorize(PERMISSIONS.WIKI_READ), getAll);
router.get("/mine", verifyJWT, authorize(PERMISSIONS.WIKI_READ), getMine);
router.patch("/:id", verifyJWT, authorize(PERMISSIONS.WIKI_UPDATE_OWN), validate(updateWikiSchema), update);
router.post("/:id/approve", verifyJWT, authorize(PERMISSIONS.WIKI_MODERATE), validate(wikiIdParamSchema), approve);
router.post("/:id/reject", verifyJWT, authorize(PERMISSIONS.WIKI_MODERATE), validate(wikiIdParamSchema), reject);
router.post("/:id/vote", verifyJWT, authorize(PERMISSIONS.WIKI_READ), validate(voteWikiSchema), vote);

export default router;
