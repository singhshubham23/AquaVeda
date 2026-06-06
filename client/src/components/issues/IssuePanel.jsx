import IssueActions from "./IssueActions.jsx";
import IssueAISection from "./IssueAISection.jsx";
import IssueCommentsPreview from "./IssueCommentsPreview.jsx";
import IssueDetails from "./IssueDetails.jsx";
import IssueHeader from "./IssueHeader.jsx";
import IssueTimeline from "./IssueTimeline.jsx";

export default function IssuePanel({ issue }) {
  if (!issue) {
    return (
      <div className="h-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-sm p-8 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">Map</p>
        <h2 className="text-xl font-extrabold text-slate-800">Select an issue</h2>
        <p className="text-base text-slate-500 mt-3 max-w-[260px] leading-relaxed">Click any marker on the map to open context, insights, and actions.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white/75 backdrop-blur-xl border border-white/50 rounded-3xl shadow-sm overflow-y-auto flex flex-col gap-0">
      <IssueHeader issue={issue} />
      <div className="px-6 md:px-7 pb-6 flex flex-col gap-5">
        <IssueDetails issue={issue} />

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Insights</p>
          <IssueAISection issue={issue} />
        </div>

        {issue.timeline && issue.timeline.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Timeline</p>
            <IssueTimeline timeline={issue.timeline} />
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Community</p>
          <IssueCommentsPreview issue={issue} />
        </div>

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Action</p>
          <IssueActions issue={issue} />
        </div>
      </div>
    </div>
  );
}
