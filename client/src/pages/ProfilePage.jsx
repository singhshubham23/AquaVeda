import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getUserDashboard } from "../services/api.js";
import { resolveStatDestination } from "../lib/statNavigation.js";

function StatTile({ label, value, to }) {
  const cardClassName = `bg-white/90 border border-slate-200 rounded-3xl p-5 shadow-sm transition-all ${
    to ? "block cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400" : ""
  }`;

  if (to) {
    return (
      <Link to={to} className={cardClassName}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          {label}
        </p>
        <p className="mt-3 text-3xl font-extrabold text-slate-800">{value}</p>
      </Link>
    );
  }

  return (
    <div className={cardClassName}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data, isFetching } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: getUserDashboard,
    placeholderData: { data: { profile: user, stats: {} } },
  });

  const profile = data?.data?.profile || user;
  const stats = data?.data?.stats || {};

  const contributions = useMemo(
    () => [
      { label: "Issues Reported", value: stats.issuesReported || 0, to: resolveStatDestination("Issues Reported", "profile") },
      { label: "Issues Resolved", value: stats.resolvedIssues || 0, to: resolveStatDestination("Issues Resolved", "profile") },
      { label: "Articles Submitted", value: stats.wikiArticles || 0, to: resolveStatDestination("Articles Submitted", "profile") },
      { label: "Approved Articles", value: stats.approvedWikiArticles || 0, to: resolveStatDestination("Approved Articles", "profile") },
      { label: "Projects Created", value: stats.projectsCreated || 0, to: resolveStatDestination("Projects Created", "profile") },
      { label: "Projects Joined", value: stats.projectsContributing || 0, to: resolveStatDestination("Projects Joined", "profile") },
      { label: "Comments", value: stats.commentsPosted || 0, to: resolveStatDestination("Comments", "profile") },
    ],
    [stats],
  );

  const reputation = profile?.reputation ?? 0;

  const trustTier = useMemo(() => {
    const tiers = [
      { min: 0,    label: "Newcomer",    icon: "🌱", badgeClass: "bg-slate-100 text-slate-600",   nextAt: 50  },
      { min: 50,   label: "Contributor", icon: "🌿", badgeClass: "bg-green-100 text-green-700",   nextAt: 200 },
      { min: 200,  label: "Advocate",    icon: "💧", badgeClass: "bg-blue-100 text-blue-700",     nextAt: 500 },
      { min: 500,  label: "Guardian",    icon: "🛡️", badgeClass: "bg-indigo-100 text-indigo-700", nextAt: 1000 },
      { min: 1000, label: "Champion",    icon: "🏆", badgeClass: "bg-amber-100 text-amber-700",   nextAt: 0   },
    ];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (reputation >= tiers[i].min) return tiers[i];
    }
    return tiers[0];
  }, [reputation]);

  const earnedBadges = useMemo(() => {
    const badges = [];
    if ((stats.issuesReported || 0) >= 1)
      badges.push({ icon: "🚨", label: "First Report",     color: "bg-red-50 text-red-700",     desc: "Reported your first issue" });
    if ((stats.issuesReported || 0) >= 10)
      badges.push({ icon: "🔥", label: "Prolific Reporter", color: "bg-orange-50 text-orange-700", desc: "Reported 10+ issues" });
    if ((stats.resolvedIssues || 0) >= 1)
      badges.push({ icon: "✅", label: "Problem Solver",    color: "bg-emerald-50 text-emerald-700", desc: "Resolved your first issue" });
    if ((stats.commentsPosted || 0) >= 5)
      badges.push({ icon: "💬", label: "Active Voice",      color: "bg-blue-50 text-blue-700",   desc: "Posted 5+ comments" });
    if ((stats.approvedWikiArticles || 0) >= 1)
      badges.push({ icon: "📚", label: "Knowledge Keeper",  color: "bg-purple-50 text-purple-700", desc: "Got a wiki article approved" });
    if ((stats.projectsCreated || 0) >= 1)
      badges.push({ icon: "🚀", label: "Initiative",        color: "bg-teal-50 text-teal-700",   desc: "Created your first project" });
    return badges;
  }, [stats]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-500 tracking-tight">
            My Profile
          </h1>
          <p className="text-slate-600 mt-2 font-medium">
            View your contribution history, role, and community impact.
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] mb-10">
        <div className="bg-white/90 border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {profile?.name || "Anonymous"}
              </p>
              <p className="text-sm text-slate-500">
                {profile?.email || "No email"}
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Role</span>
              <span className="font-semibold text-slate-900">
                {profile?.role || "Member"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Verified</span>
              <span
                className={`font-semibold ${profile?.verified ? "text-emerald-700" : "text-slate-500"}`}
              >
                {profile?.verified ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* Trust Tier System */}
          <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trust Level</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trustTier.badgeClass}`}>
                {trustTier.icon} {trustTier.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-extrabold text-teal-700">{reputation}</span>
              <span className="text-xs text-slate-400 font-medium">/ {trustTier.nextAt > 0 ? trustTier.nextAt : "∞"} pts</span>
            </div>
            {trustTier.nextAt > 0 && (
              <div className="mt-2">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (reputation / trustTier.nextAt) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{trustTier.nextAt - reputation} pts to next tier</p>
              </div>
            )}
          </div>

          {/* Earned Badges */}
          <div className="mt-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Earned Badges</p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.length === 0 && (
                <p className="text-xs text-slate-400 italic">Report issues and contribute to earn badges!</p>
              )}
              {earnedBadges.map((badge) => (
                <span
                  key={badge.label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${badge.color}`}
                  title={badge.desc}
                >
                  {badge.icon} {badge.label}
                </span>
              ))}
              {(profile?.badges || []).map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-full bg-teal-50 text-teal-700 px-3 py-1.5 text-xs font-bold"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contributions.map((item) => (
            <StatTile key={item.label} label={item.label} value={item.value} to={item.to} />
          ))}
        </div>
      </section>

      <section className="bg-white/90 border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Contribution Insights
            </h2>
            <p className="text-sm text-slate-500">
              Your activity across issues, community comments, and knowledge
              contributions.
            </p>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
            Updated automatically
          </span>
        </div>
        {isFetching ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-500">
                Top strength
              </h3>
              <p className="mt-3 text-lg font-bold text-slate-800">
                Community Engagement
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-500">
                Role focus
              </h3>
              <p className="mt-3 text-lg font-bold text-slate-800">
                {profile?.role || "Member"}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-500">
                Network value
              </h3>
              <p className="mt-3 text-lg font-bold text-slate-800">
                {stats.issuesReported +
                  stats.commentsPosted +
                  stats.approvedWikiArticles || 0}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
