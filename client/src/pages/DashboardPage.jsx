import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getAdminDashboard, getUserDashboard } from "../services/api.js";
import { resolveStatDestination } from "../lib/statNavigation.js";
import { hasPermission, PERMISSIONS } from "../lib/accessControl.js";

const RoleChart = lazy(() => import("../components/dashboard/RoleChart.jsx"));
const StatusBarChart = lazy(() => import("../components/dashboard/StatusBarChart.jsx"));
const ModerationPanel = lazy(() => import("../components/dashboard/ModerationPanel.jsx"));

const prefetchDashboardCharts = () => {
  void import("../components/dashboard/RoleChart.jsx");
  void import("../components/dashboard/StatusBarChart.jsx");
  void import("../components/dashboard/ModerationPanel.jsx");
};

function StatCard({ label, value, tone = "slate", to }) {
  const tones = {
    slate: "bg-slate-50 border-slate-200 text-slate-800",
    teal: "bg-teal-50 border-teal-200 text-teal-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
  };

  const className = `rounded-2xl border p-4 transition-all ${
    tones[tone] || tones.slate
  } ${to ? "block cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400" : ""}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
        <p className="mt-2 text-3xl font-black leading-none">{value}</p>
      </Link>
    );
  }

  return (
    <article className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none">{value}</p>
    </article>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
      {text}
    </div>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [mode, setMode] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false);
  const chartSectionRef = useRef(null);
  const prefetchTimerRef = useRef(null);
  const chartsPrefetchedRef = useRef(false);

  const canViewAdmin = hasPermission(user, PERMISSIONS.ADMIN_DASHBOARD_READ);

  const userStats = dashboard?.stats || {};
  const issuesReported = Number(userStats.issuesReported || 0);
  const issuesResolved = Number(userStats.resolvedIssues || 0);
  const resolutionRate = issuesReported > 0 ? Math.round((issuesResolved / issuesReported) * 100) : 0;

  const userCards = useMemo(
    () => [
      { label: "Issues Reported", value: userStats.issuesReported ?? 0, tone: "teal", to: resolveStatDestination("Issues Reported", "dashboard") },
      { label: "Issues Resolved", value: userStats.resolvedIssues ?? 0, tone: "emerald", to: resolveStatDestination("Issues Resolved", "dashboard") },
      { label: "Wiki Articles", value: userStats.wikiArticles ?? 0, tone: "blue", to: resolveStatDestination("Wiki Articles", "dashboard") },
      { label: "Approved Wiki", value: userStats.approvedWikiArticles ?? 0, tone: "amber", to: resolveStatDestination("Approved Wiki", "dashboard") },
      { label: "Projects Created", value: userStats.projectsCreated ?? 0, to: resolveStatDestination("Projects Created", "dashboard") },
      { label: "Projects Joined", value: userStats.projectsContributing ?? 0, to: resolveStatDestination("Projects Joined", "dashboard") },
      { label: "Comments Posted", value: userStats.commentsPosted ?? 0, to: resolveStatDestination("Comments Posted", "dashboard") },
      { label: "Resolution Rate", value: `${resolutionRate}%`, to: resolveStatDestination("Resolution Rate", "dashboard") },
    ],
    [userStats, resolutionRate]
  );

  const adminCards = useMemo(
    () => [
      { label: "Total Users", value: dashboard?.users ?? 0, tone: "teal", to: resolveStatDestination("Total Users", "dashboard") },
      { label: "Total Issues", value: dashboard?.issues ?? 0, tone: "blue", to: resolveStatDestination("Total Issues", "dashboard") },
      { label: "Total Projects", value: dashboard?.projects ?? 0, tone: "emerald", to: resolveStatDestination("Total Projects", "dashboard") },
      { label: "Pending Articles", value: dashboard?.pendingArticles ?? 0, tone: "amber", to: resolveStatDestination("Pending Articles", "dashboard") },
    ],
    [dashboard]
  );

  const cards = mode === "admin" && canViewAdmin ? adminCards : userCards;

  useEffect(() => {
    setShouldRenderCharts(false);
  }, [mode]);

  useEffect(() => {
    if (!canViewAdmin && mode === "admin") {
      setMode("user");
    }
  }, [canViewAdmin, mode]);

  useEffect(() => {
    if (!dashboard || mode !== "admin" || !canViewAdmin || chartsPrefetchedRef.current) return;

    const schedulePrefetch = () => {
      chartsPrefetchedRef.current = true;
      prefetchDashboardCharts();
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(schedulePrefetch, { timeout: 1500 });
      prefetchTimerRef.current = () => window.cancelIdleCallback(idleId);
      return () => {
        prefetchTimerRef.current?.();
        prefetchTimerRef.current = null;
      };
    }

    const timeoutId = window.setTimeout(schedulePrefetch, 1200);
    prefetchTimerRef.current = () => window.clearTimeout(timeoutId);
    return () => {
      prefetchTimerRef.current?.();
      prefetchTimerRef.current = null;
    };
  }, [dashboard, mode, canViewAdmin]);

  useEffect(() => {
    if (!dashboard || mode !== "admin" || !canViewAdmin || shouldRenderCharts) return;

    const target = chartSectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderCharts(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0.15 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [dashboard, mode, canViewAdmin, shouldRenderCharts]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = mode === "admin" ? await getAdminDashboard() : await getUserDashboard();
      setDashboard(response?.data || response || null);
    } catch (err) {
      setDashboard(null);
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, token]);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 shadow-xl">
        <div className="p-6 md:p-8 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100 font-semibold">Dashboard</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Impact Intelligence Center</h1>
          <p className="mt-2 text-cyan-50 max-w-2xl">View performance, contribution metrics, and governance signals in one place.</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl bg-white/15 p-1 border border-white/20">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${mode === "user" ? "bg-white text-teal-700" : "text-white hover:bg-white/10"}`}
                onClick={() => setMode("user")}
              >
                User View
              </button>
              {canViewAdmin ? (
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${mode === "admin" ? "bg-white text-teal-700" : "text-white hover:bg-white/10"}`}
                  onClick={() => setMode("admin")}
                >
                  Admin View
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading || !token}
              className="px-4 py-2 rounded-xl border border-white/40 text-white text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>

            {!canViewAdmin ? (
              <p className="text-xs text-cyan-100">Admin analytics unlock for ADMIN role.</p>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {dashboard && mode === "user" ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Your Impact</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{dashboard.profile?.name || "User"}</h2>
              <p className="text-slate-500 text-sm mt-1">{dashboard.profile?.email || ""}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-auto w-full">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 uppercase">Role</p>
                <p className="text-lg font-extrabold text-slate-800">{dashboard.profile?.role || "-"}</p>
              </div>
              <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
                <p className="text-xs text-teal-700 uppercase">Reputation</p>
                <p className="text-lg font-extrabold text-teal-800">{dashboard.profile?.reputation ?? 0}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {cards.length ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" id="dashboard-stats">
          {cards.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} to={item.to} />
          ))}
        </section>
      ) : loading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <EmptyState text="No dashboard data loaded yet." />
      )}

      {dashboard && mode === "admin" && canViewAdmin ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" ref={chartSectionRef}>
          <h2 className="text-xl font-black text-slate-800 mb-4">Analytics Overview</h2>
          {shouldRenderCharts ? (
            <Suspense fallback={<p className="text-sm text-slate-500">Loading analytics visualizations...</p>}>
              <div className="charts">
                <RoleChart data={dashboard.roleSplit} />
                <StatusBarChart title="Issue Status Distribution" data={dashboard.issueStatus} />
                <StatusBarChart title="Project Progress Overview" data={dashboard.projectStatus} />
                {dashboard.regionalMetrics ? <StatusBarChart title="Issues by Region" data={dashboard.regionalMetrics} /> : null}
              </div>
            </Suspense>
          ) : (
            <p className="text-sm text-slate-500">Scroll slightly to load visualizations.</p>
          )}
        </section>
      ) : null}

      {dashboard?.recent && mode === "admin" && canViewAdmin ? (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Recent Issues</h3>
            {dashboard.recent.issues?.length ? (
              <div className="space-y-3">
                {dashboard.recent.issues.map((issue) => (
                  <div key={issue._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between gap-2 items-start">
                      <p className="font-semibold text-slate-800">{issue.title}</p>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">{issue.severity}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {issue.status} | by {issue.reportedBy?.name || "Unknown"} | {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No recent issues found.</p>
            )}
          </article>

          <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Recent Projects</h3>
            {dashboard.recent.projects?.length ? (
              <div className="space-y-3">
                {dashboard.recent.projects.map((project) => (
                  <div key={project._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between gap-2 items-start">
                      <p className="font-semibold text-slate-800">{project.title}</p>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-teal-100 text-teal-700">{project.progress ?? 0}%</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {project.status} | by {project.createdBy?.name || "Unknown"} | {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No recent projects found.</p>
            )}
          </article>
        </section>
      ) : null}

      {mode === "admin" && canViewAdmin ? (
        <section>
          <Suspense fallback={<p className="text-sm text-slate-500">Loading moderation panel...</p>}>
            <ModerationPanel />
          </Suspense>
        </section>
      ) : null}
    </main>
  );
}
