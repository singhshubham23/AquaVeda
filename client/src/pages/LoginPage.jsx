import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-emerald-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-extrabold text-xl">A</div>
            <span className="text-white font-extrabold text-xl tracking-tight">AquaVeda</span>
          </div>
          <p className="text-teal-200 text-sm font-medium">Water Intelligence Platform</p>
        </div>

        <div className="relative z-10">
          <blockquote className="text-white text-2xl font-bold leading-snug mb-6">
            "Every data point drives better water outcomes for millions of lives."
          </blockquote>
          <div className="flex flex-col gap-4">
            {[
              { icon: "🗺️", title: "Issue Mapping", desc: "Track & visualize water crises in real-time" },
              { icon: "🤝", title: "Collaboration", desc: "Coordinate projects with expert teams" },
              { icon: "🤖", title: "AI Insights", desc: "Recommendations powered by machine learning" },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg shrink-0">{f.icon}</div>
                <div>
                  <p className="text-white font-bold text-sm">{f.title}</p>
                  <p className="text-teal-200 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-teal-300 text-xs relative z-10">© 2026 AquaVeda — Water Intelligence Platform</p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-extrabold">A</div>
            <span className="font-extrabold text-slate-800">AquaVeda</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2 font-medium">Sign in to your account to continue</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400"
                placeholder="you@company.com"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="mt-1 w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-teal-600 font-bold hover:text-teal-800 transition-colors no-underline">
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
