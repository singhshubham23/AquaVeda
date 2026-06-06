import { error, success } from "../../utils/response.js";
import * as aiService from "./ai.service.js";

export const recommend = async (req, res, next) => {
  try {
    const recommendations = await aiService.getRecommendations(req.params.id, req.tenantId);
    return success(res, recommendations, "Recommendations fetched");
  } catch (err) {
    next(err);
  }
};

export const classify = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return error(res, "Title and description are required", 400);
    }
    
    const classification = await aiService.classifyIssue(title, description);
    return success(res, classification, "Issue classified");
  } catch (err) {
    next(err);
  }
};

export const checkDuplicates = async (req, res, next) => {
  try {
    const { title, lng, lat } = req.body;
    
    if (!title || lng === undefined || lat === undefined) {
      return error(res, "Title, lng, and lat are required", 400);
    }
    
    const duplicates = await aiService.detectDuplicates(
      title, 
      Number.parseFloat(lng), 
      Number.parseFloat(lat),
      req.tenantId
    );
    
    return success(res, duplicates, "Duplicate check complete");
  } catch (err) {
    next(err);
  }
};
