import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getComments } from "../../services/api.js";

export default function IssueCommentsPreview({ issue }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getComments("ISSUE", issue._id || issue.id);
        const comments = Array.isArray(response?.data?.items)
          ? response.data.items
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const topLevel = comments.filter((c) => !c.parentComment);
        setItems(topLevel.slice(0, 3));
      } catch (err) {
        setError(err.message || "Failed to load comments");
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [issue._id, issue.id]);

  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-extrabold text-slate-600 uppercase tracking-[0.18em]">Comments</h3>
      </div>

      <div className="px-5 py-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
            Loading...
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-slate-400 italic">No comments yet. Start the discussion.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((comment) => {
              const text = comment.body || comment.content || "";
              return (
                <div key={comment._id} className="text-sm leading-6">
                  <span className="font-bold text-slate-700">{comment.user?.name || comment.author?.name || "User"}: </span>
                  <span className="text-slate-600">{text.length > 140 ? `${text.slice(0, 140)}...` : text}</span>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          className="mt-4 text-sm font-extrabold text-teal-600 hover:text-teal-800 transition-colors"
          onClick={() => navigate("/community")}
        >
          View all discussions <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </div>
  );
}
