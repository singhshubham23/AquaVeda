import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../services/api.js";

function LeaderCard({ rank, contributor }) {
  return (
    <article className="bg-white/90 border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-[0.24em]">
            Rank
          </p>
          <p className="text-4xl font-extrabold text-teal-700">#{rank}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-800">{contributor.name}</p>
          <p className="text-sm text-slate-500">{contributor.role}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-semibold text-slate-800">Reputation</p>
          <p className="mt-2 text-xl font-bold text-teal-700">
            {contributor.reputation}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-semibold text-slate-800">Articles</p>
          <p className="mt-2 text-xl font-bold text-slate-700">
            {contributor.approvedArticles}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-semibold text-slate-800">Issues</p>
          <p className="mt-2 text-xl font-bold text-slate-700">
            {contributor.issuesReported}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-semibold text-slate-800">Comments</p>
          <p className="mt-2 text-xl font-bold text-slate-700">
            {contributor.commentsPosted}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function LeaderboardPage() {
  const { data, isFetching, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    placeholderData: { data: { topContributors: [] } },
  });

  const leaders = data?.data?.topContributors || data?.topContributors || [];
  const totalLeaders = data?.data?.totalLeaders ?? data?.totalLeaders ?? leaders.length;
  const totalReputation = leaders.reduce((sum, item) => sum + (Number(item?.reputation) || 0), 0);

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
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-500 tracking-tight">
            Community Leaderboard
          </h1>
          <p className="text-slate-600 mt-2 font-medium">
            Recognizing the top contributors advancing water resilience and
            sustainability.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Leaders</p>
            <p className="text-xl font-extrabold text-slate-800">{totalLeaders}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Reputation</p>
            <p className="text-xl font-extrabold text-teal-700">{totalReputation}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-700">
          Failed to load leaderboard.
        </div>
      )}

      <div
        className="grid gap-6"
        id="leaderboard-list"
      >
        {isFetching && leaders.length === 0 ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-slate-200 rounded-3xl bg-white/70">
            <h2 className="text-xl font-bold text-slate-800">
              No leaderboard data available
            </h2>
            <p className="text-slate-500 mt-3">
              Contributions will appear here as users report issues, share
              articles, and collaborate.
            </p>
          </div>
        ) : (
          leaders.map((contributor, index) => (
            <LeaderCard
              key={contributor._id}
              rank={index + 1}
              contributor={contributor}
            />
          ))
        )}
      </div>
    </div>
  );
}
