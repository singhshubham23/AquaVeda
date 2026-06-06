const severityOptions = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const severityColors = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function SeverityFilter({ value, onChange, counts = {} }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Severity</p>
      <div className="flex flex-wrap gap-2">
        {severityOptions.map((option) => (
          <button
            key={option || "all-severity"}
            type="button"
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 text-sm font-bold rounded-full border transition-all ${
              value === option
                ? option
                  ? `${severityColors[option]} border-transparent ring-2 ring-offset-1 ring-current`
                  : "bg-slate-800 text-white border-transparent"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {option ? `${option} ${counts[option] ? `(${counts[option]})` : ""}` : "All"}
          </button>
        ))}
      </div>
    </div>
  );
}
