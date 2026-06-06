import RegionFilter from "./RegionFilter.jsx";
import SeverityFilter from "./SeverityFilter.jsx";
import StatusFilter from "./StatusFilter.jsx";
import { AnimatePresence, motion } from "framer-motion";

export default function FilterPanel({ filters, onChange, issues = [] }) {
  const severityCounts = issues.reduce((acc, issue) => {
    const key = issue.severity || "LOW";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = issues.reduce((acc, issue) => {
    const key = issue.status || "OPEN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const activeFilters = [
    filters.severity ? { key: "severity", label: filters.severity } : null,
    filters.status ? { key: "status", label: filters.status.replace("_", " ") } : null,
    filters.region ? { key: "region", label: `📍 ${filters.region}` } : null,
  ].filter(Boolean);

  const clearFilter = (key) => onChange({ ...filters, [key]: "" });
  const resetFilters = () => onChange({ severity: "", status: "", region: "" });

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-sm p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-base font-extrabold text-slate-800">Filters</h3>
        <p className="text-sm text-slate-500 mt-1">Narrow the map to high-impact issues.</p>
      </div>

      <div className="min-h-[32px]">
        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {activeFilters.map((item) => (
                <motion.button
                  type="button"
                  key={item.key}
                  onClick={() => clearFilter(item.key)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold bg-teal-100 text-teal-800 rounded-full hover:bg-teal-200 transition-colors"
                >
                  {item.label}
                  <span className="ml-0.5 text-teal-500">×</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No active filters</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <SeverityFilter value={filters.severity} counts={severityCounts} onChange={(severity) => onChange({ ...filters, severity })} />
        <StatusFilter value={filters.status} counts={statusCounts} onChange={(status) => onChange({ ...filters, status })} />
        <RegionFilter value={filters.region} onChange={(region) => onChange({ ...filters, region })} />
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full py-3 text-sm font-bold text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-2xl transition-all hover:bg-red-50"
      >
        Reset All Filters
      </button>

      <div className="pt-4 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Issue Summary</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-slate-800">{issues.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.16em] mt-1">Total</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-red-700">{severityCounts["CRITICAL"] || 0}</p>
            <p className="text-xs font-bold text-red-400 uppercase tracking-[0.16em] mt-1">Critical</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-amber-700">{statusCounts["OPEN"] || 0}</p>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-[0.16em] mt-1">Open</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-emerald-700">{statusCounts["RESOLVED"] || 0}</p>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-[0.16em] mt-1">Resolved</p>
          </div>
        </div>
      </div>
    </div>
  );
}
