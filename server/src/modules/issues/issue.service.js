import Issue from "./issue.model.js";
import { buildPaginationMeta, getPagination } from "../../utils/pagination.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../utils/AppError.js";
import { awardReputation } from "../../utils/reputation.js";
import { ROLES } from "../../constants/rbac.js";
import { generateEmbedding, classifyIssue } from "../ai/ai.service.js";

const STATUS_FLOW = {
  OPEN: ["ACKNOWLEDGED", "RESOLVED"], // Can be acknowledged or resolved directly
  ACKNOWLEDGED: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["VERIFIED"],
  VERIFIED: [] // Terminal state
};

export const createIssue = async (data, userId, tenantId) => {
  const embeddingText = `${data.title} ${data.description}`;
  const [embedding, aiClassification] = await Promise.all([
    generateEmbedding(embeddingText),
    classifyIssue(data.title, data.description)
  ]);

  const issue = await Issue.create({
    tenantId,
    ...data,
    category: aiClassification.category || "GENERAL",
    severity: aiClassification.estimatedSeverity || data.severity || "LOW",
    isSpam: !!aiClassification.isSpam,
    embedding,
    reportedBy: userId,
    timeline: [
      {
        action: "CREATED",
        by: userId
      }
    ]
  });

  await awardReputation(userId, "ISSUE_REPORTED");

  return issue;
};

export const getIssues = async (tenantId, query = {}) => {
  const { page, limit, skip } = getPagination(query);

  const [items, total] = await Promise.all([
    Issue.find({ tenantId, isSpam: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reportedBy", "name")
      .lean(),
    Issue.countDocuments({ tenantId, isSpam: { $ne: true } })
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

export const getNearbyIssues = async (tenantId, lng, lat, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const maxDistance = 5000;
  const earthRadiusInMeters = 6378137;
  
  const geoQuery = {
    tenantId,
    isSpam: { $ne: true },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  };
  
  const countQuery = {
    tenantId,
    isSpam: { $ne: true },
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], maxDistance / earthRadiusInMeters]
      }
    }
  };

  const [items, total] = await Promise.all([
    Issue.find(geoQuery)
      .skip(skip)
      .limit(limit)
      .populate("reportedBy", "name")
      .lean(),
    Issue.countDocuments(countQuery)
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

export const getIssuesInRadius = async (tenantId, lng, lat, radiusKm, filters = {}) => {
  const earthRadiusInKm = 6378.1;
  const radiusInRadians = radiusKm / earthRadiusInKm;
  const limit = filters.limit || 100;

  const geoFilter = {
    tenantId,
    isSpam: { $ne: true },
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radiusInRadians]
      }
    }
  };

  if (filters.status) geoFilter.status = filters.status;
  if (filters.severity) geoFilter.severity = filters.severity;

  const [items, total, bySeverity, byStatus] = await Promise.all([
    Issue.find(geoFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("reportedBy", "name")
      .lean(),
    Issue.countDocuments(geoFilter),
    Issue.aggregate([
      { $match: geoFilter },
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Issue.aggregate([
      { $match: geoFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    total,
    radiusKm,
    center: { lng, lat },
    bySeverity,
    byStatus,
    items
  };
};

export const getFilteredIssues = async (tenantId, filters, paginationQuery = {}) => {
  const filterQuery = { tenantId, isSpam: { $ne: true } };

  if (filters.severity) {
    filterQuery.severity = filters.severity;
  }

  if (filters.status) {
    filterQuery.status = filters.status;
  }

  if (filters.region) {
    filterQuery.region = filters.region;
  }

  const { page, limit, skip } = getPagination(paginationQuery);
  const [items, total] = await Promise.all([
    Issue.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reportedBy", "name")
      .lean(),
    Issue.countDocuments(filterQuery)
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

export const getIssueById = async (id, tenantId) => {
  const issue = await Issue.findOne({ _id: id, tenantId })
    .populate("reportedBy", "name")
    .populate("timeline.by", "name")
    .lean();

  if (!issue) {
    throw new NotFoundError("Issue");
  }

  return issue;
};

export const updateIssueStatus = async (id, newStatus, note, user, tenantId) => {
  const issue = await Issue.findOne({ _id: id, tenantId });

  if (!issue) {
    throw new NotFoundError("Issue");
  }

  if (issue.status === newStatus) {
    if (note?.trim()) {
      issue.timeline.push({
        action: "UPDATED",
        by: user.id,
        note: note.trim().slice(0, 280),
      });
      await issue.save();
    }

    return Issue.findOne({ _id: id, tenantId })
      .populate("reportedBy", "name")
      .populate("timeline.by", "name")
      .lean();
  }

  // Only admins/experts can verify
  if (newStatus === "VERIFIED" && ![ROLES.ADMIN, ROLES.MEMBER].includes(user.role)) {
     throw new ForbiddenError("Only admins and members can verify issues");
  }
  
  // A user cannot verify their own issue to prevent abuse
  if (newStatus === "VERIFIED" && issue.reportedBy.toString() === user.id.toString()) {
     throw new ForbiddenError("You cannot verify your own issue");
  }

  const allowedNextStatuses = STATUS_FLOW[issue.status];
  
  if (!allowedNextStatuses || !allowedNextStatuses.includes(newStatus)) {
    throw new ValidationError(`Invalid status transition from ${issue.status} to ${newStatus}`);
  }

  issue.status = newStatus;
  issue.timeline.push({
    action: newStatus,
    by: user.id,
    note: note?.trim() || ""
  });

  await issue.save();

  if (newStatus === "RESOLVED") {
    await awardReputation(issue.reportedBy, "ISSUE_RESOLVED");
  } else if (newStatus === "VERIFIED") {
    await awardReputation(issue.reportedBy, "ISSUE_VERIFIED");
  }

  return Issue.findOne({ _id: id, tenantId })
    .populate("reportedBy", "name")
    .populate("timeline.by", "name")
    .lean();
};

export const deleteIssue = async (id, userId, userRole, tenantId) => {
  const issue = await Issue.findOne({ _id: id, tenantId });

  if (!issue) {
    throw new NotFoundError("Issue");
  }

  if (issue.reportedBy.toString() !== userId && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError("You can only delete your own issues");
  }

  await Issue.deleteOne({ _id: id, tenantId });
};
