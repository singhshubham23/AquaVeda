import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useState } from "react";

const navItems = [
  { to: "/explore", label: "Explore", icon: "🗺️" },
  { to: "/activity", label: "My Activity", icon: "⚡" },
  { to: "/community", label: "Community", icon: "💬" },
  { to: "/learn", label: "Learn", icon: "📖" },
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <NavLink to="/" className="flex items-center gap-3 no-underline">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                A
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-extrabold text-slate-800 leading-tight tracking-tight">
                  AquaVeda
                </h1>
                <p className="text-[10px] text-slate-500 font-medium -mt-0.5 tracking-wide uppercase">
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
                        ? "bg-teal-50 text-teal-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="text-xs font-bold text-teal-700">
                      {user?.name || "User"}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                  <NavLink
                    to="/profile"
                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl transition-all hover:bg-slate-50 no-underline"
                  >
                    Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-all hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl transition-all no-underline hover:bg-slate-50"
                  >
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl transition-all no-underline shadow-md hover:shadow-lg"
                  >
                    Get Started
                  </NavLink>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <nav className="md:hidden pb-4 pt-2 border-t border-slate-100 mt-2 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all no-underline ${
                      isActive
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  <span>{item.icon}</span>
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

