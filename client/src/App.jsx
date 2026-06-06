import { Suspense, lazy, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./contexts/AuthContext.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AIPanel from "./components/AIPanel.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { hasPermission, PERMISSIONS } from "./lib/accessControl.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const ExplorePage = lazy(() => import("./pages/ExplorePage.jsx"));
const IssueMapPage = lazy(() => import("./pages/IssueMapPage.jsx"));
const LearnPage = lazy(() => import("./pages/LearnPage.jsx"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage.jsx"));
const CommunityPage = lazy(() => import("./pages/CommunityPage.jsx"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const ActPage = lazy(() => import("./pages/ActPage.jsx"));
const MyActivityPage = lazy(() => import("./pages/MyActivityPage.jsx"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage.jsx"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PermissionRoute({ children, anyOf = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (anyOf.length === 0) {
    return children;
  }

  const permissionAllowed = anyOf.some((permission) => hasPermission(user, permission));

  if (!permissionAllowed) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  return children;
}

function AppContent() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/explore" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/health"
              element={
                <div className="p-8 text-center text-slate-500 font-medium">
                  Client ready
                </div>
              }
            />

            <Route path="/" element={<MainLayout />}>
              <Route path="explore" element={<ExplorePage />} />
              <Route path="map" element={<IssueMapPage />} />
              <Route path="act" element={<ActPage />} />
              <Route
                path="activity"
                element={
                  <ProtectedRoute>
                    <PermissionRoute anyOf={[PERMISSIONS.USER_DASHBOARD_READ]}>
                      <MyActivityPage />
                    </PermissionRoute>
                  </ProtectedRoute>
                }
              />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route
                path="community"
                element={
                  <ProtectedRoute>
                    <PermissionRoute anyOf={[PERMISSIONS.COMMUNITY_READ]}>
                      <CommunityPage />
                    </PermissionRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="leaderboard"
                element={
                  <ProtectedRoute>
                    <PermissionRoute anyOf={[PERMISSIONS.LEADERBOARD_READ]}>
                      <LeaderboardPage />
                    </PermissionRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <PermissionRoute anyOf={[PERMISSIONS.USER_DASHBOARD_READ]}>
                      <DashboardPage />
                    </PermissionRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/explore" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      {/* Floating AI Button */}
      <button
        type="button"
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl hover:scale-105 active:scale-95"
        title="AI Assistant"
      >
        🤖
      </button>

      {/* AI Panel Drawer */}
      <AIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            background: "#1e293b",
            color: "#f8fafc",
            fontSize: "14px",
            fontWeight: 600,
          },
        }}
      />
      <AppContent />
    </BrowserRouter>
  );
}
