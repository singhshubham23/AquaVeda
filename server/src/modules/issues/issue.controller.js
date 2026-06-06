import { error, success } from "../../utils/response.js";
import { formatForMap } from "../../utils/geo.js";
import { processUploadedIssueImages } from "../../middlewares/upload.middleware.js";
import * as issueService from "./issue.service.js";

const isValidCoordinate = (lng, lat) => {
  return Number.isFinite(lng) && Number.isFinite(lat);
};

export const create = async (req, res, next) => {
  try {
    const issueData = { ...req.body };
    if (req.files && req.files.length > 0) {
      const processedImages = await processUploadedIssueImages(req.files);
      issueData.images = processedImages.map((item) => item.imageUrl);
      issueData.imageThumbnails = processedImages.map((item) => item.thumbnailUrl);
    }
    
    const issue = await issueService.createIssue(issueData, req.user.id, req.tenantId);
    return success(res, issue, "Issue reported successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const issues = await issueService.getIssues(req.tenantId, req.query);
    return success(res, issues, "Issues fetched");
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const issue = await issueService.getIssueById(req.params.id, req.tenantId);
    return success(res, issue, "Issue fetched");
  } catch (err) {
    next(err);
  }
};

export const getNearby = async (req, res, next) => {
  try {
    const lng = Number.parseFloat(req.query.lng);
    const lat = Number.parseFloat(req.query.lat);

    if (!isValidCoordinate(lng, lat)) {
      return error(res, "Invalid lng or lat query params", 400);
    }

    const issues = await issueService.getNearbyIssues(req.tenantId, lng, lat, req.query);
    return success(res, issues, "Nearby issues fetched");
  } catch (err) {
    next(err);
  }
};

export const getRadiusData = async (req, res, next) => {
  try {
    const lng = Number.parseFloat(req.query.lng);
    const lat = Number.parseFloat(req.query.lat);
    const radiusKm = Number.parseFloat(req.query.radiusKm);

    if (!isValidCoordinate(lng, lat)) {
      return error(res, "Invalid lng or lat query params", 400);
    }

    const result = await issueService.getIssuesInRadius(
      req.tenantId,
      lng,
      lat,
      radiusKm,
      req.query
    );
    return success(res, result, "Radius issues fetched");
  } catch (err) {
    next(err);
  }
};

export const getFiltered = async (req, res, next) => {
  try {
    const issues = await issueService.getFilteredIssues(req.tenantId, req.query, req.query);
    return success(res, issues, "Filtered issues fetched");
  } catch (err) {
    next(err);
  }
};

export const getMapData = async (req, res, next) => {
  try {
    const issues = await issueService.getFilteredIssues(req.tenantId, req.query, { page: 1, limit: 200 });
    const data = formatForMap(issues.items);
    return success(res, data, "Map issues fetched");
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const issue = await issueService.updateIssueStatus(
      req.params.id,
      req.body.status,
      req.body.note,
      req.user,
      req.tenantId
    );
    return success(res, issue, "Issue status updated");
  } catch (err) {
    next(err);
  }
};

export const deleteIssue = async (req, res, next) => {
  try {
    await issueService.deleteIssue(req.params.id, req.user.id, req.user.role, req.tenantId);
    return success(res, null, "Issue deleted successfully");
  } catch (err) {
    next(err);
  }
};
