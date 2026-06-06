import api from "../api/axiosInstance.js";
import { enqueueIssueReport } from "../lib/offlineIssueQueue.js";

// Helper to remove empty string parameters
const cleanParams = (params) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== "" && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// ── Auth ──
export const registerUser = async (body) => {
  const { data } = await api.post("/v1/auth/register", body);
  return data;
};

export const loginUser = async (credentials) => {
  const { data } = await api.post("/v1/auth/login", credentials);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/v1/auth/me");
  return data;
};

// ── Dashboard ──
export const getUserDashboard = async () => {
  const { data } = await api.get("/v1/dashboard/user");
  return data;
};

export const getAdminDashboard = async () => {
  const { data } = await api.get("/v1/dashboard/admin");
  return data;
};

export const getLeaderboard = async () => {
  const { data } = await api.get("/v1/dashboard/leaderboard");
  return data;
};

export const getModerationQueue = async () => {
  const { data } = await api.get("/v1/dashboard/moderation");
  return data;
};

// ── Issues ──
export const getIssues = async (params = {}) => {
  const { data } = await api.get("/v1/issues", { params: cleanParams(params) });
  return data;
};

export const getIssueById = async (id) => {
  const { data } = await api.get(`/v1/issues/${id}`);
  return data;
};

export const createIssue = async (payload) => {
  const isFormData = payload instanceof FormData;
  try {
    const { data } = await api.post("/v1/issues", payload, isFormData ? {
      headers: { "Content-Type": "multipart/form-data" }
    } : undefined);
    return data;
  } catch (err) {
    const isNetworkFailure = !err?.response;
    if (isFormData && isNetworkFailure) {
      await enqueueIssueReport(payload);
      return {
        success: true,
        queued: true,
        message: "No internet. Issue queued and will auto-submit when online.",
      };
    }
    throw err;
  }
};

export const updateIssueStatus = async (id, status, note) => {
  const payload = note ? { status, note } : { status };
  const { data } = await api.patch(`/v1/issues/${id}/status`, payload);
  return data;
};

export const deleteIssue = async (id) => {
  const { data } = await api.delete(`/v1/issues/${id}`);
  return data;
};

export const getIssueMapData = async (params = {}) => {
  const { data } = await api.get("/v1/issues/map", {
    params: cleanParams(params),
  });
  return data;
};

export const getFilteredIssues = async (filters = {}) => {
  const { data } = await api.get("/v1/issues/filter", { params: filters });
  return data;
};

export const getIssuesInRadius = async (params = {}) => {
  const { data } = await api.get("/v1/issues/radius", { params: cleanParams(params) });
  return data;
};

// ── Projects ──
export const getProjects = async (params = {}) => {
  const { data } = await api.get("/v1/projects", { params });
  return data;
};

export const createProject = async (payload) => {
  const { data } = await api.post("/v1/projects", payload);
  return data;
};

export const joinProject = async (id) => {
  const { data } = await api.post(`/v1/projects/${id}/join`);
  return data;
};

export const updateProjectProgress = async (id, progress) => {
  const { data } = await api.patch(`/v1/projects/${id}/progress`, { progress });
  return data;
};

// ── Wiki ──
export const getWikiArticles = async () => {
  const { data } = await api.get("/v1/wiki");
  return data;
};

export const getMyWikiArticles = async () => {
  const { data } = await api.get("/v1/wiki/mine");
  return data;
};

export const createWikiArticle = async (payload) => {
  const { data } = await api.post("/v1/wiki", payload);
  return data;
};

export const updateWikiArticle = async (id, payload) => {
  const { data } = await api.patch(`/v1/wiki/${id}`, payload);
  return data;
};

export const approveWikiArticle = async (id) => {
  const { data } = await api.post(`/v1/wiki/${id}/approve`);
  return data;
};

export const rejectWikiArticle = async (id) => {
  const { data } = await api.post(`/v1/wiki/${id}/reject`);
  return data;
};

// ── Comments ──
export const getComments = async (refType, refId) => {
  const { data } = await api.get("/v1/comments", {
    params: { refType, refId },
  });
  return data;
};

export const createComment = async (payload) => {
  const { data } = await api.post("/v1/comments", payload);
  return data;
};

// ── AI ──
export const getIssueRecommendations = async (issueId) => {
  const { data } = await api.get(`/v1/ai/recommend/${issueId}`);
  return data;
};

export const classifyIssue = async (payload) => {
  const { data } = await api.post("/v1/ai/classify", payload);
  return data;
};

export const checkDuplicates = async (payload) => {
  const { data } = await api.post("/v1/ai/duplicates", payload);
  return data;
};

// ── Q&A / Voting ──
export const voteWiki = async (id, type) => {
  const { data } = await api.post(`/v1/wiki/${id}/vote`, { type });
  return data;
};

export const voteComment = async (id, type) => {
  const { data } = await api.post(`/v1/comments/${id}/vote`, { type });
  return data;
};

export const acceptComment = async (id) => {
  const { data } = await api.post(`/v1/comments/${id}/accept`);
  return data;
};
