import { NavLink, useNavigate } from "react-router-dom";
import {
  Zap, LayoutDashboard, Server, Globe,
  Settings, LogOut, Shield, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import api              from "../../lib/api";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard"          },
  { to: "/servers",   icon: Server,          label: "Servers"            },
  { to: "/nodes",     icon: Globe,           label: "Nodes",  admin: true },
  { to: "/admin",     icon: Shield,          label: "Admin",  admin: true },
  { to: "/settings",  icon: Settings,        label: "Settings"           },
];

export default function Sidebar() {
  const navigate              = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const admin                 = isAdmin();

  async function handleLogout() {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    navigate("/login");
  }

  return (
    <aside style={{
      position:    "fixed",
      left:        0,
      top:         0,
      height:      "100vh",
      width:       "220px",
      background:  "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display:     "flex",
      flexDirection: "column",
      zIndex:      50,
    }}>

      {/* Logo */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "10px",
        padding:      "20px 16px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          width:          "32px",
          height:         "32px",
          background:     "linear-gradient(135deg, #6366f1, #4f46e5)",
          borderRadius:   "10px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          boxShadow:      "0 0 16px rgba(99,102,241,0.4)",
          flexShrink:     0,
        }}>
          <Zap size={16} color="white" />
        </div>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
          Nova<span style={{ color: "var(--indigo-light)" }}>Panel</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV.filter((i) => !i.admin || admin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display:        "flex",
              alignItems:     "center",
              gap:            "10px",
              padding:        "9px 12px",
              borderRadius:   "8px",
              marginBottom:   "2px",
              fontSize:       "13px",
              fontWeight:     500,
              textDecoration: "none",
              transition:     "all 0.15s",
              background:     isActive ? "var(--indigo-glow)"   : "transparent",
              color:          isActive ? "var(--indigo-light)"  : "var(--text-secondary)",
              border:         isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "10px",
          padding:      "10px 12px",
          borderRadius: "8px",
          background:   "var(--bg-elevated)",
          marginBottom: "4px",
        }}>
          <div style={{
            width:          "30px",
            height:         "30px",
            borderRadius:   "50%",
            background:     "linear-gradient(135deg, #6366f1, #4f46e5)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            fontSize:       "11px",
            fontWeight:     700,
            color:          "white",
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.username}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
              {user?.role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width:          "100%",
            display:        "flex",
            alignItems:     "center",
            gap:            "10px",
            padding:        "9px 12px",
            borderRadius:   "8px",
            border:         "none",
            background:     "transparent",
            color:          "var(--text-muted)",
            fontSize:       "13px",
            fontWeight:     500,
            cursor:         "pointer",
            transition:     "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}