// ============================================================
//  Settings.jsx — User settings page
// ============================================================

import { useState }      from "react";
import {
  User, Mail, Lock, Save,
  AlertCircle, CheckCircle, Loader2, Shield,
} from "lucide-react";
import Layout            from "../../components/layout/Layout";
import api               from "../../lib/api";
import { useAuthStore }  from "../../store/authStore";

// ── Section card ──────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-6">
      <div className="mb-5 pb-4 border-b border-[#1e2535]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────
function Field({ label, icon: Icon, type = "text", name, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-[#0f1117] border border-[#1e2535] rounded-lg ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────
function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    success: "bg-green-500/10 border-green-500/20 text-green-400",
    error:   "bg-red-500/10   border-red-500/20   text-red-400",
  };
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Settings() {
  const { user, setUser } = useAuthStore();

  // ── Profile form ───────────────────────────────────────────
  const [profile, setProfile] = useState({
    username:  user?.username  || "",
    email:     user?.email     || "",
    firstName: user?.firstName || "",
    lastName:  user?.lastName  || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileAlert,   setProfileAlert]   = useState(null);

  // ── Password form ──────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    current: "",
    next:    "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordAlert,   setPasswordAlert]   = useState(null);

  function handleProfileChange(e) {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileAlert(null);
  }

  function handlePasswordChange(e) {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordAlert(null);
  }

  // ── Save profile ───────────────────────────────────────────
  async function saveProfile(e) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileAlert(null);

    try {
      const { data } = await api.patch("/users/me", {
        firstName: profile.firstName || null,
        lastName:  profile.lastName  || null,
      });
      setUser(data.user);
      setProfileAlert({ type: "success", message: "Profile updated successfully" });
    } catch (err) {
      setProfileAlert({
        type:    "error",
        message: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Change password ────────────────────────────────────────
  async function changePassword(e) {
    e.preventDefault();
    setPasswordAlert(null);

    if (passwords.next !== passwords.confirm) {
      return setPasswordAlert({ type: "error", message: "New passwords do not match" });
    }

    if (passwords.next.length < 8) {
      return setPasswordAlert({ type: "error", message: "Password must be at least 8 characters" });
    }

    setPasswordLoading(true);

    try {
      await api.patch("/users/me/password", {
        currentPassword: passwords.current,
        newPassword:     passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordAlert({ type: "success", message: "Password changed successfully" });
    } catch (err) {
      setPasswordAlert({
        type:    "error",
        message: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <Layout title="Settings">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage your account and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Profile */}
        <Section
          title="Profile"
          description="Update your personal information"
        >
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="First name"
                icon={User}
                name="firstName"
                value={profile.firstName}
                onChange={handleProfileChange}
                placeholder="John"
              />
              <Field
                label="Last name"
                name="lastName"
                value={profile.lastName}
                onChange={handleProfileChange}
                placeholder="Doe"
              />
            </div>

            <Field
              label="Username"
              icon={User}
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
              disabled
            />

            <Field
              label="Email address"
              icon={Mail}
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              disabled
            />

            <p className="text-xs text-slate-600">
              Username and email cannot be changed here — contact an admin.
            </p>

            {profileAlert && (
              <Alert type={profileAlert.type} message={profileAlert.message} />
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
            >
              {profileLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> Save changes</>
              }
            </button>
          </form>
        </Section>

        {/* Password */}
        <Section
          title="Change Password"
          description="Use a strong password you don't use anywhere else"
        >
          <form onSubmit={changePassword} className="space-y-4">
            <Field
              label="Current password"
              icon={Lock}
              type="password"
              name="current"
              value={passwords.current}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
            <Field
              label="New password"
              icon={Lock}
              type="password"
              name="next"
              value={passwords.next}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
            <Field
              label="Confirm new password"
              icon={Lock}
              type="password"
              name="confirm"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />

            {passwordAlert && (
              <Alert type={passwordAlert.type} message={passwordAlert.message} />
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
            >
              {passwordLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</>
                : <><Lock className="w-4 h-4" /> Change password</>
              }
            </button>
          </form>
        </Section>

        {/* Account info */}
        <Section title="Account" description="Your account details">
          <div className="space-y-3 text-sm">
            {[
              { label: "Account ID",  value: user?.uuid },
              { label: "Role",        value: user?.role },
              { label: "Member since", value: user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"
              },
              { label: "Last login",  value: user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "—"
              },
              { label: "Last login IP", value: user?.lastLoginIp || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[#1e2535] last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 font-mono text-xs truncate max-w-64">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* 2FA — coming soon */}
        <Section
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-slate-600" />
            <div>
              <p className="text-sm text-slate-300">2FA is not enabled</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Coming soon — TOTP authenticator support
              </p>
            </div>
          </div>
        </Section>

      </div>
    </Layout>
  );
}