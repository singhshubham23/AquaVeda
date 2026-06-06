import { error, success } from "../../utils/response.js";
import * as wikiService from "./wiki.service.js";

export const create = async (req, res, next) => {
  try {
    const article = await wikiService.createArticle(req.body, req.user.id, req.tenantId);
    return success(res, article, "Article created", 201);
  } catch (err) {
    return next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const articles = await wikiService.getAllApproved(req.tenantId, req.query);
    return success(res, articles, "Approved articles");
  } catch (err) {
    return next(err);
  }
};

export const approve = async (req, res, next) => {
  try {
    const article = await wikiService.approveArticle(
      req.params.id,
      req.user.id,
      req.tenantId,
      req.user.role,
    );

    if (!article) {
      return error(res, "Article not found", 404);
    }

    return success(res, article, "Article approved");
  } catch (err) {
    return next(err);
  }
};

export const reject = async (req, res, next) => {
  try {
    const article = await wikiService.rejectArticle(req.params.id, req.tenantId, req.user.role);

    if (!article) {
      return error(res, "Article not found", 404);
    }

    return success(res, article, "Article rejected");
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const article = await wikiService.updateArticle(req.params.id, req.body, req.user.id, req.tenantId);
    return success(res, article, "Article updated");
  } catch (err) {
    return next(err);
  }
};

export const getMine = async (req, res, next) => {
  try {
    const articles = await wikiService.getUserArticles(req.user.id, req.tenantId, req.query);
    return success(res, articles, "User articles");
  } catch (err) {
    return next(err);
  }
};

export const vote = async (req, res, next) => {
  try {
    const article = await wikiService.voteWiki(req.params.id, req.user.id, req.body.type, req.tenantId);
    return success(res, article, "Vote recorded");
  } catch (err) {
    return next(err);
  }
};
