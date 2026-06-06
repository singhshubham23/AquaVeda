import Wiki from "./wiki.model.js";
import { buildPaginationMeta, getPagination } from "../../utils/pagination.js";
import { ForbiddenError, NotFoundError } from "../../utils/AppError.js";
import { ROLES, normalizeRole } from "../../constants/rbac.js";

export const createArticle = async (data, userId, tenantId) => {
  return Wiki.create({
    tenantId,
    ...data,
    author: userId
  });
};

export const voteWiki = async (id, userId, voteType, tenantId) => {
  const article = await Wiki.findOne({ _id: id, tenantId });
  if (!article) throw new NotFoundError("Article");

  article.upvotedBy = article.upvotedBy.filter(uId => uId.toString() !== userId);
  article.downvotedBy = article.downvotedBy.filter(uId => uId.toString() !== userId);

  if (voteType === "UP") {
    article.upvotedBy.push(userId);
  } else if (voteType === "DOWN") {
    article.downvotedBy.push(userId);
  }

  return article.save();
};

export const getAllApproved = async (tenantId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const findQuery = { tenantId, status: "APPROVED" };

  const [items, total] = await Promise.all([
    Wiki.find(findQuery).populate("author", "name").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Wiki.countDocuments(findQuery)
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

export const approveArticle = async (id, expertId, tenantId, userRole) => {
  if (normalizeRole(userRole) !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admin users can approve articles");
  }

  return Wiki.findOneAndUpdate(
    { _id: id, tenantId },
    {
      status: "APPROVED",
      verifiedBy: expertId
    },
    { returnDocument: "after" }
  );
};

export const updateArticle = async (id, data, userId, tenantId) => {
  const article = await Wiki.findOne({ _id: id, tenantId });

  if (!article) {
    throw new NotFoundError("Article");
  }

  if (article.author.toString() !== userId) {
    throw new ForbiddenError("Not authorized");
  }

  if (article.status === "APPROVED") {
    throw new ForbiddenError("Approved articles cannot be edited");
  }

  Object.assign(article, data);
  return article.save();
};

export const rejectArticle = async (id, tenantId, userRole) => {
  if (normalizeRole(userRole) !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admin users can reject articles");
  }

  return Wiki.findOneAndUpdate(
    { _id: id, tenantId },
    {
      status: "PENDING",
      verifiedBy: null
    },
    { returnDocument: "after" }
  );
};

export const getUserArticles = async (userId, tenantId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const findQuery = { tenantId, author: userId };

  const [items, total] = await Promise.all([
    Wiki.find(findQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Wiki.countDocuments(findQuery)
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};
