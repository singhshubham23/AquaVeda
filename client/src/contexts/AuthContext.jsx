import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axiosInstance.js";
import { getPermissionsForRole, normalizeRole } from "../lib/accessControl.js";

const tokenStorageKey = "token";
const tenantStorageKey = "tenant_id";
const AuthContext = createContext(null);
const authRoutePattern =
  /\/v1\/auth\/(login|register|refresh|forgot-password|reset-password)(\/|$)/;

const normalizeUser = (inputUser) => {
  if (!inputUser) return null;

  const role = normalizeRole(inputUser.role);
  return {
    ...inputUser,
    role,
    permissions: Array.isArray(inputUser.permissions)
      ? inputUser.permissions
      : getPermissionsForRole(role),
  };
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem(tokenStorageKey) || "",
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem(tokenStorageKey)),
  );

  useEffect(() => {
    // Ejector to clear auth state dynamically on 401
    const ejector = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const requestUrl = err.config?.url || "";
        const isAuthRoute = authRoutePattern.test(requestUrl);
        if (err.response?.status === 401 && !isAuthRoute) {
          logout();
        }
        return Promise.reject(err);
      },
    );
    return () => {
      api.interceptors.response.eject(ejector);
    };
  }, []);

  useEffect(() => {
    const hydrateUser = async () => {
      if (!token) {
        setUser(null);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get("/v1/auth/me", { silenceToast: true });
        setUser(normalizeUser(data.data || null));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, [token]);

  const login = async (credentials) => {
    const { data: payload } = await api.post("/v1/auth/login", credentials);
    const nextToken = payload.data?.accessToken || payload.data?.token || "";
    const nextUser = normalizeUser(payload.data?.user || null);
    const nextRefresh =
      payload.data?.refreshToken || payload.data?.refresh_token || null;
    const nextTenantId =
      nextUser?.tenantId || localStorage.getItem(tenantStorageKey) || "public";

    localStorage.setItem(tokenStorageKey, nextToken);
    if (nextRefresh) localStorage.setItem("refreshToken", nextRefresh);
    localStorage.setItem(tenantStorageKey, nextTenantId);
    setToken(nextToken);
    setUser(nextUser);

    return payload;
  };

  const register = async (credentials) => {
    const { data: payload } = await api.post("/v1/auth/register", credentials);
    return payload;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post("/v1/auth/logout", {}, { silenceToast: true });
      }
    } catch {
      // no-op: local cleanup still required
    }
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(tenantStorageKey);
    localStorage.removeItem("refreshToken");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      normalizeUser,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
