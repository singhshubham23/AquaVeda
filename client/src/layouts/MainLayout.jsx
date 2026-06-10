import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useState } from "react";
import logo from "../assets/06cfca35-7eaf-4671-8d24-49efb87d1e71.jpg";

const navItems = [
  { to: "/explore", label: "Explore", icon: MapIcon },
  { to: "/activity", label: "My Activity", icon: BoltIcon },
  { to: "/community", label: "Community", icon: ChatIcon },
  { to: "/learn", label: "Learn", icon: BookIcon },
  { to: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { to: "/dashboard", label: "Dashboard", icon: ChartIcon },
];

function NavIcon({ Icon, active }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
        active
          ? "border-white/15 bg-white/12 text-white shadow-[0_8px_24px_rgba(125,211,252,0.18)]"
          : "border-white/10 bg-white/5 text-slate-200 group-hover:bg-white/10 group-hover:text-white"
      }`}
    >
      <Icon />
    </span>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M9 18.25 3 20V6.5l6-1.75m0 13.5 6-1.75m-6 1.75V4.75m6 11.75 6 1.75V4.75l-6-1.75m0 13.5V4.75m0 0L9 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M13.5 2.5 5.5 13h5l-1 8.5L18.5 10h-5l0-7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M20 14.5a4.5 4.5 0 0 1-4.5 4.5H9l-4 3v-3.5A4.5 4.5 0 0 1 0.5 14V8.5A4.5 4.5 0 0 1 5 4h10.5A4.5 4.5 0 0 1 20 8.5v6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.5 9.5h9M7.5 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M5.5 4.5A2.5 2.5 0 0 1 8 2h11v18H8a2.5 2.5 0 0 0-2.5 2.5V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 2v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M8 4h8v2a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 4H4a2 2 0 0 0 2 2h2m8-2h2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10v4m-3 6h6m-5 0 .5-2h3l.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M4 19.5h16M6.5 16V10m5 6.5V7m5 9.5v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 animate-fade-up">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950 via-cyan-900 to-teal-900/95 backdrop-blur-2xl border-b border-sky-300/20 shadow-[0_18px_50px_rgba(2,6,23,0.28)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-[84px] py-2">
            {/* Brand */}
            <NavLink to="/" className="flex items-center gap-3 no-underline">
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white shadow-[0_10px_30px_rgba(20,184,166,0.18)] ring-1 ring-slate-200 animate-float-soft">
                <img
                  src={logo}
                  alt="AquaVeda"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-extrabold text-white leading-tight tracking-tight">
                  AquaVeda
                </h1>
                <p className="text-[10px] text-slate-300 font-medium -mt-0.5 tracking-wide uppercase">
                  Water Intelligence Platform
                </p>
              </div>
            </NavLink>

            {/* Desktop Nav */}
            <nav
              className="hidden md:flex items-center gap-1"
              aria-label="Primary"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 no-underline ${
                      isActive
                        ? "bg-gradient-to-r from-sky-300/20 via-cyan-300/15 to-teal-300/20 text-white shadow-sm ring-1 ring-sky-200/30 scale-[1.02]"
                        : "text-slate-300 hover:bg-white/10 hover:text-white hover:scale-[1.02]"
                    }`
                  }
                >
                  {({ isActive }) => <NavIcon Icon={item.icon} active={isActive} />}
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 shadow-sm backdrop-blur-md">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold animate-shimmer shadow-md">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="leading-tight">
                      <span className="block text-xs font-bold text-white">
                        {user?.name || "User"}
                      </span>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-200">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <NavLink
                    to="/profile"
                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all hover:bg-white/10 no-underline hover:scale-[1.02]"
                  >
                    Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-red-200 border border-white/10 hover:border-red-300/40 rounded-xl transition-all hover:bg-red-500/12 hover:scale-[1.02]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all no-underline hover:bg-white/10 hover:scale-[1.02]"
                  >
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 hover:from-sky-300 hover:via-cyan-300 hover:to-teal-300 rounded-xl transition-all no-underline shadow-md hover:shadow-lg hover:scale-[1.02]"
                  >
                    Get Started
                  </NavLink>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg hover:bg-white/12 text-slate-200 transition-transform active:scale-95"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <nav className="md:hidden pb-4 pt-2 border-t border-white/10 mt-2 flex flex-col gap-1 animate-fade-up">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all no-underline ${
                      isActive
                        ? "bg-sky-300/18 text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => <NavIcon Icon={item.icon} active={isActive} />}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 font-medium">
            © 2026 AquaVeda — Water Intelligence Platform
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-slate-400 hover:text-teal-600 transition-colors no-underline"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-slate-400 hover:text-teal-600 transition-colors no-underline"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-sm text-slate-400 hover:text-teal-600 transition-colors no-underline"
            >
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

