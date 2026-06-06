export default function RegionFilter({ value, onChange }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Region</p>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📍</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. Delhi, West Zone"
          className="w-full pl-8 pr-4 py-3 text-base border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
        />
      </div>
    </div>
  );
}
