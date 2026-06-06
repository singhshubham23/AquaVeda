import { useQuery } from "@tanstack/react-query";
import { getModerationQueue } from "../../services/api.js";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ModerationPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: getModerationQueue,
    refetchInterval: 30000,
  });

  const queue = data?.data || {};
  const flaggedComments = queue.flaggedComments || [];
  const spamIssues = queue.spamIssues || [];
  const totalItems = flaggedComments.length + spamIssues.length;

  if (isLoading) {
    return (
      <div className="bg-white/90 border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading moderation queue...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 border border-red-200 rounded-3xl p-6 shadow-sm">
        <p className="text-sm text-red-600">Failed to load moderation queue.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-800">🛡️ Moderation Queue</h3>
          <p className="text-xs text-slate-500 mt-0.5">Flagged comments and AI-detected spam</p>
        </div>
        {totalItems > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {totalItems} pending
          </span>
        )}
      </div>

      {totalItems === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">✨</p>
          <p className="text-sm font-semibold text-slate-600">All clear!</p>
          <p className="text-xs text-slate-400 mt-1">No flagged items need your attention.</p>
        </div>
      )}

      {/* Flagged Comments */}
      {flaggedComments.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Flagged Comments ({flaggedComments.length})
          </p>
          <div className="space-y-2">
            {flaggedComments.map((comment) => (
              <div
                key={comment._id}
                className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">
                    {comment.user?.name || "Unknown"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{comment.content}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    🚩 Flagged
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {comment.refType} • {comment.refId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spam Issues */}
      {spamIssues.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Spam Issues ({spamIssues.length})
          </p>
          <div className="space-y-2">
            {spamIssues.map((issue) => (
              <div
                key={issue._id}
                className="p-3 bg-red-50/60 border border-red-200 rounded-xl"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-700">
                    {issue.title}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700`}>
                    {issue.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{issue.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    🤖 AI Spam
                  </span>
                  <span className="text-[10px] text-slate-400">
                    by {issue.reportedBy?.name || "Unknown"} • {formatDate(issue.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
