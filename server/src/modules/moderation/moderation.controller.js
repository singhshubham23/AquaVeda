import { success } from "../../utils/response.js";
import * as moderationService from "./moderation.service.js";

export const report = async (req, res, next) => {
  try {
    const reportDoc = await moderationService.createReport(req.body, req.user.id, req.tenantId);
    return success(res, reportDoc, "Report submitted successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const listReports = async (req, res, next) => {
  try {
    const reports = await moderationService.getReports(req.tenantId, req.query);
    return success(res, reports, "Reports fetched");
  } catch (err) {
    next(err);
  }
};

export const reviewReport = async (req, res, next) => {
  try {
    const reportDoc = await moderationService.reviewReport(
      req.params.id,
      req.body,
      req.user.id,
      req.tenantId,
      req.user.role,
    );
    return success(res, reportDoc, "Report reviewed successfully");
  } catch (err) {
    next(err);
  }
};
