// ============================================================
//  Login.jsx — Login page
// ============================================================

import { useState }        from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import api                 from "../../lib/api";
import { useAuthStore }    from "../../store/authStore";

export default function Login() {
  const navigate   = useNavigate();
  const { login }  = useAuthStore();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.accessToken, data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">

      {/* Card */}
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Nova<span className="text-indigo-400">Panel</span>
          </span>
        </div>

        {/* Form card */}
        <div className="bg-[#161b27] border border-[#1e2535] rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Sign in to your account to continue
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  required
                  className="w-full bg-[#0f1117] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0f1117] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : "Sign in"
              }
            </button>

          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}