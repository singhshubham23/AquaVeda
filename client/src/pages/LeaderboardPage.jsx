import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../services/api.js";

const metricLabels = {
  activityScore: "Activity Score",
  reputation: "Reputation",
  issuesReported: "Issues Reported",
  issuesResolved: "Issues Resolved",
  approvedArticles: "Approved Articles",
  questionsAsked: "Questions Asked",
  commentsPosted: "Comments Posted",
  projectsCreated: "Projects Created",
  projectsContributed: "Projects Contributed",
  acceptedAnswers: "Accepted Answers",
};

const topBadgeStyles = [
  "from-amber-400 to-yellow-500 text-amber-950",
  "from-slate-300 to-slate-400 text-slate-900",
  "from-orange-500 to-rose-500 text-white",
];

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function LeaderCard({ rank, contributor }) {
  const podiumClass = topBadgeStyles[rank - 1];
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${podiumClass || "from-teal-500 to-emerald-500 text-white"}`}>
            <span className="text-xl font-black">#{rank}</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Top Contributor</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">{contributor.name}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{contributor.role}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(contributor.badges || []).slice(0, 4).map((badge) => (
                <span key={badge} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  {badge.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
          <StatPill label="Activity Score" value={contributor.activityScore} />
          <StatPill label="Reputation" value={contributor.reputation} />
          <StatPill label="Issues" value={contributor.issuesReported} />
          <StatPill label="Comments" value={contributor.commentsPosted} />
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Resolved</p>
            <p className="mt-1 text-sm font-black text-slate-800">{contributor.issuesResolved}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Approved Articles</p>
            <p className="mt-1 text-sm font-black text-slate-800">{contributor.approvedArticles}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Projects</p>
            <p className="mt-1 text-sm font-black text-slate-800">{contributor.projectsCreated + contributor.projectsContributed}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Accepted Answers</p>
            <p className="mt-1 text-sm font-black text-slate-800">{contributor.acceptedAnswers}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function MetricBadge({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-teal-500 bg-teal-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function LeaderboardPage() {
  const [metric, setMetric] = useState("activityScore");

  const { data, isFetching, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    placeholderData: { data: { topContributors: [], totals: {} } },
  });

  const payload = data?.data || data || {};
  const leaders = payload.topContributors || [];
  const totals = payload.totals || {};
  const totalLeaders = payload.totalLeaders ?? leaders.length;

  const sortedByMetric = useMemo(() => {
    const copy = [...leaders];
    return copy.sort((left, right) => (Number(right?.[metric]) || 0) - (Number(left?.[metric]) || 0));
  }, [leaders, metric]);

  const topThree = sortedByMetric.slice(0, 3);
  const totalScore = leaders.reduce((sum, item) => sum + (Number(item?.activityScore) || 0), 0);

  useEffect(() => {
    if (window.location.hash.replace("#", "") !== "leaderboard-list") return;

    const timer = window.setTimeout(() => {
      document.getElementById("leaderboard-list")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [leaders.length]);

  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-teal-700 via-cyan-700 to-emerald-600 shadow-xl">
        <div className="p-6 text-white md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">Leaderboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Top contributors and activity score</h1>
          <p className="mt-3 max-w-3xl text-cyan-50">
            See who is driving the most impact across issues, knowledge posts, comments, projects, and community participation.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-100">Contributors</p>
              <p className="mt-1 text-2xl font-black">{totalLeaders}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-100">Total Score</p>
              <p className="mt-1 text-2xl font-black">{totalScore}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-100">Total Reputation</p>
              <p className="mt-1 text-2xl font-black">{totals.reputation || 0}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-100">Accepted Answers</p>
              <p className="mt-1 text-2xl font-black">{totals.acceptedAnswers || 0}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Failed to load leaderboard.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {topThree.map((contributor, index) => (
          <LeaderCard key={contributor._id} rank={index + 1} contributor={contributor} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Score filters</h2>
            <p className="mt-1 text-sm text-slate-500">Sort the board by the kind of activity you want to spotlight.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(metricLabels).map((key) => (
              <MetricBadge key={key} active={metric === key} onClick={() => setMetric(key)}>
                {metricLabels[key]}
              </MetricBadge>
            ))}
          </div>
        </div>

        {isFetching && leaders.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <h3 className="text-lg font-black text-slate-900">No leaderboard data yet</h3>
            <p className="mt-2 text-sm text-slate-500">Once contributors report issues, answer questions, and contribute articles, their activity will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200" id="leaderboard-list">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">Contributor</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">{metricLabels[metric]}</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">Reputation</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedByMetric.map((contributor, index) => (
                    <tr key={contributor._id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-black text-slate-900">#{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900">{contributor.name}</p>
                          <p className="text-xs text-slate-500">{contributor.verified ? "Verified contributor" : "Community contributor"}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-600">{contributor.role}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-black text-teal-700">{Number(contributor[metric]) || 0}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-black text-slate-900">{contributor.reputation}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-700">
                            Issues {contributor.issuesReported}
                          </span>
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-700">
                            Articles {contributor.approvedArticles}
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                            Comments {contributor.commentsPosted}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                            Score {contributor.activityScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
