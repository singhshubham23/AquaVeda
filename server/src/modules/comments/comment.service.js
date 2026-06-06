import Comment from "./comment.model.js";
import { buildPaginationMeta, getPagination } from "../../utils/pagination.js";
import { NotFoundError, ForbiddenError } from "../../utils/AppError.js";
import { awardReputation } from "../../utils/reputation.js";
import { ROLES } from "../../constants/rbac.js";

export const addComment = async (payload, userId, tenantId) => {
  const comment = await Comment.create({
    tenantId,
    ...payload,
    user: userId
  });

  await awardReputation(userId, "COMMENT_ADDED");

  return comment;
};

export const getComments = async (tenantId, refType, refId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const findQuery = { tenantId, refType, refId };

  const [items, total] = await Promise.all([
    Comment.find(findQuery)
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(findQuery)
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

export const updateComment = async (id, content, userId, tenantId) => {
  const comment = await Comment.findOne({ _id: id, tenantId });

  if (!comment) {
    throw new NotFoundError("Comment");
  }

  if (comment.user.toString() !== userId) {
    throw new ForbiddenError("You can only edit your own comments");
  }

  comment.content = content;
  comment.edited = true;
  comment.editedAt = new Date();

  await comment.save();

  return Comment.findOne({ _id: id, tenantId }).populate("user", "name").lean();
};

export const deleteComment = async (id, userId, userRole, tenantId) => {
  const comment = await Comment.findOne({ _id: id, tenantId });

  if (!comment) {
    throw new NotFoundError("Comment");
  }

  if (comment.user.toString() !== userId && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError("You are not authorized to delete this comment");
  }

  await Comment.deleteOne({ _id: id, tenantId });
};

export const flagComment = async (id, tenantId) => {
  const comment = await Comment.findOne({ _id: id, tenantId });

  if (!comment) {
    throw new NotFoundError("Comment");
  }

  comment.flagged = true;
  await comment.save();

  return comment;
};

import Wiki from "../wiki/wiki.model.js";

export const voteComment = async (id, userId, voteType, tenantId) => {
  const comment = await Comment.findOne({ _id: id, tenantId });
  if (!comment) throw new NotFoundError("Comment");

  comment.upvotedBy = comment.upvotedBy.filter(uId => uId.toString() !== userId);
  comment.downvotedBy = comment.downvotedBy.filter(uId => uId.toString() !== userId);

  if (voteType === "UP") {
    comment.upvotedBy.push(userId);
  } else if (voteType === "DOWN") {
    comment.downvotedBy.push(userId);
  }

  return comment.save();
};

export const acceptComment = async (id, userId, tenantId) => {
  const comment = await Comment.findOne({ _id: id, tenantId });
  if (!comment) throw new NotFoundError("Comment");
  if (comment.refType !== "WIKI") throw new ForbiddenError("Only Wiki answers can be accepted");

  const wiki = await Wiki.findOne({ _id: comment.refId, tenantId });
  if (!wiki) throw new NotFoundError("Wiki not found");

  if (wiki.author.toString() !== userId) {
    throw new ForbiddenError("Only the author of the question can accept an answer");
  }

  // Deselect any currently accepted comment for this wiki
  await Comment.updateMany({ refType: "WIKI", refId: wiki._id, tenantId }, { isAccepted: false });

  comment.isAccepted = true;
  await comment.save();

  await awardReputation(comment.user, "BEST_ANSWER");

  return comment;
};
