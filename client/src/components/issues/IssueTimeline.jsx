const actionMeta = {
  CREATED: { icon: "N", color: "bg-blue-100 text-blue-700", label: "Reported" },
  UPDATED: { icon: "U", color: "bg-slate-100 text-slate-700", label: "Updated" },
  ACKNOWLEDGED: { icon: "A", color: "bg-indigo-100 text-indigo-700", label: "Acknowledged" },
  ASSIGNED: { icon: "S", color: "bg-purple-100 text-purple-700", label: "Assigned" },
  IN_PROGRESS: { icon: "P", color: "bg-amber-100 text-amber-700", label: "In Progress" },
  RESOLVED: { icon: "R", color: "bg-emerald-100 text-emerald-700", label: "Resolved" },
  VERIFIED: { icon: "V", color: "bg-teal-100 text-teal-700", label: "Verified" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IssueTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-sm text-slate-400 italic">No timeline data available.</p>;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />

      <div className="space-y-4">
        {timeline.map((entry, idx) => {
          const meta = actionMeta[entry.action] || {
            icon: "-",
            color: "bg-slate-100 text-slate-600",
            label: entry.action,
          };

          return (
            <div key={idx} className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-teal-500 z-10 flex items-center justify-center">
                <span className="text-[7px] text-white font-bold">{meta.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                  {entry.by?.name && <span className="text-sm text-slate-500">by {entry.by.name}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">{formatDate(entry.createdAt)}</p>
                {entry.note && <p className="text-sm text-slate-600 mt-1 italic leading-6">{entry.note}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
