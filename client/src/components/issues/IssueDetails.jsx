export default function IssueDetails({ issue }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5 md:p-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.18em] mb-3">Overview</h3>
      <p className="text-base md:text-[17px] text-slate-700 leading-7">{issue.description || "No description provided."}</p>
      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.16em]">Status</p>
          <p className="text-sm md:text-base font-bold text-slate-700 mt-1">{issue.status?.replace("_", " ") || "-"}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.16em]">Region</p>
          <p className="text-sm md:text-base font-bold text-slate-700 mt-1">{issue.region || "Global"}</p>
        </div>
        {issue.reportedBy?.name && (
          <div className="col-span-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.16em]">Reported By</p>
            <p className="text-sm md:text-base font-bold text-slate-700 mt-1">{issue.reportedBy.name}</p>
          </div>
        )}
      </div>

      {issue.images && issue.images.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.16em] mb-3">Photos</p>
          <div className="grid grid-cols-3 gap-2">
            {issue.images.map((img, idx) => (
              <img
                key={idx}
                src={issue.imageThumbnails?.[idx] || img}
                alt={`Evidence ${idx + 1}`}
                className="w-full h-24 md:h-28 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(img, "_blank")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
