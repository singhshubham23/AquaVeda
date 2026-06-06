import Report from "./moderation.model.js";
import { buildPaginationMeta, getPagination } from "../../utils/pagination.js";
import { ForbiddenError, NotFoundError } from "../../utils/AppError.js";
import { ROLES, normalizeRole } from "../../constants/rbac.js";

export const createReport = async (payload, userId, tenantId) => {
  return Report.create({
    tenantId,
    ...payload,
    reportedBy: userId
  });
};

export const getReports = async (tenantId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const findQuery = { tenantId };

  if (query.status) {
    findQuery.status = query.status;
  }
  if (query.refType) {
    findQuery.refType = query.refType;
  }

  const [items, total] = await Promise.all([
    Report.find(findQuery)
      .sort({ createdAt: 1 }) // Process oldest first
      .skip(skip)
      .limit(limit)
      .populate("reportedBy", "name")
      .populate("reviewedBy", "name")
      .lean(),
    Report.countDocuments(findQuery)
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

export const reviewReport = async (id, updateData, userId, tenantId, userRole) => {
  if (normalizeRole(userRole) !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admin users can review reports");
  }

  const report = await Report.findOne({ _id: id, tenantId });

  if (!report) {
    throw new NotFoundError("Report");
  }

  report.status = updateData.status;
  report.reviewedBy = userId;
  if (updateData.reviewNotes) {
    report.reviewNotes = updateData.reviewNotes;
  }

  await report.save();

  return Report.findOne({ _id: id, tenantId })
    .populate("reportedBy", "name")
    .populate("reviewedBy", "name")
    .lean();
};
