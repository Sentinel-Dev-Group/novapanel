// ============================================================
//  ServerList.jsx — Servers list page
// ============================================================

import { useEffect, useState }       from "react";
import { useNavigate }               from "react-router-dom";
import {
  Server, Play, Square, RotateCcw,
  Plus, Search, AlertCircle, Loader2,
  Cpu, MemoryStick, Globe,
} from "lucide-react";
import Layout    from "../../components/layout/Layout";
import api       from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

// ── Status badge ──────────────────────────────────────────────
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
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${styles[status] || styles.stopped}`}>
      {status}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────
function ActionButton({ onClick, icon: Icon, label, color, disabled, loading }) {
  const colors = {
    green:  "hover:bg-green-500/10  hover:text-green-400  hover:border-green-500/20",
    red:    "hover:bg-red-500/10    hover:text-red-400    hover:border-red-500/20",
    yellow: "hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
      className={`w-8 h-8 rounded-lg border border-[#1e2535] text-slate-500 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed ${colors[color]}`}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Icon className="w-3.5 h-3.5" />
      }
    </button>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ServerList() {
  const navigate              = useNavigate();
  const { isAdmin }           = useAuthStore();
  const admin                 = isAdmin();

  const [servers,  setServers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [actionId, setActionId] = useState(null); // uuid of server being actioned

  // ── Load servers ───────────────────────────────────────────
  useEffect(() => {
    loadServers();
  }, []);

  async function loadServers() {
    try {
      const { data } = await api.get("/servers");
      setServers(data.servers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── Server actions ─────────────────────────────────────────
  async function handleAction(server, action) {
    setActionId(server.uuid);
    try {
      await api.post(`/servers/${server.uuid}/${action}`);
      // Optimistically update the status
      const newStatus = action === "start"
        ? "starting" : action === "stop"
        ? "stopping" : "starting";

      setServers((prev) =>
        prev.map((s) =>
          s.uuid === server.uuid ? { ...s, status: newStatus } : s
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  }

  // ── Filter by search ───────────────────────────────────────
  const filtered = servers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.gameType.toLowerCase().includes(search.toLowerCase()) ||
    s.node?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Servers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Servers</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {servers.length} server{servers.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {/* Create button — admin only */}
        {admin && (
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" />
            New Server
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, game type or node..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#161b27] border border-[#1e2535] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Server cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading servers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Server className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">
            {search ? "No servers match your search" : "No servers yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((server) => (
            <div
              key={server.uuid}
              className="bg-[#161b27] border border-[#1e2535] rounded-xl p-4 hover:border-indigo-500/30 transition cursor-pointer group"
              onClick={() => navigate(`/servers/${server.uuid}`)}
            >
              <div className="flex items-center gap-4">

                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Server className="w-5 h-5 text-indigo-400" />
                </div>

                {/* Name + details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition truncate">
                      {server.name}
                    </p>
                    <span className="text-xs text-slate-600 font-mono shrink-0">
                      #{server.shortId}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {server.node?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {server.cpuLimit}%
                    </span>
                    <span className="flex items-center gap-1">
                      <MemoryStick className="w-3 h-3" />
                      {server.memoryLimit}MB
                    </span>
                    <span className="text-slate-600">
                      {server.allocation?.ip}:{server.allocation?.port}
                    </span>
                    <span className="capitalize text-slate-600">
                      {server.gameType?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Status + actions */}
                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <StatusBadge status={server.status} />

                  {/* Start */}
                  <ActionButton
                    icon={Play}
                    label="Start"
                    color="green"
                    loading={actionId === server.uuid}
                    disabled={
                      ["running", "starting", "installing", "suspended"].includes(server.status)
                    }
                    onClick={() => handleAction(server, "start")}
                  />

                  {/* Stop */}
                  <ActionButton
                    icon={Square}
                    label="Stop"
                    color="red"
                    loading={actionId === server.uuid}
                    disabled={
                      ["stopped", "stopping", "installing", "suspended"].includes(server.status)
                    }
                    onClick={() => handleAction(server, "stop")}
                  />

                  {/* Restart */}
                  <ActionButton
                    icon={RotateCcw}
                    label="Restart"
                    color="yellow"
                    loading={actionId === server.uuid}
                    disabled={
                      ["stopped", "stopping", "installing", "suspended"].includes(server.status)
                    }
                    onClick={() => handleAction(server, "restart")}
                  />
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </Layout>
  );
}