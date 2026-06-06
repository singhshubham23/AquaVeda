import { error, success } from "../../utils/response.js";
import * as projectService from "./project.service.js";

export const create = async (req, res, next) => {
  try {
    const { title, description, relatedIssue } = req.body;

    if (!title || !description || !relatedIssue) {
      return error(res, "title, description, and relatedIssue are required", 400);
    }

    const project = await projectService.createProject(req.body, req.user.id, req.tenantId);
    return success(res, project, "Project created", 201);
  } catch (err) {
    return next(err);
  }
};

export const join = async (req, res, next) => {
  try {
    const project = await projectService.joinProject(req.params.id, req.user.id, req.tenantId);

    if (!project) {
      return error(res, "Project not found", 404);
    }

    return success(res, project, "Joined project");
  } catch (err) {
    return next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.tenantId, req.query);
    return success(res, projects, "Projects fetched");
  } catch (err) {
    return next(err);
  }
};

export const setProgress = async (req, res, next) => {
  try {
    const progress = req.body.progress;

    const project = await projectService.updateProgress(req.params.id, progress, req.user.id, req.tenantId);
    return success(res, project, "Project progress updated");
  } catch (err) {
    return next(err);
  }
};
