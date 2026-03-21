import { useState }          from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import api              from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuthStore();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
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
    <div style={{
      minHeight:      "100vh",
      background:     "var(--bg-base)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "24px",
    }}>
      {/* Glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translateX(-50%)",
        width: "500px", height: "300px",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "400px", position: "relative" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{
            width: "40px", height: "40px",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            borderRadius: "12px", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(99,102,241,0.4)",
          }}>
            <Zap size={20} color="white" />
          </div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            Nova<span style={{ color: "var(--indigo-light)" }}>Panel</span>
          </span>
        </div>

        {/* Card */}
        <div style={{
          background:   "var(--bg-surface)",
          border:       "1px solid var(--border)",
          borderRadius: "16px",
          padding:      "32px",
          boxShadow:    "0 24px 48px rgba(0,0,0,0.3)",
        }}>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Sign in to your NovaPanel account
          </p>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px", padding: "10px 14px",
              color: "#ef4444", fontSize: "13px", marginBottom: "20px",
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com" required
                  style={{
                    width: "100%", background: "var(--bg-elevated)",
                    border: "1px solid var(--border)", borderRadius: "8px",
                    padding: "10px 12px 10px 34px", fontSize: "13px",
                    color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
                    transition: "border 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="password" name="password" value={form.password}
                  onChange={handleChange} placeholder="••••••••" required
                  style={{
                    width: "100%", background: "var(--bg-elevated)",
                    border: "1px solid var(--border)", borderRadius: "8px",
                    padding: "10px 12px 10px 34px", fontSize: "13px",
                    color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
                    transition: "border 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: loading ? "var(--indigo-dim)" : "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none", borderRadius: "8px",
                color: "white", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                transition: "opacity 0.15s", marginTop: "4px",
              }}
            >
              {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "20px" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--indigo-light)", textDecoration: "none" }}>
            Create one
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}