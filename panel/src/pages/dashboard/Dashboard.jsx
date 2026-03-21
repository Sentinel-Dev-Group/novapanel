// ============================================================
//  Dashboard.jsx — Main dashboard page
// ============================================================

import { useEffect, useState }  from "react";
import {
  Server, Cpu, MemoryStick, HardDrive,
  Activity, Globe, TrendingUp, AlertTriangle,
} from "lucide-react";
import Layout  from "../../components/layout/Layout";
import api     from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

// ── Stat card component ───────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    green:  "bg-green-500/10  text-green-400  border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red:    "bg-red-500/10    text-red-400    border-red-500/20",
  };

  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Server status badge ───────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    running:    "bg-green-500/10  text-green-400  border-green-500/20",
    stopped:    "bg-slate-500/10  text-slate-400  border-slate-500/20",
    starting:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    stopping:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
    installing: "bg-blue-500/10   text-blue-400   border-blue-500/20",
    error:      "bg-red-500/10    text-red-400    border-red-500/20",
    suspended:  "bg-red-500/10    text-red-400    border-red-500/20",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${styles[status] || styles.stopped}`}>
      {status}
    </span>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { user }                    = useAuthStore();
  const [servers, setServers]       = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/servers");
        setServers(data.servers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived stats ───────────────────────────────────────────
  const running  = servers.filter((s) => s.status === "running").length;
  const stopped  = servers.filter((s) => s.status === "stopped").length;
  const issues   = servers.filter((s) =>
    ["error", "suspended"].includes(s.status)
  ).length;

  return (
    <Layout title="Dashboard">

      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          Welcome back, {user?.username} 👋
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Here's what's happening with your servers today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Server}
          label="Total Servers"
          value={servers.length}
          sub="across all nodes"
          color="indigo"
        />
        <StatCard
          icon={Activity}
          label="Running"
          value={running}
          sub={`${stopped} stopped`}
          color="green"
        />
        <StatCard
          icon={Globe}
          label="Nodes"
          value="1"
          sub="online"
          color="yellow"
        />
        <StatCard
          icon={AlertTriangle}
          label="Issues"
          value={issues}
          sub="need attention"
          color={issues > 0 ? "red" : "indigo"}
        />
      </div>

      {/* Server list */}
      <div className="bg-[#161b27] border border-[#1e2535] rounded-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2535]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            Your Servers
          </h3>
          <span className="text-xs text-slate-500">
            {servers.length} total
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">
            Loading servers...
          </div>
        ) : servers.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">
            No servers yet
          </div>
        ) : (
          <div className="divide-y divide-[#1e2535]">
            {servers.map((server) => (
              <div
                key={server.uuid}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a2035] transition"
              >
                {/* Name + game type */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                    <Server className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {server.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {server.gameType} · {server.allocation?.ip}:{server.allocation?.port}
                    </p>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right">
                    <p className="text-xs text-slate-500">
                      {server.node?.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {server.memoryLimit}MB RAM
                    </p>
                  </div>
                  <StatusBadge status={server.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </Layout>
  );
}