// ============================================================
//  ServerDetail.jsx — Individual server management page
// ============================================================

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate }      from "react-router-dom";
import {
  Server, Play, Square, RotateCcw, ArrowLeft,
  Cpu, MemoryStick, HardDrive, Globe, Terminal,
  Activity, Settings, Loader2, AlertCircle,
  Copy, Check,
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

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, percent }) {
  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      {percent !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percent > 90 ? "bg-red-500" :
                percent > 70 ? "bg-yellow-500" : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">{percent}% used</p>
        </div>
      )}
    </div>
  );
}

// ── Console ───────────────────────────────────────────────────
function Console({ serverId }) {
  const [lines,   setLines]   = useState([
    { type: "info", text: "Console ready — waiting for server connection..." },
  ]);
  const [input,   setInput]   = useState("");
  const bottomRef             = useRef(null);

  // Auto scroll to bottom when new lines added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function handleCommand(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLines((prev) => [
      ...prev,
      { type: "command", text: `> ${input}` },
      { type: "info",    text: "Command sent to server" },
    ]);
    setInput("");
  }

  const lineStyles = {
    info:    "text-slate-400",
    command: "text-indigo-400",
    error:   "text-red-400",
    warn:    "text-yellow-400",
    success: "text-green-400",
  };

  return (
    <div className="bg-[#0a0d14] border border-[#1e2535] rounded-xl overflow-hidden">
      {/* Console header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2535] bg-[#0d1117]">
        <Terminal className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-slate-300">Console</span>
        <div className="flex gap-1.5 ml-auto">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
      </div>

      {/* Output */}
      <div className="h-72 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {lines.map((line, i) => (
          <p key={i} className={lineStyles[line.type] || "text-slate-400"}>
            {line.text}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleCommand}
        className="flex items-center gap-2 px-4 py-3 border-t border-[#1e2535] bg-[#0d1117]"
      >
        <span className="text-indigo-400 font-mono text-xs shrink-0">{">"}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command and press Enter..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="text-xs text-slate-500 hover:text-indigo-400 transition px-2 py-1 rounded border border-[#1e2535] hover:border-indigo-500/30"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-slate-500 hover:text-indigo-400 transition"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-400" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </button>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ServerDetail() {
  const { id }                = useParams();
  const navigate              = useNavigate();
  const { isAdmin }           = useAuthStore();
  const admin                 = isAdmin();

  const [server,   setServer]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [actioning, setActioning] = useState(false);
  const [tab,      setTab]      = useState("overview"); // overview | console | settings

  useEffect(() => {
    loadServer();
  }, [id]);

  async function loadServer() {
    try {
      const { data } = await api.get(`/servers/${id}`);
      setServer(data.server);
    } catch (err) {
      setError(err.response?.data?.message || "Server not found");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    setActioning(true);
    try {
      await api.post(`/servers/${id}/${action}`);
      const newStatus = action === "start"
        ? "starting" : action === "stop"
        ? "stopping" : "starting";
      setServer((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error(err);
    } finally {
      setActioning(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout title="Server">
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading server...
        </div>
      </Layout>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <Layout title="Server">
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => navigate("/servers")}
            className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition"
          >
            ← Back to servers
          </button>
        </div>
      </Layout>
    );
  }

  const canStart   = !["running", "starting", "installing", "suspended"].includes(server.status);
  const canStop    = !["stopped", "stopping", "installing", "suspended"].includes(server.status);
  const canRestart = !["stopped", "stopping", "installing", "suspended"].includes(server.status);

  return (
    <Layout title={server.name}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate("/servers")}
            className="w-8 h-8 rounded-lg border border-[#1e2535] text-slate-400 hover:text-white hover:border-slate-600 flex items-center justify-center transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Server icon */}
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
            <Server className="w-5 h-5 text-indigo-400" />
          </div>

          {/* Name + meta */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{server.name}</h2>
              <span className="text-xs text-slate-600 font-mono">#{server.shortId}</span>
              <StatusBadge status={server.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {server.gameType?.replace(/_/g, " ")} · {server.node?.name} · {server.allocation?.ip}:{server.allocation?.port}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction("start")}
            disabled={!canStart || actioning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1e2535] text-sm text-slate-400 hover:text-green-400 hover:bg-green-500/10 hover:border-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start
          </button>

          <button
            onClick={() => handleAction("stop")}
            disabled={!canStop || actioning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1e2535] text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>

          <button
            onClick={() => handleAction("restart")}
            disabled={!canRestart || actioning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1e2535] text-sm text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#161b27] border border-[#1e2535] rounded-xl p-1 w-fit">
        {[
          { id: "overview", icon: Activity,  label: "Overview"  },
          { id: "console",  icon: Terminal,  label: "Console"   },
          { id: "settings", icon: Settings,  label: "Settings"  },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
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

      {/* ── Overview tab ───────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">

          {/* Resource stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Cpu}
              label="CPU Usage"
              value={`${server.statsSnapshot?.cpu ?? 0}%`}
              sub={`Limit: ${server.cpuLimit}%`}
              percent={server.statsSnapshot?.cpu ?? 0}
            />
            <StatCard
              icon={MemoryStick}
              label="Memory"
              value={`${server.statsSnapshot?.memory ?? 0} MB`}
              sub={`Limit: ${server.memoryLimit} MB`}
              percent={server.statsSnapshot
                ? Math.round((server.statsSnapshot.memory / server.memoryLimit) * 100)
                : 0
              }
            />
            <StatCard
              icon={HardDrive}
              label="Disk"
              value={`${server.statsSnapshot?.disk ?? 0} MB`}
              sub={`Limit: ${server.diskLimit} MB`}
              percent={server.statsSnapshot
                ? Math.round((server.statsSnapshot.disk / server.diskLimit) * 100)
                : 0
              }
            />
            <StatCard
              icon={Activity}
              label="Players"
              value={server.statsSnapshot?.players ?? 0}
              sub="connected"
            />
          </div>

          {/* Server info */}
          <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">
              Server Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              {[
                { label: "Server ID",    value: server.uuid,       copy: true  },
                { label: "Short ID",     value: `#${server.shortId}`           },
                { label: "Game Type",    value: server.gameType?.replace(/_/g, " ") },
                { label: "Docker Image", value: server.dockerImage             },
                { label: "Node",         value: server.node?.name              },
                { label: "Location",     value: server.node?.location          },
                { label: "IP Address",   value: server.allocation?.ip,  copy: true },
                { label: "Port",         value: server.allocation?.port         },
                { label: "Auto Restart", value: server.autoRestart ? "Yes" : "No" },
                { label: "SFTP",         value: server.sftpEnabled ? "Enabled" : "Disabled" },
                { label: "Created",      value: new Date(server.createdAt).toLocaleDateString() },
                { label: "Last Started", value: server.lastStartedAt
                    ? new Date(server.lastStartedAt).toLocaleString()
                    : "Never"
                },
              ].map(({ label, value, copy }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[#1e2535] last:border-0">
                  <span className="text-slate-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-mono text-xs truncate max-w-48">
                      {value}
                    </span>
                    {copy && <CopyButton text={value} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environment variables */}
          {server.environment && Object.keys(server.environment).length > 0 && (
            <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">
                Environment Variables
              </h3>
              <div className="space-y-2">
                {Object.entries(server.environment).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-indigo-400 shrink-0">{key}</span>
                    <span className="text-slate-600">=</span>
                    <span className="text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Console tab ────────────────────────────────────── */}
      {tab === "console" && (
        <Console serverId={server.uuid} />
      )}

      {/* ── Settings tab ───────────────────────────────────── */}
      {tab === "settings" && (
        <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Server Settings
          </h3>
          <p className="text-sm text-slate-500">
            Settings panel coming soon — will include resource limit editing,
            startup command, and danger zone (delete server).
          </p>
        </div>
      )}

    </Layout>
  );
}