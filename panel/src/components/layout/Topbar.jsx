// ============================================================
//  Topbar.jsx — Top navigation bar
// ============================================================

import { Bell, Search } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function Topbar({ title }) {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-[#0d1117] border-b border-[#1e2535] flex items-center justify-between px-6">

      {/* Page title */}
      <h1 className="text-lg font-semibold text-white">
        {title}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-[#161b27] border border-[#1e2535] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-48 transition"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg bg-[#161b27] border border-[#1e2535] flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition">
          <Bell className="w-4 h-4" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-400 uppercase">
            {user?.username?.[0] || "?"}
          </span>
        </div>

      </div>
    </header>
  );
}