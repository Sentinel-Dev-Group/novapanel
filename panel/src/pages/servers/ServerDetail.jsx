import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate }      from "react-router-dom";
import {
  Server, Play, Square, RotateCcw, ArrowLeft,
  Cpu, MemoryStick, HardDrive, Terminal,
  Activity, Settings, Loader2, AlertCircle,
  Copy, Check, Globe, Clock,
} from "lucide-react";
import Layout           from "../../components/layout/Layout";
import api              from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    running:    { bg: "rgba(34,197,94,0.1)",   color: "#22c55e", border: "rgba(34,197,94,0.25)"   },
    stopped:    { bg: "rgba(100,116,139,0.1)",  color: "#64748b", border: "rgba(100,116,139,0.25)" },
    starting:   { bg: "rgba(234,179,8,0.1)",   color: "#eab308", border: "rgba(234,179,8,0.25)"   },
    stopping:   { bg: "rgba(249,115,22,0.1)",  color: "#f97316", border: "rgba(249,115,22,0.25)"  },
    installing: { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.25)"  },
    error:      { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"   },
    suspended:  { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"   },
  };
  const s = map[status] || map.stopped;
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600,
      padding: "3px 10px", borderRadius: "20px",
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, percent, color = "#6366f1" }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{sub}</p>}
      {percent !== undefined && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ height: "3px", background: "var(--bg-elevated)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "3px",
              width: `${Math.min(percent, 100)}%`,
              background: percent > 90 ? "#ef4444" : percent > 70 ? "#eab308" : color,
              transition: "width 0.3s",
            }} />
          </div>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{percent}% used</p>
        </div>
      )}
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#22c55e" : "var(--text-muted)", padding: "2px" }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ── Action button ─────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, hoverColor, onClick, disabled, loading }) {
  const [hovered, setHovered] = useState(false);
  const colors = {
    green:  { bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)",  color: "#22c55e" },
    red:    { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  color: "#ef4444" },
    yellow: { bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)",  color: "#eab308" },
  };
  const c = colors[hoverColor];
  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "7px 14px", borderRadius: "8px",
        border: `1px solid ${hovered && !disabled ? c.border : "var(--border)"}`,
        background: hovered && !disabled ? c.bg : "transparent",
        color: hovered && !disabled ? c.color : "var(--text-muted)",
        fontSize: "13px", fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "all 0.15s",
      }}
    >
      {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Icon size={13} />}
      {label}
    </button>
  );
}

