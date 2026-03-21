import { useState }      from "react";
import {
  User, Mail, Lock, Save, Shield,
  AlertCircle, CheckCircle, Loader2,
} from "lucide-react";
import Layout           from "../../components/layout/Layout";
import api              from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

// ── Reusable input ────────────────────────────────────────────
function Input({ label, icon: Icon, type = "text", name, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {Icon && <Icon size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />}
        <input
          type={type} name={name} value={value}
          onChange={onChange} placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%", boxSizing: "border-box",
            background: disabled ? "var(--bg-base)" : "var(--bg-elevated)",
            border: "1px solid var(--border)", borderRadius: "8px",
            padding: `10px 12px 10px ${Icon ? "34px" : "12px"}`,
            fontSize: "13px", color: disabled ? "var(--text-muted)" : "var(--text-primary)",
            outline: "none", transition: "border 0.15s",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.6 : 1,
          }}
          onFocus={(e)  => { if (!disabled) e.target.style.borderColor = "var(--indigo)"; }}
          onBlur={(e)   => { e.target.style.borderColor = "var(--border)"; }}
        />
      </div>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────
function Alert({ type, message }) {
  if (!message) return null;
  const s = type === "success"
    ? { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  color: "#22c55e" }
    : { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  color: "#ef4444" };
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: "8px", padding: "10px 14px",
      color: s.color, fontSize: "13px",
    }}>
      <Icon size={14} />{message}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────
function Card({ title, description, children }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "12px", overflow: "hidden",
    }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{title}</p>
        {description && <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{description}</p>}
      </div>
      <div style={{ padding: "24px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Save button ───────────────────────────────────────────────
function SaveBtn({ loading, label = "Save changes", icon: Icon = Save }) {
  return (
    <button
      type="submit" disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: "var(--indigo)", border: "none",
        borderRadius: "8px", padding: "9px 18px",
        color: "white", fontSize: "13px", fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxShadow: "0 0 16px rgba(99,102,241,0.25)",
        transition: "opacity 0.15s",
      }}
    >
      {loading
        ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
        : <><Icon size={13} />{label}</>
      }
    </button>
  );
}

// ── Info row ──────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: "12px", color: "var(--text-primary)", fontFamily: "monospace", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Settings() {
  const { user, setUser } = useAuthStore();

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName:  user?.lastName  || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileAlert,   setProfileAlert]   = useState(null);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordAlert,   setPasswordAlert]   = useState(null);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileAlert(null);
    try {
      const { data } = await api.patch("/users/me", profile);
      setUser(data.user);
      setProfileAlert({ type: "success", message: "Profile updated successfully" });
    } catch (err) {
      setProfileAlert({ type: "error", message: err.response?.data?.message || "Failed to update" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPasswordAlert(null);
    if (passwords.next !== passwords.confirm)
      return setPasswordAlert({ type: "error", message: "Passwords do not match" });
    if (passwords.next.length < 8)
      return setPasswordAlert({ type: "error", message: "Password must be at least 8 characters" });
    setPasswordLoading(true);
    try {
      await api.patch("/users/me/password", {
        currentPassword: passwords.current,
        newPassword:     passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordAlert({ type: "success", message: "Password changed successfully" });
    } catch (err) {
      setPasswordAlert({ type: "error", message: err.response?.data?.message || "Failed to change password" });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <Layout title="Settings">
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Settings</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Manage your account and preferences</p>
      </div>

      <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Profile */}
        <Card title="Profile" description="Update your personal information">
          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input label="First name" name="firstName" value={profile.firstName}
                onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="John" />
              <Input label="Last name" name="lastName" value={profile.lastName}
                onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Doe" />
            </div>
            <Input label="Username" icon={User} value={user?.username || ""} disabled />
            <Input label="Email address" icon={Mail} type="email" value={user?.email || ""} disabled />
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Username and email can only be changed by an admin.
            </p>
            {profileAlert && <Alert type={profileAlert.type} message={profileAlert.message} />}
            <div><SaveBtn loading={profileLoading} /></div>
          </form>
        </Card>

        {/* Password */}
        <Card title="Change Password" description="Use a strong password you don't use anywhere else">
          <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Input label="Current password" icon={Lock} type="password" name="current"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              placeholder="••••••••" />
            <Input label="New password" icon={Lock} type="password" name="next"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              placeholder="••••••••" />
            <Input label="Confirm new password" icon={Lock} type="password" name="confirm"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="••••••••" />
            {passwordAlert && <Alert type={passwordAlert.type} message={passwordAlert.message} />}
            <div><SaveBtn loading={passwordLoading} label="Change password" icon={Lock} /></div>
          </form>
        </Card>

        {/* Account info */}
        <Card title="Account" description="Your account details">
          <div>
            <InfoRow label="Account ID"    value={user?.uuid} />
            <InfoRow label="Role"          value={user?.role} />
            <InfoRow label="Member since"  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
            <InfoRow label="Last login"    value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"} />
            <InfoRow label="Last login IP" value={user?.lastLoginIp || "—"} />
          </div>
        </Card>

        {/* 2FA */}
        <Card title="Two-Factor Authentication" description="Add an extra layer of security">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Shield size={18} color="var(--text-muted)" />
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "2px" }}>2FA is not enabled</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Coming soon — TOTP authenticator app support</p>
            </div>
          </div>
        </Card>

      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </Layout>
  );
}