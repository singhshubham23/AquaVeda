import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getUserDashboard } from "../services/api.js";

const statusStyles = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  ACKNOWLEDGED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  VERIFIED: "bg-slate-50 text-slate-700 border-slate-200",
  ACTIVE: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function StatCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </article>
  );
}

function StatusBadge({ value }) {
  const normalized = String(value || "").toUpperCase();
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusStyles[normalized] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {value || "Draft"}
    </span>
  );
}

function EmptyBlock({ title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-black text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{text}</p>
      {action}
    </div>
  );
}

export default function MyActivityPage() {
  const { user } = useAuth();
  const { data, isFetching, error } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: getUserDashboard,
    placeholderData: { data: { profile: user, stats: {}, recentActivity: {} } },
  });

  const dashboard = data?.data || {};
  const profile = dashboard.profile || user;
  const stats = dashboard.stats || {};
  const recent = dashboard.recentActivity || {};
  const questions = (recent.wiki || []).filter((item) => item.type === "QUESTION");

  const statCards = [
    { label: "Questions", value: stats.wikiQuestions ?? questions.length },
    { label: "Issues Reported", value: stats.issuesReported || 0 },
    { label: "Discussions", value: stats.commentsPosted || 0 },
    { label: "Projects", value: (stats.projectsCreated || 0) + (stats.projectsContributing || 0) },
  ];

  const timeline = useMemo(() => {
    const issueItems = (recent.issues || []).map((item) => ({
      id: `issue-${item._id}`,
      type: "Issue",
      title: item.title,
      detail: `${item.severity || "LOW"} severity in ${item.region || "global"}`,
      status: item.status,
      createdAt: item.createdAt,
      to: "/community",
    }));

    const wikiItems = (recent.wiki || []).map((item) => ({
      id: `wiki-${item._id}`,
      type: item.type === "QUESTION" ? "Question" : "Contribution",
      title: item.title,
      detail: item.type === "QUESTION" ? "Question posted for community answers" : "Knowledge contribution submitted",
      status: item.status,
      createdAt: item.createdAt,
      to: "/community",
    }));

    const commentItems = (recent.comments || []).map((item) => ({
      id: `comment-${item._id}`,
      type: item.targetType === "QUESTION" ? "Answer" : "Discussion",
      title: item.targetTitle,
      detail: item.content,
      status: item.isAccepted ? "Best answer" : "Posted",
      createdAt: item.createdAt,
      to: "/community",
    }));

    const projectItems = (recent.projects || []).map((item) => ({
      id: `project-${item._id}`,
      type: item.relation === "CREATED" ? "Project created" : "Project joined",
      title: item.title,
      detail: `${item.progress ?? 0}% progress`,
      status: item.status,
      createdAt: item.createdAt,
      to: "/projects",
    }));

    return [...issueItems, ...wikiItems, ...commentItems, ...projectItems].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [recent]);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">My Activity</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {profile?.name || "Your"} contribution history
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track your questions, issue reports, replies, and project work from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/community" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-teal-700">
              Post Question
            </Link>
            <Link to="/community" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">
              Start Discussion
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load your activity.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-500">Newest actions across community, issues, and projects.</p>
            </div>
            {isFetching ? <span className="text-xs font-bold text-slate-400">Refreshing...</span> : null}
          </div>

          {timeline.length === 0 ? (
            <EmptyBlock
              title="No activity yet"
              text="Ask a question, report an issue, or reply to a discussion and it will appear here."
              action={<Link to="/community" className="mt-4 inline-flex rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-teal-700">Go to Community</Link>}
            />
          ) : (
            <div className="space-y-3">
              {timeline.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 no-underline transition hover:border-teal-200 hover:bg-teal-50/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-teal-700">{item.type}</p>
                      <h3 className="mt-1 truncate text-base font-black text-slate-900">{item.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge value={item.status} />
                      <span className="text-xs font-semibold text-slate-400">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-900">My Questions</h2>
            <p className="mt-1 text-sm text-slate-500">Questions you submitted for community answers.</p>
          </div>

          {questions.length === 0 ? (
            <EmptyBlock
              title="No questions yet"
              text="Post a focused question so other members can answer it."
              action={<Link to="/community" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-slate-800">Ask Question</Link>}
            />
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <Link
                  key={question._id}
                  to="/community"
                  className="block rounded-2xl border border-slate-100 p-4 no-underline transition hover:border-teal-200 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-sm font-black leading-6 text-slate-900">{question.title}</h3>
                    <StatusBadge value={question.status} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-400">{formatDate(question.createdAt)}</p>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