// ── Console ───────────────────────────────────────────────────
function Console() {
  const [lines,   setLines]   = useState([
    { type: "info", text: "Console ready — waiting for server connection..." },
  ]);
  const [input,   setInput]   = useState("");
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function handleCommand(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLines((prev) => [
      ...prev,
      { type: "command", text: `> ${input}` },
      { type: "info",    text: "Command sent" },
    ]);
    setInput("");
  }

  const colors = { info: "#8892a4", command: "#818cf8", error: "#ef4444", warn: "#eab308", success: "#22c55e" };

  return (
    <div style={{
      background: "#05080f",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px 16px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
          <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#eab308", opacity: 0.7 }} />
          <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#22c55e", opacity: 0.7 }} />
        </div>
        <Terminal size={12} color="var(--text-muted)" style={{ marginLeft: "8px" }} />
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Console</span>
      </div>

      {/* Output */}
      <div style={{ height: "320px", overflowY: "auto", padding: "16px", fontSize: "12px", lineHeight: "1.7" }}>
        {lines.map((line, i) => (
          <p key={i} style={{ color: colors[line.type] || colors.info, margin: 0 }}>{line.text}</p>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleCommand} style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px 16px",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
      }}>
        <span style={{ color: "var(--indigo-light)", fontSize: "12px" }}>{">"}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
          style={{
            flex: 1, background: "transparent", border: "none",
            fontSize: "12px", color: "var(--text-primary)",
            outline: "none", fontFamily: "inherit",
          }}
        />
        <button type="submit" style={{
          padding: "4px 12px", borderRadius: "6px",
          border: "1px solid var(--border)",
          background: "transparent", color: "var(--text-muted)",
          fontSize: "11px", cursor: "pointer",
          transition: "all 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.color = "var(--indigo-light)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────
function InfoRow({ label, value, copy }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-primary)", fontFamily: "monospace", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </span>
        {copy && <CopyBtn text={value} />}
      </div>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────
function Tab({ id, active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "8px 16px", borderRadius: "8px",
        border: "none",
        background: active ? "var(--indigo)" : "transparent",
        color: active ? "white" : "var(--text-muted)",
        fontSize: "13px", fontWeight: 500,
        cursor: "pointer", transition: "all 0.15s",
        boxShadow: active ? "0 0 16px rgba(99,102,241,0.3)" : "none",
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ServerDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isAdmin } = useAuthStore();

  const [server,    setServer]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [actioning, setActioning] = useState(false);
  const [tab,       setTab]       = useState("overview");

  useEffect(() => { loadServer(); }, [id]);

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
      const status = action === "start" ? "starting" : action === "stop" ? "stopping" : "starting";
      setServer((prev) => ({ ...prev, status }));
    } catch (err) {
      console.error(err);
    } finally {
      setActioning(false);
    }
  }

  if (loading) return (
    <Layout title="Server">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", color: "var(--text-muted)", gap: "8px" }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "13px" }}>Loading server...</span>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </Layout>
  );

  if (error) return (
    <Layout title="Server">
      <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
        <AlertCircle size={32} color="#ef4444" style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "16px" }}>{error}</p>
        <button onClick={() => navigate("/servers")} style={{ background: "none", border: "none", color: "var(--indigo-light)", fontSize: "13px", cursor: "pointer" }}>
          ← Back to servers
        </button>
      </div>
    </Layout>
  );

  const canStart   = !["running","starting","installing","suspended"].includes(server.status);
  const canStop    = !["stopped","stopping","installing","suspended"].includes(server.status);
  const canRestart = !["stopped","stopping","installing","suspended"].includes(server.status);

  return (
    <Layout title={server.name}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/servers")}
            style={{
              width: "32px", height: "32px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.color = "var(--indigo-light)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <ArrowLeft size={14} />
          </button>

          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(99,102,241,0.15)",
          }}>
            <Server size={18} color="var(--indigo)" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{server.name}</h2>
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: "4px" }}>
                #{server.shortId}
              </span>
              <StatusBadge status={server.status} />
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {server.gameType?.replace(/_/g, " ")} · {server.node?.name} · {server.allocation?.ip}:{server.allocation?.port}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ActionBtn icon={Play}     label="Start"   hoverColor="green"  disabled={!canStart   || actioning} loading={actioning} onClick={() => handleAction("start")}   />
          <ActionBtn icon={Square}   label="Stop"    hoverColor="red"    disabled={!canStop    || actioning} onClick={() => handleAction("stop")}    />
          <ActionBtn icon={RotateCcw} label="Restart" hoverColor="yellow" disabled={!canRestart || actioning} onClick={() => handleAction("restart")} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "4px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px", padding: "4px",
        width: "fit-content", marginBottom: "20px",
      }}>
        <Tab id="overview" active={tab === "overview"} icon={Activity}  label="Overview"  onClick={setTab} />
        <Tab id="console"  active={tab === "console"}  icon={Terminal}  label="Console"   onClick={setTab} />
        <Tab id="settings" active={tab === "settings"} icon={Settings}  label="Settings"  onClick={setTab} />
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            <StatCard icon={Cpu}         label="CPU Usage" value={`${server.statsSnapshot?.cpu ?? 0}%`}    sub={`Limit: ${server.cpuLimit}%`}      percent={server.statsSnapshot?.cpu ?? 0}                                                                    color="#6366f1" />
            <StatCard icon={MemoryStick} label="Memory"    value={`${server.statsSnapshot?.memory ?? 0}MB`} sub={`Limit: ${server.memoryLimit}MB`} percent={server.statsSnapshot ? Math.round((server.statsSnapshot.memory/server.memoryLimit)*100) : 0}        color="#22c55e" />
            <StatCard icon={HardDrive}   label="Disk"      value={`${server.statsSnapshot?.disk ?? 0}MB`}  sub={`Limit: ${server.diskLimit}MB`}    percent={server.statsSnapshot ? Math.round((server.statsSnapshot.disk/server.diskLimit)*100) : 0}           color="#eab308" />
            <StatCard icon={Activity}    label="Players"   value={server.statsSnapshot?.players ?? 0}       sub="connected"                                                                                                                                       color="#3b82f6" />
          </div>

          {/* Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Server Details</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Configuration and connection info</p>
              <InfoRow label="Server ID"    value={server.uuid}             copy />
              <InfoRow label="Short ID"     value={`#${server.shortId}`}        />
              <InfoRow label="Game Type"    value={server.gameType?.replace(/_/g," ")} />
              <InfoRow label="Docker Image" value={server.dockerImage}          />
              <InfoRow label="IP Address"   value={server.allocation?.ip}   copy />
              <InfoRow label="Port"         value={server.allocation?.port}     />
            </div>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Node & Timing</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Hosting and lifecycle info</p>
              <InfoRow label="Node"         value={server.node?.name}           />
              <InfoRow label="Location"     value={server.node?.location}       />
              <InfoRow label="Auto Restart" value={server.autoRestart ? "Yes" : "No"} />
              <InfoRow label="SFTP"         value={server.sftpEnabled ? "Enabled" : "Disabled"} />
              <InfoRow label="Created"      value={new Date(server.createdAt).toLocaleDateString()} />
              <InfoRow label="Last Started" value={server.lastStartedAt ? new Date(server.lastStartedAt).toLocaleString() : "Never"} />
            </div>
          </div>

          {/* Env vars */}
          {server.environment && Object.keys(server.environment).length > 0 && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Environment Variables</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontFamily: "monospace", fontSize: "12px" }}>
                {Object.entries(server.environment).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--indigo-light)" }}>{k}</span>
                    <span style={{ color: "var(--text-muted)" }}>=</span>
                    <span style={{ color: "var(--text-secondary)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Console */}
      {tab === "console" && <Console />}

      {/* Settings */}
      {tab === "settings" && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Server Settings</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Settings panel coming soon — resource limits, startup command, and danger zone.
          </p>
        </div>
      )}

    </Layout>
  );
}