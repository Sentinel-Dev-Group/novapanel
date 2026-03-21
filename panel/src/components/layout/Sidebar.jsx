// ============================================================
//  Sidebar.jsx — Main navigation sidebar
// ============================================================

import { NavLink, useNavigate } from "react-router-dom";
import {
  Zap, LayoutDashboard, Server, Globe,
  Settings, LogOut, Shield, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import api              from "../../lib/api";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/servers",   icon: Server,          label: "Servers"   },
  { to: "/nodes",     icon: Globe,           label: "Nodes",  adminOnly: true },
  { to: "/admin",     icon: Shield,          label: "Admin",  adminOnly: true },
  { to: "/settings",  icon: Settings,        label: "Settings"  },
];

export default function Sidebar() {
  const navigate             = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const admin                = isAdmin();

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    logout();
    navigate("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0d1117] border-r border-[#1e2535] flex flex-col z-50">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1e2535]">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          Nova<span className="text-indigo-400">Panel</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.filter((item) => !item.adminOnly || admin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-[#161b27]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-indigo-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[#1e2535]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#161b27] mb-1">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-400 uppercase">
              {user?.username?.[0] || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400" />
          Sign out
        </button>
      </div>
    </aside>
  );
}