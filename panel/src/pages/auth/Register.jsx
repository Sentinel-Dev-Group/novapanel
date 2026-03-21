import { useState }          from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Mail, Lock, User,
  AlertCircle, Loader2, CheckCircle,
} from "lucide-react";
import api              from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

function strength(p) {
  let s = 0;
  if (p.length >= 8)           s++;
  if (/[A-Z]/.test(p))         s++;
  if (/[0-9]/.test(p))         s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username:"", email:"", password:"", confirm:"", firstName:"", lastName:"" });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  }

  const s      = strength(form.password);
  const sLabel = ["","Weak","Fair","Good","Strong"][s];
  const sColor = ["","#ef4444","#eab308","#3b82f6","#22c55e"][s];

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (form.password.length < 8)       return setError("Password must be at least 8 characters");
    if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) return setError("Username can only contain letters, numbers, _ and -");
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

  const inputStyle = {
    width: "100%", background: "var(--bg-elevated)",
    border: "1px solid var(--border)", borderRadius: "8px",
    padding: "10px 12px", fontSize: "13px",
    color: "var(--text-primary)", outline: "none",
    boxSizing: "border-box", transition: "border 0.15s",
  };

  const iconInputStyle = { ...inputStyle, paddingLeft: "34px" };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px",
    }}>
      {/* Glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translateX(-50%)",
        width: "500px", height: "300px",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>

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
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px", padding: "32px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
        }}>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Create an account
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Get started with NovaPanel today
          </p>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px", padding: "10px 14px",
              color: "#ef4444", fontSize: "13px", marginBottom: "20px",
            }}>
              <AlertCircle size={14} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>First name</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Last name</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            {/* Username */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Username</label>
              <div style={{ position: "relative" }}>
                <User size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="johndoe" required style={iconInputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required style={iconInputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required style={iconInputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              {/* Strength bar */}
              {form.password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1,2,3,4].map((i) => (
                      <div key={i} style={{
                        height: "3px", flex: 1, borderRadius: "3px",
                        background: i <= s ? sColor : "var(--bg-elevated)",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: "11px", color: sColor }}>{sLabel} password</p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Confirm password</label>
              <div style={{ position: "relative" }}>
                <Lock size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="••••••••" required style={iconInputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
                {form.confirm && (
                  <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                    {form.password === form.confirm
                      ? <CheckCircle size={14} color="#22c55e" />
                      : <AlertCircle size={14} color="#ef4444" />
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none", borderRadius: "8px",
                color: "white", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px",
                opacity: loading ? 0.7 : 1,
                marginTop: "4px",
              }}
            >
              {loading
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating account...</>
                : "Create account"
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--indigo-light)", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}