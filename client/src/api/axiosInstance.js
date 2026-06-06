import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const tenantHeaderName = "x-tenant-id";
const tenantStorageKey = "tenant_id";
const tokenStorageKey = "token";
const defaultTenant = import.meta.env.VITE_DEFAULT_TENANT_ID || "public";
const authRoutePattern =
  /\/v1\/auth\/(login|register|refresh|forgot-password|reset-password)(\/|$)/;

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const requestUrl = config.url || "";
    const isAuthRoute = authRoutePattern.test(requestUrl);
    const tenantId = isAuthRoute
      ? defaultTenant
      : localStorage.getItem(tenantStorageKey) || defaultTenant;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers[tenantHeaderName] = tenantId;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    if (response?.data && response.data.success === false) {
      return Promise.reject({
        response: {
          status: response.status,
          data: response.data,
        },
        message: response.data.message || "Request failed",
      });
    }
    return response;
  },
  (error) => {
    // Suppress automatic toasts for specific endpoints if needed
    const isSilenced = error.config?.silenceToast;
    const requestUrl = error.config?.url || "";
    const isAuthRoute = authRoutePattern.test(requestUrl);
    const hasToken = Boolean(localStorage.getItem(tokenStorageKey));

    // Handle token expiry: try silent refresh once and retry original request
    const originalRequest = error.config || {};
    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      !isAuthRoute &&
      hasToken &&
      !originalRequest._retry;

    if (shouldAttemptRefresh) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        return api
          .post("/v1/auth/refresh", { refreshToken })
          .then((res) => {
            const tokens = res.data?.data || res.data || {};
            const newAccess =
              tokens.accessToken || tokens.token || tokens.access_token;
            const newRefresh = tokens.refreshToken || tokens.refresh_token;
            if (newAccess) {
              localStorage.setItem(tokenStorageKey, newAccess);
              if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
              api.defaults.headers.Authorization = `Bearer ${newAccess}`;
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
              return api(originalRequest);
            }
            return Promise.reject(error);
          })
          .catch((refreshErr) => {
            // If refresh fails, fall through and show existing error handling below
            localStorage.removeItem(tokenStorageKey);
            localStorage.removeItem("refreshToken");
            return Promise.reject(refreshErr);
          });
      }
    }

    if (!isSilenced) {
      if (error.response?.status === 401) {
        if (isAuthRoute || !hasToken) {
          toast.error(error.response?.data?.message || "Invalid credentials");
        } else {
          toast.error("Session expired. Please log in again.");
        }
      } else if (error.response?.status === 429) {
        toast.error("Too many requests! Slow down.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
