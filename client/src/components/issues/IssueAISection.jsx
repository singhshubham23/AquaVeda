import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getIssueRecommendations } from "../../services/api.js";

export default function IssueAISection({ issue }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchAI = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getIssueRecommendations(issue._id || issue.id);
      setData(response.data || []);
      setHasLoaded(true);
      setOpen(true);
    } catch (err) {
      setError(err.message || "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (!hasLoaded) {
      await fetchAI();
      return;
    }
    setOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-violet-50/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">AI</span>
          <span className="text-sm font-extrabold text-violet-800">AI Suggestions</span>
        </div>
        <span className="text-sm font-bold text-violet-500">
          {loading ? "Loading..." : open ? "Hide" : "Show"}
        </span>
      </button>

      {error && <p className="px-5 pb-4 text-sm text-red-600 font-medium">{error}</p>}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ai-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 pt-0 border-t border-violet-100">
              {data.length > 0 ? (
                <ul className="space-y-3 mt-4">
                  {data.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.05 }}
                      className="flex items-start gap-3 text-sm text-violet-800 leading-6"
                    >
                      <span className="text-violet-400 mt-0.5 shrink-0">-&gt;</span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 mt-4">No suggestions available yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
