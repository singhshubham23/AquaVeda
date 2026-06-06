const statusOptions = ["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusColors = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

const statusLabels = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default function StatusFilter({ value, onChange, counts = {} }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Status</p>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option || "all-status"}
            type="button"
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 text-sm font-bold rounded-full border transition-all ${
              value === option
                ? option
                  ? `${statusColors[option]} border-transparent ring-2 ring-offset-1 ring-current`
                  : "bg-slate-800 text-white border-transparent"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {option ? `${statusLabels[option]} ${counts[option] ? `(${counts[option]})` : ""}` : "All"}
          </button>
        ))}
      </div>
    </div>
  );
}
