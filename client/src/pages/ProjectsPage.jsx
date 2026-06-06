import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  getProjects,
  createProject,
  joinProject,
  updateProjectProgress,
  getIssues,
  createIssue,
} from "../services/api.js";
import toast from "react-hot-toast";
import useScrollToHash from "../hooks/useScrollToHash.js";
import { hasPermission, PERMISSIONS } from "../lib/accessControl.js";

const statusColors = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-700",
};

const suggestedIssues = [
  {
    title: "Pipeline Leakage Monitoring",
    description: "Frequent leakage in neighborhood distribution line causing major water loss.",
    severity: "HIGH",
    region: "Urban Zone",
    location: { type: "Point", coordinates: [77.209, 28.6139] },
  },
  {
    title: "Rainwater Harvesting Retrofit",
    description: "Community buildings need rooftop harvesting setup and storage channeling.",
    severity: "MEDIUM",
    region: "Residential Zone",
    location: { type: "Point", coordinates: [77.225, 28.635] },
  },
  {
    title: "Groundwater Quality Testing",
    description: "Local borewells require periodic contamination testing and reporting workflow.",
    severity: "CRITICAL",
    region: "Peri-Urban Zone",
    location: { type: "Point", coordinates: [77.18, 28.58] },
  },
];

function KpiCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-800">{value}</p>
    </article>
  );
}

