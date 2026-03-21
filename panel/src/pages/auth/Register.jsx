// ============================================================
//  Register.jsx — Register page
// ============================================================

import { useState }          from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import api              from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuthStore();

  const [form, setForm] = useState({
    username:  "",
    email:     "",
    password:  "",
    confirm:   "",
    firstName: "",
    lastName:  "",
  });

  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  // ── Password strength ───────────────────────────────────────
  function getStrength(password) {
    let score = 0;
    if (password.length >= 8)                    score++;
    if (/[A-Z]/.test(password))                  score++;
    if (/[0-9]/.test(password))                  score++;
    if (/[^A-Za-z0-9]/.test(password))           score++;
    return score;
  }

  const strength      = getStrength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "red", "yellow", "blue", "green"][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // ── Client side validation ────────────────────────────
    if (form.password !== form.confirm) {
      return setError("Passwords do not match");
    }

    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) {
      return setError("Username can only contain letters, numbers, _ and -");
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", {
        username:  form.username,
        email:     form.email,
        password:  form.password,
        firstName: form.firstName || undefined,
        lastName:  form.lastName  || undefined,
      });

      login(data.user, data.accessToken, data.refreshToken);
      navigate("/dashboard");

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 py-12">
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

        {/* Card */}
        <div className="bg-[#161b27] border border-[#1e2535] rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">
            Create an account
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Get started with NovaPanel today
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full bg-[#0f1117] border border-[#1e2535] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full bg-[#0f1117] border border-[#1e2535] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  required
                  className="w-full bg-[#0f1117] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

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
                  placeholder="john@example.com"
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

              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength
                            ? strengthColor === "red"    ? "bg-red-500"
                            : strengthColor === "yellow" ? "bg-yellow-500"
                            : strengthColor === "blue"   ? "bg-blue-500"
                            : "bg-green-500"
                            : "bg-[#1e2535]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    strengthColor === "red"    ? "text-red-400"
                    : strengthColor === "yellow" ? "text-yellow-400"
                    : strengthColor === "blue"   ? "text-blue-400"
                    : "text-green-400"
                  }`}>
                    {strengthLabel} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0f1117] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                {/* Match indicator */}
                {form.confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirm
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                : "Create account"
              }
            </button>

          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}