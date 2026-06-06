import { getMapInsights } from "../../data/mapInsights.js";

const legendItems = [
  { label: "Critical", color: "bg-red-500" },
  { label: "High", color: "bg-orange-500" },
  { label: "Medium", color: "bg-amber-400" },
  { label: "Resolved", color: "bg-emerald-500" },
];

export default function MapInsightsBar({ issues = [] }) {
  const insights = getMapInsights(issues);

  return (
    <section className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-sm p-5 md:p-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Water Response Map</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-black text-slate-800">
            See where water problems are clustered and which zones need action first.
          </h2>
          <p className="mt-2 text-sm md:text-base text-slate-600 leading-7">
            Each point represents a live issue. Larger translucent zones show the likely impact area, so the map reads as an operational response surface instead of a generic map.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">{item.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mr-1">Legend</span>
        {legendItems.map((item) => (
          <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
