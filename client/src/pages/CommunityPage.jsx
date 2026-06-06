import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { hasPermission, PERMISSIONS } from "../lib/accessControl.js";
import {
  getIssues,
  createIssue,
  updateIssueStatus,
  deleteIssue,
  getComments,
  createComment,
  getWikiArticles,
  getMyWikiArticles,
  createWikiArticle,
  voteComment,
  acceptComment,
} from "../services/api.js";
import toast from "react-hot-toast";

const columns = [
  { key: "OPEN", label: "Open", color: "border-blue-400", bg: "bg-blue-50" },
  { key: "ACKNOWLEDGED", label: "Acknowledged", color: "border-indigo-400", bg: "bg-indigo-50" },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-amber-400", bg: "bg-amber-50" },
  { key: "RESOLVED", label: "Resolved", color: "border-emerald-400", bg: "bg-emerald-50" },
  { key: "VERIFIED", label: "Verified", color: "border-slate-400", bg: "bg-slate-50" },
];

const severityBadge = {
  CRITICAL: "bg-red-100 text-red-700 ring-1 ring-red-200",
  HIGH: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200",
  LOW: "bg-green-100 text-green-700 ring-1 ring-green-200",
};

const workspaceTabs = [
  { key: "feed", label: "Community Feed" },
  { key: "manage", label: "Issue Desk" },
];

const postTabs = [
  { key: "all", label: "All Posts" },
  { key: "issues", label: "Issues" },
  { key: "questions", label: "Questions" },
  { key: "contributions", label: "Contributions" },
];

const unwrapResponseData = (response) => response?.data?.data ?? response?.data ?? null;

