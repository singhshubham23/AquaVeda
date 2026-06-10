import { Router } from "express";
import { authorize, verifyJWT } from "../../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../../constants/rbac.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { create, list, update, remove, flag, vote, accept } from "./comment.controller.js";
import {
  createCommentSchema,
  listCommentQuerySchema,
  commentIdParamSchema,
  updateCommentSchema,
  flagCommentSchema,
  voteCommentSchema,
} from "./comment.validation.js";

const router = Router();

router.post(
  "/",
  verifyJWT,
  authorize(PERMISSIONS.COMMENT_CREATE),
  validate(createCommentSchema),
  create,
);
router.get("/", authorize(PERMISSIONS.COMMENT_READ), validate(listCommentQuerySchema), list);
router.patch(
  "/:id",
  verifyJWT,
  authorize(PERMISSIONS.COMMENT_UPDATE_OWN),
  validate(updateCommentSchema),
  update,
);
router.delete(
  "/:id",
  verifyJWT,
  authorize(PERMISSIONS.COMMENT_DELETE_OWN, PERMISSIONS.COMMENT_DELETE_ANY),
  validate(commentIdParamSchema),
  remove,
);
router.post(
  "/:id/flag",
  verifyJWT,
  authorize(PERMISSIONS.COMMENT_FLAG),
  validate(flagCommentSchema),
  flag,
);
router.post("/:id/vote", verifyJWT, authorize(PERMISSIONS.COMMENT_VOTE), validate(voteCommentSchema), vote);
router.post("/:id/accept", verifyJWT, authorize(PERMISSIONS.COMMENT_ACCEPT), validate(commentIdParamSchema), accept);

export default router;