export default function ProjectsPage() {
  const { isAuthenticated, user } = useAuth();
  useScrollToHash();
  const queryClient = useQueryClient();
  const canAct = hasPermission(user, PERMISSIONS.PROJECT_CREATE);
  const [showCreate, setShowCreate] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    region: "",
    location: { type: "Point", coordinates: [77.209, 28.6139] },
  });
  const [issueImages, setIssueImages] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", relatedIssue: "" });

  const { data: projects = [], isFetching } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await getProjects();
      return res.data?.items || [];
    },
    placeholderData: (previousData) => previousData || [],
  });

  const { data: issueOptions = [] } = useQuery({
    queryKey: ["project-issue-options"],
    queryFn: async () => {
      const res = await getIssues({ limit: 50 });
      return res.data?.items || [];
    },
    placeholderData: (previousData) => previousData || [],
  });

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "ACTIVE").length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;
    const contributors = projects.reduce((sum, p) => sum + (p.contributors?.length || 0), 0);
    return { total, active, completed, contributors };
  }, [projects]);

  const invalidateProjects = () => queryClient.invalidateQueries({ queryKey: ["projects"] });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success("Project created successfully!");
      setForm({ title: "", description: "", relatedIssue: "" });
      setShowCreate(false);
      invalidateProjects();
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinProject,
    onSuccess: () => {
      toast.success("Joined the project!");
      invalidateProjects();
    },
  });

  const progressMutation = useMutation({
    mutationFn: ({ id, progress }) => updateProjectProgress(id, progress),
    onSuccess: () => {
      toast.success("Progress updated!");
      invalidateProjects();
    },
  });

  const generateIssuesMutation = useMutation({
    mutationFn: async () => {
      for (const issue of suggestedIssues) {
        await createIssue(issue);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-issue-options"] });
      await queryClient.invalidateQueries({ queryKey: ["issues-map"] });
      toast.success("Suggested issues added. You can now link your project.");
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (payload) => {
      const selectedImages = Array.from(issueImages || []);
      if (selectedImages.length < 1 || selectedImages.length > 3) throw new Error("Please upload at least 1 and at most 3 images.");
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("severity", payload.severity);
      formData.append("region", payload.region);
      formData.append("location", JSON.stringify(payload.location));
      selectedImages.slice(0, 3).forEach((file) => formData.append("images", file));
      return createIssue(formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-issue-options"] });
      await queryClient.invalidateQueries({ queryKey: ["issues-map"] });
      toast.success("Issue created");
      setShowIssueModal(false);
      setIssueForm({ title: "", description: "", severity: "MEDIUM", region: "", location: { type: "Point", coordinates: [77.209, 28.6139] } });
      setIssueImages([]);
    },
    onError: (err) => toast.error(err?.message || "Failed to create issue"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!canAct) {
      toast.error("Your account cannot create projects.");
      return;
    }
    if (!/^[0-9a-fA-F]{24}$/.test(form.relatedIssue)) {
      toast.error("Please select a valid related issue.");
      return;
    }
    createMutation.mutate(form);
  };

  const handleJoin = (id) => joinMutation.mutate(id);
  const handleProgress = (id, progress) => progressMutation.mutate({ id, progress });

  return (
    <main className="space-y-6">
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 shadow-xl">
        <div className="p-6 md:p-8 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100 font-semibold">Project Control</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Water Project Command Center</h1>
          <p className="mt-2 text-cyan-50 max-w-2xl">Launch initiatives, align to issues, and move projects from idea to verified impact.</p>
          {isAuthenticated && canAct ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-xl border border-white/40 text-white text-sm font-semibold hover:bg-white/10">{showCreate ? "Cancel" : "New Project"}</button>
              <button type="button" onClick={() => setShowIssueModal(true)} className="px-4 py-2 rounded-xl bg-white text-teal-700 text-sm font-semibold hover:bg-teal-50">New Issue</button>
            </div>
          ) : isAuthenticated ? (
            <div className="mt-5 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-cyan-50">
              Project creation is unavailable for this account.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Projects" value={stats.total} />
        <KpiCard label="Active" value={stats.active} />
        <KpiCard label="Completed" value={stats.completed} />
        <KpiCard label="Contributors" value={stats.contributors} />
      </section>

      {showCreate && canAct ? (
        <form onSubmit={handleCreate} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Project</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 font-semibold text-slate-700">Project Title
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-normal" />
            </label>
            <label className="flex flex-col gap-1.5 font-semibold text-slate-700">Related Issue
              <select value={form.relatedIssue} onChange={(e) => setForm({ ...form, relatedIssue: e.target.value })} required className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-normal">
                <option value="">Select an issue</option>{issueOptions.map((issue) => <option key={issue._id} value={issue._id}>{issue.title}</option>)}
              </select>
            </label>
          </div>
          {issueOptions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">No issues found to link. Generate suggested issues for first projects.</p>
              <button type="button" onClick={() => generateIssuesMutation.mutate()} disabled={generateIssuesMutation.isPending} className="mt-3 px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-60">{generateIssuesMutation.isPending ? "Generating..." : "Generate Suggested Issues"}</button>
            </div>
          ) : null}
          <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mt-4">Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none font-normal" />
          </label>
          <button type="submit" disabled={createMutation.isPending} className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl disabled:opacity-60">{createMutation.isPending ? "Creating..." : "Create Project"}</button>
        </form>
      ) : null}

      {showIssueModal && canAct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Create Issue</h3><button onClick={() => setShowIssueModal(false)} className="text-slate-500">Close</button></div>
            <form onSubmit={(e) => { e.preventDefault(); createIssueMutation.mutate(issueForm); }}>
              <label className="flex flex-col gap-1.5 font-semibold text-slate-700">Title
                <input value={issueForm.title} onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })} required className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-normal" />
              </label>
              <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mt-3">Description
                <textarea value={issueForm.description} onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })} required rows={4} className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none font-normal" />
              </label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="flex flex-col">Severity
                  <select value={issueForm.severity} onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg"><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option></select>
                </label>
                <label className="flex flex-col">Region
                  <input value={issueForm.region} onChange={(e) => setIssueForm({ ...issueForm, region: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg" />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 font-semibold text-slate-700 mt-3">Photos (1-3 images)
                <input type="file" accept="image/*" multiple required onChange={(e) => setIssueImages(Array.from(e.target.files || []).slice(0, 3))} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </label>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" disabled={createIssueMutation.isPending} className="px-4 py-2 bg-teal-600 text-white rounded-lg">{createIssueMutation.isPending ? "Creating..." : "Create Issue"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isFetching ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div> : null}

      {!isFetching && projects.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <h3 className="text-xl font-bold text-slate-700">No projects yet</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Create a project linked to an issue to start collaboration.</p>
        </div>
      ) : null}

      <section id="project-catalog" className="space-y-5">
        {!isFetching && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <article key={project._id} className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-700 leading-snug">{project.title}</h3>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[project.status] || "bg-slate-100 text-slate-600"}`}>{project.status}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">{project.description}</p>
                <div className="mb-4"><div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1"><span>Progress</span><span>{project.progress ?? 0}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" style={{ width: `${project.progress ?? 0}%` }} /></div></div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4"><span>{project.createdBy?.name || "Unknown"}</span><span>{project.contributors?.length || 0} contributors</span></div>
                {isAuthenticated && canAct ? (
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => handleJoin(project._id)} className="flex-1 px-3 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg">Join</button>
                    <button type="button" onClick={() => { const p = window.prompt("Enter progress (0-100):", project.progress ?? 0); if (p !== null && !Number.isNaN(Number(p))) handleProgress(project._id, Number(p)); }} className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg">Update Progress</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
