import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { hasPermission, PERMISSIONS } from "../lib/accessControl.js";
import {
  getWikiArticles,
  getMyWikiArticles,
  createWikiArticle,
  approveWikiArticle,
  rejectWikiArticle,
  voteWiki,
  getComments,
  createComment,
  voteComment,
  acceptComment
} from "../services/api.js";
import toast from "react-hot-toast";

const statusBadge = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-600",
};

const unwrapResponseData = (response) => response?.data?.data ?? response?.data ?? null;

const unwrapResponseItems = (response) => {
  const payload = unwrapResponseData(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const learnTracks = [
  {
    id: "home",
    title: "Home Saving",
    icon: "??",
    accent: "from-cyan-500 to-teal-500",
    quickWin: "Fixing one dripping tap can save around 15-20 liters/day.",
    tips: [
      "Use aerators on kitchen and bathroom taps.",
      "Collect RO reject water for mopping and flushing.",
      "Run washing machine only on full load mode.",
      "Use a bucket for bathing when possible."
    ]
  },
  {
    id: "garden",
    title: "Garden & Outdoor",
    icon: "??",
    accent: "from-emerald-500 to-lime-500",
    quickWin: "Drip irrigation can reduce outdoor water use by 30-50%.",
    tips: [
      "Water plants early morning or late evening.",
      "Use mulch to retain soil moisture.",
      "Group plants by water needs.",
      "Use harvested rainwater for lawns and plants."
    ]
  },
  {
    id: "community",
    title: "Community Impact",
    icon: "??",
    accent: "from-blue-500 to-indigo-500",
    quickWin: "A colony-level leak audit can cut losses by 10-25%.",
    tips: [
      "Track common area meter readings weekly.",
      "Report pipeline leaks with location and photo.",
      "Install dual-flush systems in shared washrooms.",
      "Run water-awareness drives monthly."
    ]
  },
  {
    id: "reuse",
    title: "Reuse & Recycling",
    icon: "??",
    accent: "from-sky-500 to-cyan-500",
    quickWin: "Greywater reuse can cut fresh water demand by 20-40%.",
    tips: [
      "Reuse vegetable wash water for non-edible plants.",
      "Create separate plumbing for greywater where feasible.",
      "Store and reuse AC condensate water.",
      "Use eco-friendly soaps when planning reuse."
    ]
  }
];

const challengeIdeas = [
  { day: "Day 1", action: "Measure your current daily household water use." },
  { day: "Day 2", action: "Fix one leak or report one public leak." },
  { day: "Day 3", action: "Switch one routine to bucket-use mode." },
  { day: "Day 4", action: "Reuse at least 20 liters of greywater." },
  { day: "Day 5", action: "Install one water-saving nozzle or aerator." },
  { day: "Day 6", action: "Water plants only during low-evaporation hours." },
  { day: "Day 7", action: "Share one conservation tip with neighbors/family." },
];

function WikiComments({ wiki, currentUser, canComment, isAuthenticated }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  const fetchComments = async () => {
    try {
      const res = await getComments("WIKI", wiki._id);
      setComments(unwrapResponseItems(res));
    } catch (e) {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [wiki._id]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    if (!canComment) {
      toast.error("Your account cannot post comments.");
      return;
    }
    try {
      await createComment({ refType: "WIKI", refId: wiki._id, content: newComment });
      setNewComment("");
      fetchComments();
      toast.success("Posted successfully");
    } catch (e) {
      toast.error("Failed to post");
    }
  };

  const handleVote = async (commentId, type) => {
    try {
      await voteComment(commentId, type);
      fetchComments();
    } catch (e) {
      toast.error("Failed to vote");
    }
  };

  const handleAccept = async (commentId) => {
    try {
      await acceptComment(commentId);
      toast.success("Answer accepted! Reputation awarded.");
      fetchComments();
    } catch (e) {
      toast.error("Failed to accept answer");
    }
  };

  if (loading) return <div className="py-4 text-slate-500 text-sm">Loading discussion...</div>;

  return (
    <div className="mt-6 pt-6 border-t border-slate-200">
      <h4 className="font-bold text-slate-700 mb-4">{wiki.type === "QUESTION" ? "Answers" : "Comments"}</h4>

      <div className="space-y-4 mb-4">
        {comments.length === 0 && <p className="text-sm text-slate-400">No responses yet. Be the first!</p>}
        {comments.map((c) => (
          <div key={c._id} className={`p-4 rounded-xl border ${c.isAccepted ? "border-green-400 bg-green-50 shadow-sm" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button onClick={() => handleVote(c._id, "UP")} className="text-slate-400 hover:text-teal-600 transition-colors">?</button>
                <span className="font-bold text-slate-600 text-sm">{(c.upvotedBy?.length || 0) - (c.downvotedBy?.length || 0)}</span>
                <button onClick={() => handleVote(c._id, "DOWN")} className="text-slate-400 hover:text-red-600 transition-colors">?</button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{c.content}</p>
                <div className="mt-3 text-xs text-slate-500 flex justify-between items-center gap-3">
                  <span>By <strong className="text-slate-600">{c.user?.name || "Unknown"}</strong></span>

                  <div className="flex gap-2 items-center">
                    {c.isAccepted && (
                      <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider">
                        Best Answer
                      </span>
                    )}
                    {!c.isAccepted && wiki.type === "QUESTION" && currentUser?.id === wiki.author?._id && (
                      <button onClick={() => handleAccept(c._id)} className="text-teal-600 font-semibold hover:underline">
                        Accept as Best
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAuthenticated && canComment ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm font-sans"
            placeholder={wiki.type === "QUESTION" ? "Write an answer..." : "Write a comment..."}
            rows={3}
          />
          <button onClick={handlePost} disabled={!newComment.trim()} className="self-end px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
            {wiki.type === "QUESTION" ? "Post Answer" : "Post Comment"}
          </button>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Sign in with a member account to join this discussion.
        </p>
      )}
    </div>
  );
}

export default function LearnPage() {
  const { isAuthenticated, user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [activeTrack, setActiveTrack] = useState(learnTracks[0].id);
  const [householdCount, setHouseholdCount] = useState(4);
  const [showerMinutes, setShowerMinutes] = useState(8);
  const [leakyTaps, setLeakyTaps] = useState(1);
  const [form, setForm] = useState({ title: "", content: "", type: "ARTICLE" });
  const [creating, setCreating] = useState(false);

  const canContribute = hasPermission(user, PERMISSIONS.WIKI_CREATE);
  const canComment = hasPermission(user, PERMISSIONS.COMMENT_CREATE);
  const canModerate = hasPermission(user, PERMISSIONS.WIKI_MODERATE);

  const activeTrackData = useMemo(
    () => learnTracks.find((track) => track.id === activeTrack) || learnTracks[0],
    [activeTrack]
  );

  const calculator = useMemo(() => {
    const dailyNeed = householdCount * 135;
    const showerUse = householdCount * showerMinutes * 9;
    const leaksLoss = leakyTaps * 18;
    const monthlyWaste = leaksLoss * 30;
    const potentialSavings = Math.round((showerUse * 0.25) + monthlyWaste);

    return { dailyNeed, showerUse, leaksLoss, monthlyWaste, potentialSavings };
  }, [householdCount, showerMinutes, leakyTaps]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const [publicRes, mineRes] = await Promise.all([
        getWikiArticles(),
        isAuthenticated ? getMyWikiArticles() : Promise.resolve(null),
      ]);
      const publicArticles = unwrapResponseItems(publicRes);
      const myArticles = unwrapResponseItems(mineRes);
      const merged = new Map();
      [...publicArticles, ...myArticles].forEach((article) => {
        if (article?._id) merged.set(article._id, article);
      });
      setArticles(Array.from(merged.values()));
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [isAuthenticated]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash !== "knowledge-hub") return;

    const timer = window.setTimeout(() => {
      document.getElementById("knowledge-hub")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [articles.length, loading]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canContribute) {
      toast.error("Your account cannot create knowledge posts.");
      return;
    }
    try {
      setCreating(true);
      await createWikiArticle(form);
      toast.success("Submitted for review!");
      setForm({ title: "", content: "", type: "ARTICLE" });
      setShowCreate(false);
      fetchArticles();
    } catch {
      // handled
    } finally {
      setCreating(false);
    }
  };

  const handleWikiVote = async (e, id, type) => {
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Please login to vote");
    try {
      await voteWiki(id, type);
      fetchArticles();
    } catch {
      toast.error("Failed to vote");
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveWikiArticle(id);
      toast.success("Approved!");
      fetchArticles();
    } catch {}
  };

  const handleReject = async (id) => {
    try {
      await rejectWikiArticle(id);
      toast.success("Rejected.");
      fetchArticles();
    } catch {}
  };

  return (
    <div>
      <section className="mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 shadow-xl">
        <div className="p-6 md:p-8 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100 font-semibold mb-2">Water Learning Toolkit</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Learn, Save, Reuse, and Act Better</h1>
          <p className="mt-3 text-cyan-50 max-w-2xl">Practical guidance to reduce water waste, use water effectively, and build better everyday habits at home and in your community.</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {learnTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => setActiveTrack(track.id)}
                className={`text-left rounded-2xl p-4 transition-all border ${activeTrack === track.id ? "bg-white/20 border-white/70 shadow-lg" : "bg-white/10 border-white/20 hover:bg-white/15"}`}
              >
                <p className="text-xl mb-1">{track.icon}</p>
                <p className="font-bold text-white">{track.title}</p>
                <p className="text-xs text-cyan-100 mt-1">Tap to explore</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-10">
        <article className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Active Topic</p>
              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">{activeTrackData.icon} {activeTrackData.title}</h2>
            </div>
            <span className={`inline-block h-2 w-28 rounded-full bg-gradient-to-r ${activeTrackData.accent}`}></span>
          </div>

          <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Quick win</p>
            <p className="text-slate-600 mt-1">{activeTrackData.quickWin}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTrackData.tips.map((tip) => (
              <div key={tip} className="rounded-xl border border-slate-200 bg-white p-3 hover:border-teal-300 hover:shadow-sm transition-all">
                <p className="text-sm text-slate-700">- {tip}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">7-Day Water Challenge</h3>
          <p className="text-sm text-slate-500 mt-1">One action per day, real impact by week-end.</p>
          <div className="mt-4 space-y-2">
            {challengeIdeas.map((item) => (
              <div key={item.day} className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                <p className="text-xs text-teal-700 font-bold uppercase tracking-wide">{item.day}</p>
                <p className="text-sm text-slate-700 mt-1">{item.action}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mb-10 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Water Use Estimator</h3>
            <p className="text-sm text-slate-500">Adjust values to estimate usage and savings potential.</p>
          </div>
          <p className="text-xs px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold">Reference value: 135 L/person/day</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <label className="text-sm font-semibold text-slate-700 block">Household members: {householdCount}</label>
            <input type="range" min="1" max="10" value={householdCount} onChange={(e) => setHouseholdCount(Number(e.target.value))} className="w-full mt-2" />

            <label className="text-sm font-semibold text-slate-700 block mt-4">Avg shower minutes/person: {showerMinutes}</label>
            <input type="range" min="2" max="20" value={showerMinutes} onChange={(e) => setShowerMinutes(Number(e.target.value))} className="w-full mt-2" />

            <label className="text-sm font-semibold text-slate-700 block mt-4">Leaky taps in home: {leakyTaps}</label>
            <input type="range" min="0" max="8" value={leakyTaps} onChange={(e) => setLeakyTaps(Number(e.target.value))} className="w-full mt-2" />
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-cyan-50 border border-cyan-100">
              <p className="text-xs uppercase tracking-wide text-cyan-700 font-semibold">Ideal household need/day</p>
              <p className="text-2xl font-black text-cyan-900 mt-1">{calculator.dailyNeed} L</p>
            </div>
            <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
              <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Estimated shower water/day</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{calculator.showerUse} L</p>
            </div>
            <div className="rounded-xl p-4 bg-amber-50 border border-amber-100">
              <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Leak loss/month</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{calculator.monthlyWaste} L</p>
            </div>
            <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100">
              <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Potential monthly savings</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{calculator.potentialSavings} L</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-500 tracking-tight">
            Knowledge Hub
          </h2>
          <p className="text-slate-600 mt-2 font-medium">Read articles and ask questions about water conservation.</p>
        </div>
        {isAuthenticated && canContribute && (
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
          >
            {showCreate ? "Cancel" : "New Post"}
          </button>
        )}
      </div>

      {showCreate && canContribute && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Create Post</h3>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input type="radio" checked={form.type === "ARTICLE"} onChange={() => setForm({ ...form, type: "ARTICLE" })} />
              Article
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input type="radio" checked={form.type === "QUESTION"} onChange={() => setForm({ ...form, type: "QUESTION" })} />
              Question
            </label>
          </div>

          <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mb-4">
            Title
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-normal"
              placeholder={form.type === "QUESTION" ? "e.g. How do I fix a leaky pipe?" : "e.g. History of Groundwater"}
            />
          </label>
          <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mb-4">
            Content (Markdown supported)
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={6}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm font-normal resize-y"
              placeholder="Detailed description..."
            />
          </label>
          <button type="submit" disabled={creating} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all">
            {creating ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-slate-500">No community posts yet. Start one with your water-saving question or tip.</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-4" id="knowledge-hub">
          {articles.map((article) => (
            <article key={article._id} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="flex items-center w-full p-4 hover:bg-slate-50/50 cursor-pointer" onClick={() => setExpanded(expanded === article._id ? null : article._id)}>
                <div className="flex flex-col items-center shrink-0 w-12 mr-2">
                  <button onClick={(e) => handleWikiVote(e, article._id, "UP")} className="text-slate-400 hover:text-teal-600">?</button>
                  <span className="font-bold text-slate-600 text-sm">{(article.upvotedBy?.length || 0) - (article.downvotedBy?.length || 0)}</span>
                  <button onClick={(e) => handleWikiVote(e, article._id, "DOWN")} className="text-slate-400 hover:text-red-600">?</button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">{article.type === "QUESTION" ? "?" : "??"}</span>
                    <h3 className="text-base font-bold text-slate-800 truncate">{article.title}</h3>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBadge[article.status?.toUpperCase()] || "bg-slate-100 text-slate-600"}`}>
                      {article.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 ml-8">
                    By <span className="font-semibold">{article.author?.name || "Anonymous"}</span> · {new Date(article.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-slate-400 text-lg ml-3 shrink-0">{expanded === article._id ? "?" : "?"}</span>
              </div>

              {expanded === article._id && (
                <div className="px-5 pb-5 ml-12">
                  <div className="mt-2 prose prose-sm prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed bg-slate-50 rounded-xl p-4">
                      {article.content}
                    </pre>
                  </div>

                  {canModerate && article.status === "PENDING" && (
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => handleApprove(article._id)} className="px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl">Approve</button>
                      <button onClick={() => handleReject(article._id)} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl">Reject</button>
                    </div>
                  )}

                  <WikiComments
                    wiki={article}
                    currentUser={user}
                    canComment={canComment}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


