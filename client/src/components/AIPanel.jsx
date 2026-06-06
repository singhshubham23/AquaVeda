import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { classifyIssue, checkDuplicates, getIssueRecommendations } from "../services/api.js";
import toast from "react-hot-toast";

export default function AIPanel({ isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState("recommend");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const modes = [
    { key: "recommend", label: "Recommendations", desc: "Enter Issue ID to get AI recommendations" },
    { key: "classify", label: "Classify", desc: "Describe an issue to classify its severity" },
    { key: "duplicates", label: "Duplicates", desc: "Paste a description to check for duplicate issues" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setResult(null);
    setLoading(true);
    try {
      let res;
      if (mode === "recommend") {
        res = await getIssueRecommendations(input.trim());
      } else if (mode === "classify") {
        res = await classifyIssue({ description: input.trim() });
      } else {
        res = await checkDuplicates({ description: input.trim() });
      }
      setResult(res.data || res);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg">
                🤖
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">AquaVeda AI</h2>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Intelligence Assistant</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-100">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => { setMode(m.key); setResult(null); }}
              className={`flex-1 px-3 py-3 text-xs font-bold transition-colors ${
                mode === m.key ? "text-teal-700 border-b-2 border-teal-500 bg-teal-50/50" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs text-slate-500 mb-4">{modes.find(m => m.key === mode)?.desc}</p>

          {!isAuthenticated && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium mb-4">
              Please log in to use AI features.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "recommend" ? (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter issue ID..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              />
            ) : (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                placeholder="Describe the issue..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none"
              />
            )}
            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-60 text-sm"
            >
              {loading ? "Analyzing..." : "Run AI Analysis"}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Response</h4>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
