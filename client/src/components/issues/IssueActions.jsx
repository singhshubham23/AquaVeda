import { useNavigate } from "react-router-dom";

export default function IssueActions() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => navigate("/projects")}
        className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all"
      >
        Start Project
      </button>
      <button
        type="button"
        onClick={() => navigate("/community")}
        className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl transition-all"
      >
        Discuss
      </button>
    </div>
  );
}
