import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { askAiAssistant, classifyIssue, checkDuplicates, getIssueRecommendations } from "../services/api.js";
import toast from "react-hot-toast";

const modes = [
  {
    key: "assistant",
    label: "Assistant",
    desc: "Ask for water-saving advice, report-writing help, or community guidance.",
  },
  {
    key: "recommend",
    label: "Recommendations",
    desc: "Enter an issue ID to get focused next-step recommendations.",
  },
  {
    key: "classify",
    label: "Classify",
    desc: "Paste a title and description to estimate severity and category.",
  },
  {
    key: "duplicates",
    label: "Duplicates",
    desc: "Paste an issue title and location to check for likely duplicates.",
  },
];

export default function AIPanel({ isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState("assistant");
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [topic, setTopic] = useState("water-saving");
  const [tone, setTone] = useState("detailed");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const modeMeta = useMemo(() => modes.find((item) => item.key === mode), [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let res;
      if (mode === "assistant") {
        if (!input.trim()) return toast.error("Enter a question for the assistant.");
        res = await askAiAssistant({ topic, tone, prompt: input.trim() });
      } else if (mode === "recommend") {
        if (!input.trim()) return toast.error("Enter an issue ID.");
        res = await getIssueRecommendations(input.trim());
      } else if (mode === "classify") {
        if (!title.trim() || !input.trim()) return toast.error("Enter a title and description.");
        res = await classifyIssue({ title: title.trim(), description: input.trim() });
      } else {
        if (!title.trim() || !lat.trim() || !lng.trim()) {
          return toast.error("Enter a title, latitude, and longitude.");
        }
        res = await checkDuplicates({
          title: title.trim(),
          lat: Number(lat),
          lng: Number(lng),
        });
      }

      setResult(res.data || res);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const renderAssistantResult = () => {
    if (!result || typeof result === "string") return null;
    if (mode !== "assistant") return null;

    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-2 text-sm font-black text-slate-800">{result.title || "AI Guidance"}</h4>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{result.answer}</p>

        {Array.isArray(result.steps) && result.steps.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Best next steps</p>
            <ul className="mt-2 space-y-2">
              {result.steps.map((step, index) => (
                <li key={step} className="flex gap-2 text-sm text-slate-700">
                  <span className="font-black text-teal-600">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.quick_tip && (
          <div className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
            <span className="font-black">Quick tip:</span> {result.quick_tip}
          </div>
        )}

        {Array.isArray(result.avoid) && result.avoid.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Avoid</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {result.avoid.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto flex w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in">
        <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg text-white">
                AI
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800">AquaVeda AI</h2>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Groq-powered assistant</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-slate-600">
              ×
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-100">
          {modes.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setMode(item.key);
                setResult(null);
                setInput("");
                setTitle("");
                setLat("");
                setLng("");
                setTone("detailed");
              }}
              className={`flex-1 px-3 py-3 text-xs font-black transition-colors ${
                mode === item.key
                  ? "border-b-2 border-teal-500 bg-teal-50/60 text-teal-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-4 text-xs text-slate-500">{modeMeta?.desc}</p>

          {!isAuthenticated && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
              Please log in to use AI features.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "assistant" && (
              <>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="water-saving">Water saving</option>
                  <option value="issue-writing">Issue drafting</option>
                  <option value="community-actions">Community actions</option>
                  <option value="reuse-and-recycling">Reuse and recycling</option>
                </select>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="short">Short</option>
                  <option value="detailed">Detailed</option>
                  <option value="step-by-step">Step-by-step</option>
                </select>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  placeholder="Ask anything about water use, issue reporting, or conservation..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </>
            )}

            {mode === "recommend" && (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter issue ID..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            )}

            {mode === "classify" && (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Issue title..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  placeholder="Describe the issue..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </>
            )}

            {mode === "duplicates" && (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Issue title..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Latitude"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="number"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="Longitude"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-black text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Run AI Analysis"}
            </button>
          </form>

          {result && mode === "assistant" && (
            renderAssistantResult()
          )}

          {result && mode !== "assistant" && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">AI Response</h4>
              {typeof result === "string" ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{result}</p>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
