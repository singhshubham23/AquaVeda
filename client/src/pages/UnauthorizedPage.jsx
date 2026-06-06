import { Link, useLocation } from "react-router-dom";

export default function UnauthorizedPage() {
  const location = useLocation();
  const fromPath = location.state?.from?.pathname || location.state?.from || "/explore";

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <section className="w-full max-w-2xl rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">Access denied</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">You do not have permission to view this page.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The route you tried to open is restricted to a different role. If you believe this is a mistake, ask an administrator to review your account access.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={fromPath}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white no-underline hover:bg-slate-800"
          >
            Go back
          </Link>
          <Link
            to="/explore"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50"
          >
            Explore public content
          </Link>
        </div>
      </section>
    </main>
  );
}
