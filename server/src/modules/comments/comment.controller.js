import { error, success } from "../../utils/response.js";
import * as commentService from "./comment.service.js";

const validRefTypes = new Set(["ISSUE", "WIKI"]);

export const create = async (req, res, next) => {
  try {
    const refType = String(req.body.refType || "").toUpperCase();
    const { refId, content, parentComment = null } = req.body;

    if (!validRefTypes.has(refType)) {
      return error(res, "Invalid refType", 400);
    }

    const comment = await commentService.addComment(
      { refType, refId, content: content.trim(), parentComment },
      req.user.id,
      req.tenantId,
    );

    return success(res, comment, "Comment added successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const refType = String(req.query.refType || "").toUpperCase();
    const { refId } = req.query;

    const comments = await commentService.getComments(
      req.tenantId,
      refType,
      refId,
      req.query,
    );
    return success(res, comments, "Comments fetched");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(
      req.params.id,
      req.body.content.trim(),
      req.user.id,
      req.tenantId,
    );
    return success(res, comment, "Comment updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await commentService.deleteComment(
      req.params.id,
      req.user.id,
      req.user.role,
      req.tenantId,
    );
    return success(res, null, "Comment deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const flag = async (req, res, next) => {
  try {
    await commentService.flagComment(req.params.id, req.tenantId);
    return success(res, null, "Comment flagged for moderation");
  } catch (err) {
    next(err);
  }
};

export const vote = async (req, res, next) => {
  try {
    const comment = await commentService.voteComment(req.params.id, req.user.id, req.body.type, req.tenantId);
    return success(res, comment, "Vote recorded");
  } catch (err) {
    return next(err);
  }
};

export const accept = async (req, res, next) => {
  try {
    const comment = await commentService.acceptComment(req.params.id, req.user.id, req.tenantId);
    return success(res, comment, "Answer accepted");
  } catch (err) {
    return next(err);
  }
};
