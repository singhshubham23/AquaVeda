import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  let context = null;

  if (path.startsWith("/explore") || path.startsWith("/map")) {
    context = (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Explore</h3>
        <p className="text-sm text-slate-600">Discover water issues, view real-time data on the map, and filter by severity or region.</p>
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
          <h4 className="text-xs font-bold text-teal-800">Quick Tip</h4>
          <p className="text-xs text-teal-600 mt-1">Zoom in to see clustered issues break apart into individual reports.</p>
        </div>
      </div>
    );
  } else if (path.startsWith("/community")) {
    context = (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Community</h3>
        <p className="text-sm text-slate-600">Collaborate with others, discuss issues, and track resolutions in a kanban board.</p>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <h4 className="text-xs font-bold text-indigo-800">Get Involved</h4>
          <p className="text-xs text-indigo-600 mt-1">Help verify resolved issues or provide helpful answers to earn reputation.</p>
        </div>
      </div>
    );
  } else if (path.startsWith("/dashboard")) {
    context = (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dashboard</h3>
        <p className="text-sm text-slate-600">View overall analytics, trends, and your personal contribution metrics.</p>
        {user && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <h4 className="text-xs font-bold text-amber-800">Your Impact</h4>
            <p className="text-xs text-amber-600 mt-1">Keep contributing to earn more badges and climb the leaderboard.</p>
          </div>
        )}
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
          <h4 className="text-xs font-bold text-teal-800">Leaderboard</h4>
          <p className="text-xs text-teal-600 mt-1">Open the top contributor board from the main nav to see rankings and activity scores.</p>
        </div>
      </div>
    );
  } else {
    context = (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">AquaVeda</h3>
        <p className="text-sm text-slate-600">Water Intelligence Platform for tracking and resolving issues.</p>
      </div>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 h-full overflow-y-auto pr-4 hidden lg:block border-r border-slate-200/60 mr-6">
      <div className="sticky top-6">
        {context}
      </div>
    </aside>
  );
}
