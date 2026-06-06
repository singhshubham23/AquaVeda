const severityStyles = {
  CRITICAL: "bg-red-100 text-red-700 ring-1 ring-red-200",
  HIGH:     "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  MEDIUM:   "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200",
  LOW:      "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

const statusStyles = {
  OPEN:        "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED:    "bg-teal-100 text-teal-700",
  VERIFIED:    "bg-emerald-100 text-emerald-700",
  CLOSED:      "bg-slate-100 text-slate-600",
  open:        "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved:    "bg-teal-100 text-teal-700",
  verified:    "bg-emerald-100 text-emerald-700",
  closed:      "bg-slate-100 text-slate-600",
};

export default function IssueHeader({ issue }) {
  const sev = (issue.severity || "LOW").toUpperCase();
  return (
    <div className="p-6 md:p-7 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white rounded-t-3xl">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 leading-snug line-clamp-2">{issue.title}</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">{issue.region || "Unknown region"}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${severityStyles[sev] || "bg-slate-100 text-slate-600"}`}>
            {sev}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyles[issue.status] || "bg-slate-100 text-slate-600"}`}>
            {issue.status?.replace("_", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}
