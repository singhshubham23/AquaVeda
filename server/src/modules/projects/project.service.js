import Project from "./project.model.js";
import { buildPaginationMeta, getPagination } from "../../utils/pagination.js";
import Issue from "../issues/issue.model.js";
import { ForbiddenError, NotFoundError } from "../../utils/AppError.js";

export const createProject = async (data, userId, tenantId) => {
  const relatedIssue = await Issue.findOne({ _id: data.relatedIssue, tenantId }).select("_id");
  if (!relatedIssue) {
    throw new NotFoundError("Related issue");
  }

  return Project.create({
    tenantId,
    ...data,
    createdBy: userId,
    contributors: [userId]
  });
};

export const joinProject = async (projectId, userId, tenantId) => {
  return Project.findOneAndUpdate(
    { _id: projectId, tenantId },
    { $addToSet: { contributors: userId } },
    { returnDocument: "after" }
  )
    .populate("createdBy", "name")
    .populate("contributors", "name")
    .populate("relatedIssue", "title severity status");
};

export const getProjects = async (tenantId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const [items, total] = await Promise.all([
    Project.find({ tenantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .populate("contributors", "name")
      .populate("relatedIssue", "title severity status"),
    Project.countDocuments({ tenantId })
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

export const updateProgress = async (projectId, progress, userId, tenantId) => {
  const project = await Project.findOne({ _id: projectId, tenantId });

  if (!project) {
    throw new NotFoundError("Project");
  }

  if (project.createdBy.toString() !== userId) {
    throw new ForbiddenError("Not authorized");
  }

  project.progress = progress;
  if (progress >= 100) {
    project.status = "COMPLETED";
  }

  await project.save();

  return Project.findOne({ _id: project._id, tenantId })
    .populate("createdBy", "name")
    .populate("contributors", "name")
    .populate("relatedIssue", "title severity status");
};
