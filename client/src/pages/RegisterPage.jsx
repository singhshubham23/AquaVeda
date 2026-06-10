import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import toast from "react-hot-toast";
import logo from "../assets/06cfca35-7eaf-4671-8d24-49efb87d1e71.jpg";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await register({ name, email, password });
      toast.success("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animate-fade-up">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-emerald-950 via-teal-900 to-teal-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl animate-float-soft" />
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-teal-200 rounded-full blur-3xl animate-float-soft" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/90 backdrop-blur-sm ring-1 ring-white/30 animate-float-soft">
              <img src={logo} alt="AquaVeda" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">AquaVeda</span>
          </div>
          <p className="text-teal-200 text-sm font-medium">Water Intelligence Platform</p>
        </div>

        <div className="relative z-10">
          <h3 className="text-white text-2xl font-bold leading-snug mb-6">
            Join a growing community of water guardians
          </h3>
          <div className="flex flex-col gap-4">
            {[
              { icon: "🌊", title: "Report Issues", desc: "Flag water crises in your region instantly" },
              { icon: "📖", title: "Share Knowledge", desc: "Contribute articles to the community wiki" },
              { icon: "📊", title: "Track Impact", desc: "See your personal contribution dashboard" },
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

        <p className="text-teal-300 text-xs relative z-10">© 2026 AquaVeda — Free to join, free to contribute</p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="w-full max-w-md glass-card rounded-3xl p-6 md:p-8 animate-fade-up">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white ring-1 ring-slate-200 animate-float-soft">
              <img src={logo} alt="AquaVeda" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-slate-800">AquaVeda</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-slate-500 mt-2 font-medium">Join thousands making a real water impact</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Full Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 shadow-sm bg-white/90"
                placeholder="John Doe"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 shadow-sm bg-white/90"
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
                  minLength={6}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 shadow-sm bg-white/90"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Must be at least 6 characters</p>
            </label>

            <button
              type="submit"
              disabled={loading}
              id="register-submit-btn"
              className="mt-1 w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 text-sm tracking-wide hover:scale-[1.01]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Creating account…
                </span>
              ) : "Create Account →"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-600 font-bold hover:text-teal-800 transition-colors no-underline">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