const unwrapResponseItems = (response) => {
  const payload = unwrapResponseData(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const normalizeIssuePost = (issue) => ({
  id: issue._id,
  kind: "ISSUE",
  title: issue.title,
  summary: issue.description,
  authorName: issue.reportedBy?.name || "Community member",
  authorId: issue.reportedBy?._id || "",
  region: issue.region || "Global",
  status: issue.status || "OPEN",
  severity: issue.severity || "LOW",
  tags: [issue.category].filter(Boolean),
  createdAt: issue.createdAt,
  source: issue,
});

const normalizeWikiPost = (wiki) => ({
  id: wiki._id,
  kind: wiki.type === "QUESTION" ? "QUESTION" : "CONTRIBUTION",
  title: wiki.title,
  summary: wiki.content,
  authorName: wiki.author?.name || "Community member",
  authorId: wiki.author?._id || "",
  region: wiki.region || "Global",
  status: wiki.status || "APPROVED",
  severity: null,
  tags: Array.isArray(wiki.tags) ? wiki.tags : [],
  createdAt: wiki.createdAt,
  source: wiki,
});

const scoreComment = (comment) => (comment.upvotedBy?.length || 0) - (comment.downvotedBy?.length || 0);

const sortDiscussion = (items) =>
  [...items].sort((left, right) => {
    if (left.isAccepted && !right.isAccepted) return -1;
    if (!left.isAccepted && right.isAccepted) return 1;
    const scoreDelta = scoreComment(right) - scoreComment(left);
    if (scoreDelta !== 0) return scoreDelta;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

const groupReplies = (items) => {
  const roots = [];
  const repliesByParent = new Map();

  for (const item of items) {
    const parentId = typeof item.parentComment === "object" ? item.parentComment?._id : item.parentComment;
    if (!parentId) {
      roots.push({ ...item, replies: [] });
      continue;
    }

    const key = String(parentId);
    if (!repliesByParent.has(key)) {
      repliesByParent.set(key, []);
    }
    repliesByParent.get(key).push(item);
  }

  return roots.map((root) => ({
    ...root,
    replies: sortDiscussion(repliesByParent.get(String(root._id)) || []),
  }));
};

function KpiCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-800">{value}</p>
    </article>
  );
}

export default function CommunityPage() {
  const { isAuthenticated, user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [wikiPosts, setWikiPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState("feed");
  const [feedFilter, setFeedFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState("kanban");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [discussion, setDiscussion] = useState([]);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionError, setDiscussionError] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [postForm, setPostForm] = useState({
    type: "QUESTION",
    title: "",
    content: "",
    region: "",
    tags: "",
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    location: { type: "Point", coordinates: [0, 0] },
    region: ""
  });
  const [reportImages, setReportImages] = useState([]);
  const [creating, setCreating] = useState(false);
  const [posting, setPosting] = useState(false);
  const canWork = hasPermission(user, PERMISSIONS.COMMUNITY_CONTRIBUTE);
  const canPost = hasPermission(user, PERMISSIONS.WIKI_CREATE);
  const canDiscuss = hasPermission(user, PERMISSIONS.COMMENT_CREATE);

  useEffect(() => {
    if (!canWork && workspace === "manage") {
      setWorkspace("feed");
    }
  }, [canWork, workspace]);

  const fetchCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      const [issueRes, wikiRes, mineRes] = await Promise.all([
        getIssues(),
        getWikiArticles(),
        isAuthenticated ? getMyWikiArticles() : Promise.resolve(null),
      ]);
      const approvedPosts = unwrapResponseItems(wikiRes);
      const myPosts = unwrapResponseItems(mineRes);
      const mergedWiki = new Map();
      [...approvedPosts, ...myPosts].forEach((post) => {
        if (post?._id) mergedWiki.set(post._id, post);
      });
      setIssues(unwrapResponseItems(issueRes));
      setWikiPosts(Array.from(mergedWiki.values()));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const kpis = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === "OPEN").length;
    const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length;
    const resolved = issues.filter((i) => i.status === "RESOLVED" || i.status === "VERIFIED").length;
    return { total, open, inProgress, resolved };
  }, [issues]);

  const feedPosts = useMemo(() => {
    const posts = [
      ...issues.map(normalizeIssuePost),
      ...wikiPosts.map(normalizeWikiPost),
    ].filter((post) => {
      if (feedFilter === "issues") return post.kind === "ISSUE";
      if (feedFilter === "questions") return post.kind === "QUESTION";
      if (feedFilter === "contributions") return post.kind === "CONTRIBUTION";
      return true;
    });

    return posts.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [issues, wikiPosts, feedFilter]);

  const feedStats = useMemo(() => {
    const questions = wikiPosts.filter((post) => post.type === "QUESTION").length;
    const contributions = wikiPosts.filter((post) => post.type === "ARTICLE").length;
    const issuePosts = issues.length;
    return {
      issuePosts,
      questions,
      contributions,
      totalPosts: issuePosts + questions + contributions,
    };
  }, [issues, wikiPosts]);

  const threadedDiscussion = useMemo(() => groupReplies(sortDiscussion(discussion)), [discussion]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const selectedImages = Array.from(reportImages || []);
    if (selectedImages.length < 1 || selectedImages.length > 3) {
      toast.error("Please upload at least 1 and at most 3 images.");
      return;
    }
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("severity", form.severity);
      formData.append("region", form.region);
      formData.append("location", JSON.stringify(form.location));
      selectedImages.slice(0, 3).forEach((file) => formData.append("images", file));
      const result = await createIssue(formData);
      toast.success(result?.queued ? "No internet. Issue queued and will auto-submit once online." : "Issue reported!");
      setForm({ title: "", description: "", severity: "MEDIUM", location: { type: "Point", coordinates: [0, 0] }, region: "" });
      setReportImages([]);
      setShowCreate(false);
      fetchCommunityData();
    } finally {
      setCreating(false);
    }
  };

  const openPostThread = async (post) => {
    setSelectedPost(post);
    setReplyTo(null);
    setAnswerText("");
    setDiscussion([]);
    setDiscussionError("");
    setDiscussionLoading(true);

    try {
      const refType = post.kind === "ISSUE" ? "ISSUE" : "WIKI";
      const response = await getComments(refType, post.id);
      setDiscussion(unwrapResponseItems(response));
    } catch (err) {
      setDiscussionError(err.message || "Failed to load discussion");
    } finally {
      setDiscussionLoading(false);
    }
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!canPost) {
      toast.error("Your account cannot create community posts.");
      return;
    }
    const title = postForm.title.trim();
    const content = postForm.content.trim();
    if (!title || !content) {
      toast.error("Please add both a title and description.");
      return;
    }

    try {
      setPosting(true);
      await createWikiArticle({
        type: postForm.type,
        title,
        content,
        region: postForm.region.trim() || "global",
        tags: postForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      toast.success(
        postForm.type === "QUESTION"
          ? "Question submitted for review."
          : "Contribution submitted for review.",
      );

      setPostForm({
        type: "QUESTION",
        title: "",
        content: "",
        region: "",
        tags: "",
      });
      fetchCommunityData();
    } catch (err) {
      toast.error(err.message || "Failed to submit post");
    } finally {
      setPosting(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!selectedPost || !answerText.trim()) return;
    if (!canDiscuss) {
      toast.error("Your account cannot post replies.");
      return;
    }

    try {
      const payload = {
        refType: selectedPost.kind === "ISSUE" ? "ISSUE" : "WIKI",
        refId: selectedPost.id,
        content: answerText.trim(),
      };

      if (replyTo?._id) {
        payload.parentComment = replyTo._id;
      }

      await createComment(payload);
      setAnswerText("");
      setReplyTo(null);
      const response = await getComments(payload.refType, selectedPost.id);
      setDiscussion(unwrapResponseItems(response));
      toast.success("Reply posted!");
    } catch (err) {
      toast.error(err.message || "Failed to post reply");
    }
  };

  const handleVoteComment = async (commentId, type) => {
    try {
      await voteComment(commentId, type);
      if (!selectedPost) return;
      const refType = selectedPost.kind === "ISSUE" ? "ISSUE" : "WIKI";
      const response = await getComments(refType, selectedPost.id);
      setDiscussion(unwrapResponseItems(response));
    } catch (err) {
      toast.error(err.message || "Failed to record vote");
    }
  };

  const handleAcceptAnswer = async (commentId) => {
    try {
      await acceptComment(commentId);
      if (!selectedPost) return;
      const response = await getComments("WIKI", selectedPost.id);
      setDiscussion(unwrapResponseItems(response));
      toast.success("Best answer accepted.");
    } catch (err) {
      toast.error(err.message || "Failed to accept answer");
    }
  };

  const handleStatusChange = async (issueId, newStatus, withNote = false) => {
    if (!canWork) return;
    const noteInput = withNote ? window.prompt("Optional timeline note (max 280 chars):", "") || "" : "";
    const note = noteInput.trim().slice(0, 280);
    const prev = [...issues];
    setIssues(issues.map((i) => (i._id === issueId ? { ...i, status: newStatus } : i)));
    try {
      await updateIssueStatus(issueId, newStatus, note);
    } catch {
      setIssues(prev);
    }
  };

  const handleDelete = async (id) => {
    if (!canWork) return;
    if (!window.confirm("Delete this issue permanently?")) return;
    try {
      await deleteIssue(id);
      toast.success("Issue deleted.");
      setIssues(issues.filter((i) => i._id !== id));
      if (selectedIssue?._id === id) setSelectedIssue(null);
    } catch {}
  };

  const openDetail = async (issue) => {
    setSelectedIssue(issue);
    try {
      const res = await getComments("ISSUE", issue._id);
      setComments(unwrapResponseItems(res));
    } catch {
      setComments([]);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await createComment({ content: commentText, refType: "ISSUE", refId: selectedIssue._id });
      setCommentText("");
      const res = await getComments("ISSUE", selectedIssue._id);
      setComments(unwrapResponseItems(res));
      toast.success("Comment posted!");
    } catch {}
  };

  const grouped = columns.reduce((acc, col) => {
    acc[col.key] = issues.filter((i) => i.status === col.key);
    return acc;
  }, {});

  return (
    <main className="space-y-6">
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 shadow-xl">
        <div className="p-6 md:p-8 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100 font-semibold">Community Ops</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Community Feed & Issue Desk</h1>
          <p className="mt-2 text-cyan-50 max-w-2xl">
            Ask questions, share contributions, and answer live issues in one calm workspace. Members can participate without needing to manage the whole workflow.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl bg-white/15 p-1 border border-white/20">
              {workspaceTabs
                .filter((tab) => tab.key !== "manage" || canWork)
                .map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setWorkspace(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    workspace === tab.key ? "bg-white text-teal-700" : "text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
                ))}
            </div>
            {workspace === "feed" && isAuthenticated ? (
              <button
                type="button"
                onClick={() => setWorkspace(canWork ? "manage" : "feed")}
                className="px-4 py-2 rounded-xl border border-white/40 text-white text-sm font-semibold hover:bg-white/10"
              >
                {canWork ? "Go to Issue Desk" : "Read-only Mode"}
              </button>
            ) : null}
            {workspace === "manage" && isAuthenticated && canWork ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowCreate(!showCreate)}
                  className="px-4 py-2 rounded-xl border border-white/40 text-white text-sm font-semibold hover:bg-white/10"
                >
                  {showCreate ? "Hide Report Form" : "Report Issue"}
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspace("feed")}
                  className="px-4 py-2 rounded-xl border border-white/40 text-white text-sm font-semibold hover:bg-white/10"
                >
                  Back to Feed
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Issues" value={kpis.total} />
        <KpiCard label="Open" value={kpis.open} />
        <KpiCard label="In Progress" value={kpis.inProgress} />
        <KpiCard label="Resolved/Verified" value={kpis.resolved} />
      </section>

      {workspace === "manage" && canWork ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Issue Desk</p>
            <p className="text-sm text-slate-600">Keep the operational workflow here. The feed stays focused on questions and contributions.</p>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start lg:self-auto">
            <button type="button" onClick={() => setViewMode("kanban")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === "kanban" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Kanban</button>
            <button type="button" onClick={() => setViewMode("list")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === "list" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>List</button>
          </div>
        </div>
      ) : null}

      {workspace === "feed" ? (
        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-cyan-700 font-bold">Member guide</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-800">What a Member can do here</h2>
                  <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                    Members can ask questions, answer existing posts, and help move issues forward. You do not need to manage every workflow step to contribute.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[250px]">
                  <div className="rounded-xl bg-cyan-50 border border-cyan-100 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-cyan-700 font-semibold">Posts</p>
                    <p className="text-2xl font-black text-cyan-900">{feedStats.totalPosts}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Questions</p>
                    <p className="text-2xl font-black text-emerald-900">{feedStats.questions}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Contributions</p>
                    <p className="text-2xl font-black text-amber-900">{feedStats.contributions}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Issues</p>
                    <p className="text-2xl font-black text-slate-800">{feedStats.issuePosts}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Community feed</p>
                  <h3 className="text-xl font-black text-slate-800">Questions, issues, and contribution posts</h3>
                </div>
                <div className="inline-flex rounded-xl bg-slate-100 p-1">
                  {postTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFeedFilter(tab.key)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                        feedFilter === tab.key ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5">
                {loading ? (
                  <div className="flex items-center justify-center py-14">
                    <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  </div>
                ) : feedPosts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <h4 className="text-lg font-bold text-slate-700">No posts in this view yet</h4>
                    <p className="mt-2 text-sm text-slate-500">
                      Try another filter or switch to Issue Desk to review the operational workflow.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedPosts.map((post) => (
                      <article
                        key={`${post.kind}-${post.id}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openPostThread(post)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full tracking-wide uppercase ${
                                post.kind === "ISSUE"
                                  ? "bg-red-100 text-red-700"
                                  : post.kind === "QUESTION"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}>
                                {post.kind}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">{post.authorName}</span>
                              <span className="text-xs text-slate-400">• {post.region}</span>
                              <span className="text-xs text-slate-400">• {formatDate(post.createdAt)}</span>
                            </div>

                            <div>
                              <h4 className="text-lg font-black text-slate-800">{post.title}</h4>
                              <p className="mt-1 text-sm text-slate-600 leading-6 line-clamp-3">{post.summary}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {post.tags.map((tag) => (
                                <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white text-slate-500 border border-slate-200">
                                  {tag}
                                </span>
                              ))}
                              {post.kind === "ISSUE" ? (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${severityBadge[post.severity] || "bg-slate-100 text-slate-600"}`}>
                                  {post.severity}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                  {post.status}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openPostThread(post)}
                            className="self-start px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-teal-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                          >
                            Open thread
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Post something</p>
              <h3 className="mt-1 text-xl font-black text-slate-800">Ask a question or share a contribution</h3>
              <p className="mt-2 text-sm text-slate-600">
                Keep it concise and specific. Questions become the best fit for Quora-style answers, while contribution posts can share methods, observations, or help offers.
              </p>

              <form onSubmit={submitPost} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Post type
                  <select
                    value={postForm.type}
                    onChange={(event) => setPostForm((current) => ({ ...current, type: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="QUESTION">Question</option>
                    <option value="ARTICLE">Contribution</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Title
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder={postForm.type === "QUESTION" ? "What is causing...?" : "What I learned about..."}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Details
                  <textarea
                    value={postForm.content}
                    onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))}
                    rows={4}
                    placeholder="Explain the issue, question, or contribution in a few lines."
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Region
                    <input
                      type="text"
                      value={postForm.region}
                      onChange={(event) => setPostForm((current) => ({ ...current, region: event.target.value }))}
                      placeholder="e.g. Delhi NCR"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-slate-700">
                    Tags
                    <input
                      type="text"
                      value={postForm.tags}
                      onChange={(event) => setPostForm((current) => ({ ...current, tags: event.target.value }))}
                      placeholder="leak, groundwater, reuse"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </label>
                </div>

                {canPost ? (
                  <button
                    type="submit"
                    disabled={posting}
                    className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {posting ? "Submitting..." : postForm.type === "QUESTION" ? "Post Question" : "Post Contribution"}
                  </button>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Posting is unavailable for this account.
                  </p>
                )}
              </form>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
              <p className="text-xs uppercase tracking-wide text-cyan-700 font-bold">Community tip</p>
              <h4 className="mt-1 text-lg font-black text-slate-800">Best results come from one clear post</h4>
              <p className="mt-2 text-sm text-slate-600">
                Ask one specific question, mention the region, and include enough context for another member to answer well.
              </p>
            </div>
          </aside>
        </section>
      ) : null}

      {selectedPost ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          onClick={() => {
            setSelectedPost(null);
            setReplyTo(null);
            setDiscussion([]);
            setDiscussionError("");
            setAnswerText("");
          }}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide ${
                      selectedPost.kind === "ISSUE"
                        ? "bg-red-100 text-red-700"
                        : selectedPost.kind === "QUESTION"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {selectedPost.kind}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{selectedPost.authorName}</span>
                    <span className="text-xs text-slate-400">• {selectedPost.region}</span>
                    <span className="text-xs text-slate-400">• {formatDate(selectedPost.createdAt)}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">{selectedPost.title}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedPost.kind === "QUESTION"
                      ? "Answer this question with practical guidance."
                      : selectedPost.kind === "ISSUE"
                        ? "Discuss the issue and suggest next actions."
                        : "Add context, learnings, or a practical contribution."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPost(null);
                    setReplyTo(null);
                    setDiscussion([]);
                    setDiscussionError("");
                    setAnswerText("");
                  }}
                  className="text-2xl font-light text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selectedPost.summary}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedPost.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {tag}
                  </span>
                ))}
                {selectedPost.kind === "ISSUE" ? (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${severityBadge[selectedPost.severity] || "bg-slate-100 text-slate-600"}`}>
                    {selectedPost.severity}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-black uppercase tracking-wide text-slate-600">
                    {selectedPost.kind === "QUESTION" ? "Answers" : "Discussion"}
                  </h4>
                  {selectedPost.kind === "QUESTION" && selectedPost.authorId === user?.id ? (
                    <p className="text-xs text-slate-500">You can mark the best answer.</p>
                  ) : null}
                </div>

                {discussionLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600"></div>
                    Loading replies...
                  </div>
                ) : null}
                {discussionError ? <p className="py-4 text-sm text-red-600">{discussionError}</p> : null}

                {!discussionLoading && !discussionError ? (
                  <div className="mt-4 space-y-3">
                    {threadedDiscussion.length === 0 ? (
                      <p className="text-sm text-slate-400">No responses yet. Be the first to reply.</p>
                    ) : (
                      threadedDiscussion.map((comment) => (
                        <div key={comment._id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleVoteComment(comment._id, "UP")}
                                className="text-slate-400 hover:text-teal-600 transition-colors"
                              >
                                ↑
                              </button>
                              <span className="text-sm font-bold text-slate-600">{scoreComment(comment)}</span>
                              <button
                                type="button"
                                onClick={() => handleVoteComment(comment._id, "DOWN")}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                              >
                                ↓
                              </button>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{comment.user?.name || "Anonymous"}</p>
                                  <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {comment.isAccepted ? (
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                                      Best answer
                                    </span>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyTo(comment);
                                      setAnswerText("");
                                    }}
                                    className="text-xs font-bold text-teal-600 hover:text-teal-800"
                                  >
                                    Reply
                                  </button>
                                  {selectedPost.kind === "QUESTION" && selectedPost.authorId === user?.id && !comment.isAccepted ? (
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptAnswer(comment._id)}
                                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
                                    >
                                      Accept
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>

                              {comment.replies?.length > 0 ? (
                                <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
                                  {comment.replies.map((reply) => (
                                    <div key={reply._id} className="rounded-xl bg-slate-50 p-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-xs font-bold text-slate-700">{reply.user?.name || "Anonymous"}</p>
                                          <p className="text-[11px] text-slate-400">{formatDate(reply.createdAt)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button type="button" onClick={() => handleVoteComment(reply._id, "UP")} className="text-slate-400 hover:text-teal-600">↑</button>
                                          <span className="text-xs font-bold text-slate-600">{scoreComment(reply)}</span>
                                          <button type="button" onClick={() => handleVoteComment(reply._id, "DOWN")} className="text-slate-400 hover:text-red-600">↓</button>
                                        </div>
                                      </div>
                                      <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{reply.content}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}

                {isAuthenticated && canDiscuss ? (
                  <form onSubmit={submitAnswer} className="mt-5 space-y-3">
                    {replyTo ? (
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs text-slate-500">
                        <span>Replying to {replyTo.user?.name || "a member"}</span>
                        <button
                          type="button"
                          className="font-bold text-teal-600 hover:text-teal-800"
                          onClick={() => setReplyTo(null)}
                        >
                          Cancel reply
                        </button>
                      </div>
                    ) : null}
                    <textarea
                      value={answerText}
                      onChange={(event) => setAnswerText(event.target.value)}
                      placeholder={
                        selectedPost.kind === "QUESTION"
                          ? "Write a helpful answer..."
                          : "Share a practical reply or suggestion..."
                      }
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Keep it specific, kind, and useful for the next person reading this thread.
                      </p>
                      <button
                        type="submit"
                        className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
                      >
                        Post reply
                      </button>
                    </div>
                  </form>
                ) : isAuthenticated ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    Replying is unavailable for this account.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {workspace === "manage" && showCreate && canWork && (
        <form onSubmit={handleCreate} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Report New Issue</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 font-semibold text-slate-700">Title
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-normal" placeholder="e.g. Broken pipe in Sector 12" />
            </label>
            <label className="flex flex-col gap-1.5 font-semibold text-slate-700">Severity
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-normal">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mt-4">Region
            <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-normal" placeholder="e.g. Delhi NCR" />
          </label>
          <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mt-4">Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none font-normal" placeholder="Describe what you observed..." />
          </label>
          <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mt-4">Photos (1-3 images)
            <input type="file" multiple required accept="image/*" onChange={(e) => setReportImages(Array.from(e.target.files || []).slice(0, 3))} className="px-4 py-3 border border-slate-300 rounded-lg outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700" />
          </label>
          <button type="submit" disabled={creating} className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl disabled:opacity-60">{creating ? "Reporting..." : "Submit Issue"}</button>
        </form>
      )}

      {workspace === "manage" && loading && canWork ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div> : null}

      {workspace === "manage" && canWork && !loading && issues.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <h3 className="text-xl font-bold text-slate-700">No issues reported</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Report the first water issue and start a community-driven resolution pipeline.</p>
        </div>
      ) : null}

      {workspace === "manage" && canWork && !loading && issues.length > 0 && viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className={`rounded-2xl p-4 border-t-4 ${col.color} ${col.bg} min-h-[300px]`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-700">{col.label}</h3>
                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full">{grouped[col.key]?.length || 0}</span>
              </div>
              <div className="space-y-3">
                {(grouped[col.key] || []).map((issue) => (
                  <div key={issue._id} onClick={() => openDetail(issue)} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-teal-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">{issue.title}</h4>
                      <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${severityBadge[issue.severity] || "bg-slate-100 text-slate-600"}`}>{issue.severity}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{issue.description}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium"><span>{issue.reportedBy?.name || "Unknown"}</span><span>{issue.region || ""}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {workspace === "manage" && canWork && !loading && issues.length > 0 && viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50"><th className="text-left px-5 py-3 font-bold text-slate-600">Title</th><th className="text-left px-5 py-3 font-bold text-slate-600">Severity</th><th className="text-left px-5 py-3 font-bold text-slate-600">Status</th><th className="text-left px-5 py-3 font-bold text-slate-600">Region</th><th className="text-right px-5 py-3 font-bold text-slate-600">Actions</th></tr></thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id} className="border-b border-slate-100 hover:bg-teal-50/30 transition-colors cursor-pointer" onClick={() => openDetail(issue)}>
                  <td className="px-5 py-3 font-semibold text-slate-800">{issue.title}</td>
                  <td className="px-5 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityBadge[issue.severity] || ""}`}>{issue.severity}</span></td>
                  <td className="px-5 py-3"><select value={issue.status} onChange={(e) => { e.stopPropagation(); handleStatusChange(issue._id, e.target.value, true); }} onClick={(e) => e.stopPropagation()} className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 outline-none">{columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></td>
                  <td className="px-5 py-3 text-slate-500">{issue.region || "-"}</td>
                  <td className="px-5 py-3 text-right">{isAuthenticated ? <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(issue._id); }} className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg">Delete</button> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {workspace === "manage" && canWork && selectedIssue ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSelectedIssue(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedIssue.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500"><span className={`font-bold px-2 py-0.5 rounded-full ${severityBadge[selectedIssue.severity] || ""}`}>{selectedIssue.severity}</span><span>Reported by {selectedIssue.reportedBy?.name || "Unknown"}</span><span>{selectedIssue.region || ""}</span></div>
                </div>
                <button type="button" onClick={() => setSelectedIssue(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-light">x</button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedIssue.description}</p>
              {selectedIssue.images && selectedIssue.images.length > 0 ? (
                <div className="mt-4 grid grid-cols-3 gap-2">{selectedIssue.images.map((img, idx) => <img key={idx} src={selectedIssue.imageThumbnails?.[idx] || img} alt={`Issue photo ${idx + 1}`} className="w-full h-32 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80" onClick={() => window.open(img, "_blank")} />)}</div>
              ) : null}
              {isAuthenticated ? (
                <div className="mt-6 flex items-center gap-3"><span className="text-xs font-bold text-slate-500">Move to:</span>{columns.map((c) => <button key={c.key} type="button" onClick={() => { handleStatusChange(selectedIssue._id, c.key, true); setSelectedIssue({ ...selectedIssue, status: c.key }); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${selectedIssue.status === c.key ? "bg-teal-100 text-teal-700 ring-2 ring-teal-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{c.label}</button>)}</div>
              ) : null}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 mb-4">Discussion ({comments.length})</h3>
                {comments.length === 0 ? <p className="text-sm text-slate-400">No comments yet. Start the discussion.</p> : null}
                <div className="space-y-3 max-h-64 overflow-y-auto">{comments.map((c) => <div key={c._id} className="p-3 bg-slate-50 rounded-xl"><div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span className="font-bold text-slate-700">{c.user?.name || "Anonymous"}</span><span>{new Date(c.createdAt).toLocaleString()}</span></div><p className="text-sm text-slate-700">{c.content}</p></div>)}</div>
                {isAuthenticated ? (
                  <form onSubmit={submitComment} className="mt-4 flex gap-3"><input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" /><button type="submit" className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm">Post</button></form>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
