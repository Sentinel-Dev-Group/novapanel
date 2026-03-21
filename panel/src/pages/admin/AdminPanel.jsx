// ============================================================
//  AdminPanel.jsx — Admin management page
// ============================================================

import { useEffect, useState } from "react";
import {
  Users, Server, Globe, Shield,
  Search, Loader2, AlertCircle,
  CheckCircle, XCircle, MoreVertical,
  Plus, Activity, HardDrive, Cpu,
} from "lucide-react";
import Layout   from "../../components/layout/Layout";
import api      from "../../lib/api";

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    green:  "bg-green-500/10  text-green-400  border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red:    "bg-red-500/10    text-red-400    border-red-500/20",
  };

  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────
function RoleBadge({ role }) {
  const styles = {
    root:  "bg-red-500/10    text-red-400    border-red-500/20",
    admin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    user:  "bg-slate-500/10  text-slate-400  border-slate-500/20",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${styles[role] || styles.user}`}>
      {role}
    </span>
  );
}

// ── Status dot ────────────────────────────────────────────────
function StatusDot({ active, suspended }) {
  if (suspended) return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <XCircle className="w-3.5 h-3.5" /> Suspended
    </span>
  );
  if (active) return (
    <span className="flex items-center gap-1 text-xs text-green-400">
      <CheckCircle className="w-3.5 h-3.5" /> Active
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      <XCircle className="w-3.5 h-3.5" /> Inactive
    </span>
  );
}

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview",  icon: Activity },
  { id: "users",    label: "Users",     icon: Users    },
  { id: "servers",  label: "Servers",   icon: Server   },
  { id: "nodes",    label: "Nodes",     icon: Globe    },
];

// ── Main component ────────────────────────────────────────────
export default function AdminPanel() {
  const [tab,     setTab]     = useState("overview");
  const [users,   setUsers]   = useState([]);
  const [servers, setServers] = useState([]);
  const [nodes,   setNodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [u, s, n] = await Promise.all([
        api.get("/admin/users"),
        api.get("/servers"),
        api.get("/nodes"),
      ]);
      setUsers(u.data.users     || []);
      setServers(s.data.servers || []);
      setNodes(n.data.nodes     || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived stats ──────────────────────────────────────────
  const runningServers  = servers.filter((s) => s.status === "running").length;
  const suspendedUsers  = users.filter((u) => u.isSuspended).length;
  const onlineNodes     = nodes.filter((n) => n.status === "online").length;

  // ── Search filter ──────────────────────────────────────────
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredServers = servers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.gameType.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNodes = nodes.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Admin Panel
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage users, servers and nodes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#161b27] border border-[#1e2535] rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        <>
          {/* ── Overview tab ───────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users}  label="Total Users"       value={users.length}   color="indigo" />
                <StatCard icon={Server} label="Total Servers"     value={servers.length} color="green"  />
                <StatCard icon={Globe}  label="Online Nodes"      value={`${onlineNodes}/${nodes.length}`} color="yellow" />
                <StatCard icon={Shield} label="Suspended Users"   value={suspendedUsers} color={suspendedUsers > 0 ? "red" : "indigo"} />
              </div>

              {/* Recent users */}
              <div className="bg-[#161b27] border border-[#1e2535] rounded-xl">
                <div className="px-5 py-4 border-b border-[#1e2535] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Recent Users</h3>
                  <button
                    onClick={() => setTab("users")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    View all →
                  </button>
                </div>
                <div className="divide-y divide-[#1e2535]">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.uuid} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-400 uppercase">
                            {user.username[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.username}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RoleBadge role={user.role} />
                        <StatusDot active={user.isActive} suspended={user.isSuspended} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent servers */}
              <div className="bg-[#161b27] border border-[#1e2535] rounded-xl">
                <div className="px-5 py-4 border-b border-[#1e2535] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Recent Servers</h3>
                  <button
                    onClick={() => setTab("servers")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    View all →
                  </button>
                </div>
                <div className="divide-y divide-[#1e2535]">
                  {servers.slice(0, 5).map((server) => (
                    <div key={server.uuid} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{server.name}</p>
                        <p className="text-xs text-slate-500">
                          {server.gameType} · {server.node?.name}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                        server.status === "running"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {server.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Users tab ──────────────────────────────────── */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#161b27] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="bg-[#161b27] border border-[#1e2535] rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#1e2535] text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <div className="col-span-4">User</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Joined</div>
                  <div className="col-span-2">Last login</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-[#1e2535]">
                  {filteredUsers.map((user) => (
                    <div key={user.uuid} className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-[#1a2035] transition items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-400 uppercase">
                            {user.username[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{user.username}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <RoleBadge role={user.role} />
                      </div>
                      <div className="col-span-2">
                        <StatusDot active={user.isActive} suspended={user.isSuspended} />
                      </div>
                      <div className="col-span-2 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-2 text-xs text-slate-500">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Servers tab ────────────────────────────────── */}
          {tab === "servers" && (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search servers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#161b27] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="bg-[#161b27] border border-[#1e2535] rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#1e2535] text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <div className="col-span-4">Server</div>
                  <div className="col-span-2">Owner</div>
                  <div className="col-span-2">Node</div>
                  <div className="col-span-2">Resources</div>
                  <div className="col-span-2">Status</div>
                </div>

                <div className="divide-y divide-[#1e2535]">
                  {filteredServers.map((server) => (
                    <div key={server.uuid} className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-[#1a2035] transition items-center">
                      <div className="col-span-4">
                        <p className="text-sm font-medium text-white">{server.name}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {server.gameType?.replace(/_/g, " ")} · #{server.shortId}
                        </p>
                      </div>
                      <div className="col-span-2 text-xs text-slate-400">
                        {server.owner?.username || "—"}
                      </div>
                      <div className="col-span-2 text-xs text-slate-400">
                        {server.node?.name || "—"}
                      </div>
                      <div className="col-span-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" />{server.cpuLimit}%
                        </span>
                        <span className="flex items-center gap-1 mt-0.5">
                          <HardDrive className="w-3 h-3" />{server.memoryLimit}MB
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                          server.status === "running"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : server.status === "installing"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : server.status === "starting"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}>
                          {server.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Nodes tab ──────────────────────────────────── */}
          {tab === "nodes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search nodes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#161b27] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition ml-3">
                  <Plus className="w-4 h-4" />
                  Add Node
                </button>
              </div>

              <div className="grid gap-4">
                {filteredNodes.map((node) => (
                  <div key={node.uuid} className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5 hover:border-indigo-500/30 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{node.name}</p>
                          <p className="text-xs text-slate-500">{node.location} · {node.fqdn}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                        node.status === "online"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : node.status === "draining"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {node.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-[#0f1117] rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                          <Cpu className="w-3 h-3" /> CPU
                        </p>
                        <p className="text-sm font-bold text-white">{node.cpuTotal} cores</p>
                      </div>
                      <div className="bg-[#0f1117] rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                          <Activity className="w-3 h-3" /> Memory
                        </p>
                        <p className="text-sm font-bold text-white">{node.memoryTotal} MB</p>
                      </div>
                      <div className="bg-[#0f1117] rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                          <HardDrive className="w-3 h-3" /> Disk
                        </p>
                        <p className="text-sm font-bold text-white">{node.diskTotal} MB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}