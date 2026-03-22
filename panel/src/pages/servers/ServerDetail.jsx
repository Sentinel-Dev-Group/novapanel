import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate }      from "react-router-dom";
import {
  Server, Play, Square, RotateCcw, ArrowLeft,
  Cpu, MemoryStick, HardDrive, Terminal,
  Activity, Settings, Loader2, AlertCircle,
  Copy, Check,
} from "lucide-react";
import Layout               from "../../components/layout/Layout";
import api                  from "../../lib/api";
import { useAuthStore }     from "../../store/authStore";
import { useServerConsole } from "../../hooks/useWebSocket";

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
      borderRadius: "12px", padding: "16px",
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
      {loading
        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
        : <Icon size={13} />
      }
      {label}
    </button>
  );
}

// ── Console ───────────────────────────────────────────────────
function Console({ serverId }) {
  const { lines, connected, sendCommand, clearConsole } = useServerConsole(serverId);
  const [input,   setInput]   = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    sendCommand(input);
    setHistory((prev) => [input, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] || "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : history[next]);
    }
  }

  const lineColors = {
    info:    "#8892a4",
    command: "#818cf8",
    error:   "#ef4444",
    warn:    "#eab308",
    success: "#22c55e",
  };

  return (
    <div style={{
      background: "#05080f", border: "1px solid var(--border)",
      borderRadius: "12px", overflow: "hidden",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            {["#ef4444","#eab308","#22c55e"].map((c) => (
              <div key={c} style={{ width: "11px", height: "11px", borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <Terminal size={12} color="var(--text-muted)" />
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Console</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: connected ? "#22c55e" : "#ef4444",
              boxShadow: connected ? "0 0 6px #22c55e" : "none",
            }} />
            <span style={{ fontSize: "10px", color: connected ? "#22c55e" : "#ef4444" }}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <button
          onClick={clearConsole}
          style={{
            background: "transparent", border: "1px solid var(--border)",
            borderRadius: "6px", padding: "3px 10px",
            color: "var(--text-muted)", fontSize: "11px", cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.color = "var(--indigo-light)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          Clear
        </button>
      </div>

      <div
        style={{ height: "380px", overflowY: "auto", padding: "14px 16px", fontSize: "12px", lineHeight: "1.8" }}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Waiting for server output...</p>
        ) : lines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: "10px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "10px", opacity: 0.4, flexShrink: 0, paddingTop: "2px" }}>
              {new Date(line.time).toLocaleTimeString()}
            </span>
            <p style={{ margin: 0, color: lineColors[line.type] || lineColors.info, wordBreak: "break-all" }}>
              {line.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 16px", background: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <span style={{ color: "var(--indigo-light)", fontSize: "13px", flexShrink: 0 }}>{">"}</span>
        <input
          ref={inputRef}
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? "Type a command... (↑↓ for history)" : "Waiting for connection..."}
          disabled={!connected}
          style={{
            flex: 1, background: "transparent", border: "none",
            fontSize: "12px", color: "var(--text-primary)",
            outline: "none", fontFamily: "inherit",
            opacity: connected ? 1 : 0.5,
          }}
        />
        <button
          type="submit" disabled={!connected}
          style={{
            padding: "4px 12px", borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-muted)",
            fontSize: "11px", cursor: connected ? "pointer" : "not-allowed",
            opacity: connected ? 1 : 0.5, transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (connected) { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.color = "var(--indigo-light)"; }}}
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
        padding: "8px 16px", borderRadius: "8px", border: "none",
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

// ── Settings alert ────────────────────────────────────────────
function SettingsAlert({ data }) {
  if (!data) return null;
  const s = data.type === "success"
    ? { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  color: "#22c55e" }
    : { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  color: "#ef4444" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: "8px", padding: "10px 14px",
      color: s.color, fontSize: "13px",
    }}>
      {data.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
      {data.message}
    </div>
  );
}

// ── Settings save button ──────────────────────────────────────
function SettingsSaveBtn({ loading, label = "Save changes" }) {
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
        : <>{label}</>
      }
    </button>
  );
}

// ── Settings card ─────────────────────────────────────────────
function SettingsCard({ title, description, children }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "12px", overflow: "hidden",
    }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{title}</p>
        {description && <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{description}</p>}
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

// ── Server Settings ───────────────────────────────────────────
function ServerSettings({ server, onUpdate, onDelete }) {
  const { isAdmin } = useAuthStore();
  const admin       = isAdmin();

  const [general, setGeneral] = useState({
    name:        server.name        || "",
    description: server.description || "",
    autoRestart: server.autoRestart,
    autoStart:   server.autoStart,
    backupLimit: server.backupLimit || 3,
  });

  const [resources, setResources] = useState({
    memoryLimit: server.memoryLimit || 0,
    diskLimit:   server.diskLimit   || 0,
    cpuLimit:    server.cpuLimit    || 100,
    swapLimit:   server.swapLimit   || 0,
  });

  const [startup, setStartup] = useState({
    startCommand: server.startCommand || "",
    dockerImage:  server.dockerImage  || "",
  });

  const [generalLoading,   setGeneralLoading]   = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [startupLoading,   setStartupLoading]   = useState(false);
  const [deleteLoading,    setDeleteLoading]     = useState(false);
  const [deleteConfirm,    setDeleteConfirm]     = useState("");

  const [generalAlert,   setGeneralAlert]   = useState(null);
  const [resourcesAlert, setResourcesAlert] = useState(null);
  const [startupAlert,   setStartupAlert]   = useState(null);
  const [deleteAlert,    setDeleteAlert]     = useState(null);

  async function saveGeneral(e) {
    e.preventDefault();
    setGeneralLoading(true);
    setGeneralAlert(null);
    try {
      const { data } = await api.patch(`/servers/${server.uuid}`, general);
      onUpdate((prev) => ({ ...prev, ...data.server }));
      setGeneralAlert({ type: "success", message: "Settings saved successfully" });
    } catch (err) {
      setGeneralAlert({ type: "error", message: err.response?.data?.message || "Failed to save" });
    } finally {
      setGeneralLoading(false);
    }
  }

  async function saveResources(e) {
    e.preventDefault();
    setResourcesLoading(true);
    setResourcesAlert(null);
    try {
      const { data } = await api.patch(`/servers/${server.uuid}`, {
        memoryLimit: parseInt(resources.memoryLimit),
        diskLimit:   parseInt(resources.diskLimit),
        cpuLimit:    parseInt(resources.cpuLimit),
        swapLimit:   parseInt(resources.swapLimit),
      });
      onUpdate((prev) => ({ ...prev, ...data.server }));
      setResourcesAlert({ type: "success", message: "Resource limits updated" });
    } catch (err) {
      setResourcesAlert({ type: "error", message: err.response?.data?.message || "Failed to save" });
    } finally {
      setResourcesLoading(false);
    }
  }

  async function saveStartup(e) {
    e.preventDefault();
    setStartupLoading(true);
    setStartupAlert(null);
    try {
      const { data } = await api.patch(`/servers/${server.uuid}`, startup);
      onUpdate((prev) => ({ ...prev, ...data.server }));
      setStartupAlert({ type: "success", message: "Startup configuration saved" });
    } catch (err) {
      setStartupAlert({ type: "error", message: err.response?.data?.message || "Failed to save" });
    } finally {
      setStartupLoading(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    if (deleteConfirm !== server.name) {
      setDeleteAlert({ type: "error", message: "Server name does not match" });
      return;
    }
    setDeleteLoading(true);
    try {
      await api.delete(`/servers/${server.uuid}`);
      onDelete();
    } catch (err) {
      setDeleteAlert({ type: "error", message: err.response?.data?.message || "Failed to delete" });
      setDeleteLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "8px", padding: "9px 12px",
    fontSize: "13px", color: "var(--text-primary)",
    outline: "none", transition: "border 0.15s",
  };

  const labelStyle = {
    display: "block", fontSize: "12px",
    fontWeight: 500, color: "var(--text-secondary)",
    marginBottom: "6px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px" }}>

      {/* General */}
      <SettingsCard title="General" description="Basic server settings">
        <form onSubmit={saveGeneral} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Server name</label>
            <input
              type="text" value={general.name} required
              onChange={(e) => setGeneral((p) => ({ ...p, name: e.target.value }))}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
              onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div>
            <label style={labelStyle}>Description <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={general.description || ""}
              onChange={(e) => setGeneral((p) => ({ ...p, description: e.target.value }))}
              placeholder="A short description of this server..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
              onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>Auto Restart</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Restart on crash</p>
              </div>
              <button
                type="button"
                onClick={() => setGeneral((p) => ({ ...p, autoRestart: !p.autoRestart }))}
                style={{
                  width: "40px", height: "22px", borderRadius: "11px",
                  border: "none", cursor: "pointer", transition: "background 0.2s",
                  background: general.autoRestart ? "var(--indigo)" : "var(--bg-base)",
                  position: "relative", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: "3px",
                  left: general.autoRestart ? "21px" : "3px",
                  width: "16px", height: "16px",
                  borderRadius: "50%", background: "white",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>

            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>Auto Start</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Start on node boot</p>
              </div>
              <button
                type="button"
                onClick={() => setGeneral((p) => ({ ...p, autoStart: !p.autoStart }))}
                style={{
                  width: "40px", height: "22px", borderRadius: "11px",
                  border: "none", cursor: "pointer", transition: "background 0.2s",
                  background: general.autoStart ? "var(--indigo)" : "var(--bg-base)",
                  position: "relative", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: "3px",
                  left: general.autoStart ? "21px" : "3px",
                  width: "16px", height: "16px",
                  borderRadius: "50%", background: "white",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Backup limit <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(max backups to keep)</span></label>
            <input
              type="number" min={0} max={10}
              value={general.backupLimit}
              onChange={(e) => setGeneral((p) => ({ ...p, backupLimit: parseInt(e.target.value) }))}
              style={{ ...inputStyle, width: "120px" }}
              onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
              onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <SettingsAlert data={generalAlert} />
          <div><SettingsSaveBtn loading={generalLoading} /></div>
        </form>
      </SettingsCard>

      {/* Resource Limits */}
      {admin && (
        <SettingsCard title="Resource Limits" description="Adjust CPU, memory and disk allocation — admin only">
          <form onSubmit={saveResources} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Memory limit <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(MB)</span></label>
                <input type="number" min={128} value={resources.memoryLimit}
                  onChange={(e) => setResources((p) => ({ ...p, memoryLimit: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={labelStyle}>Swap limit <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(MB, 0 = disabled)</span></label>
                <input type="number" min={0} value={resources.swapLimit}
                  onChange={(e) => setResources((p) => ({ ...p, swapLimit: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={labelStyle}>CPU limit <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(%, 100 = 1 core)</span></label>
                <input type="number" min={10} max={800} value={resources.cpuLimit}
                  onChange={(e) => setResources((p) => ({ ...p, cpuLimit: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={labelStyle}>Disk limit <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(MB)</span></label>
                <input type="number" min={512} value={resources.diskLimit}
                  onChange={(e) => setResources((p) => ({ ...p, diskLimit: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
            <SettingsAlert data={resourcesAlert} />
            <div><SettingsSaveBtn loading={resourcesLoading} label="Update limits" /></div>
          </form>
        </SettingsCard>
      )}

      {/* Startup Configuration */}
      {admin && (
        <SettingsCard title="Startup Configuration" description="Docker image and start command — admin only">
          <form onSubmit={saveStartup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Docker image</label>
              <input type="text" value={startup.dockerImage}
                onChange={(e) => setStartup((p) => ({ ...p, dockerImage: e.target.value }))}
                placeholder="e.g. novapanel/minecraft:java21"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label style={labelStyle}>Start command</label>
              <input type="text" value={startup.startCommand}
                onChange={(e) => setStartup((p) => ({ ...p, startCommand: e.target.value }))}
                placeholder="e.g. java -Xmx{{MEMORY}}M -jar server.jar"
                style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
                onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                Use {"{{MEMORY}}"} to inject the memory limit value
              </p>
            </div>
            <SettingsAlert data={startupAlert} />
            <div><SettingsSaveBtn loading={startupLoading} label="Save startup config" /></div>
          </form>
        </SettingsCard>
      )}

      {/* Danger Zone */}
      {admin && (
        <div style={{
          background: "rgba(239,68,68,0.04)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "12px", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#ef4444", marginBottom: "2px" }}>Danger Zone</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Permanently delete this server — this cannot be undone</p>
          </div>
          <div style={{ padding: "24px" }}>
            <form onSubmit={handleDelete} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                To confirm deletion, type the server name: <strong style={{ color: "var(--text-primary)" }}>{server.name}</strong>
              </p>
              <input
                type="text" value={deleteConfirm}
                onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteAlert(null); }}
                placeholder={`Type "${server.name}" to confirm`}
                style={{ ...inputStyle, borderColor: "rgba(239,68,68,0.3)", maxWidth: "360px" }}
                onFocus={(e) => e.target.style.borderColor = "#ef4444"}
                onBlur={(e)  => e.target.style.borderColor = "rgba(239,68,68,0.3)"} />
              {deleteAlert && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "8px", padding: "10px 14px",
                  color: "#ef4444", fontSize: "13px",
                }}>
                  <AlertCircle size={14} />{deleteAlert.message}
                </div>
              )}
              <div>
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirm !== server.name}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: deleteConfirm === server.name ? "#ef4444" : "transparent",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: "8px", padding: "9px 18px",
                    color: deleteConfirm === server.name ? "white" : "#ef4444",
                    fontSize: "13px", fontWeight: 600,
                    cursor: deleteConfirm === server.name ? "pointer" : "not-allowed",
                    opacity: deleteLoading ? 0.7 : 1, transition: "all 0.15s",
                  }}
                >
                  {deleteLoading
                    ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Deleting...</>
                    : "Delete server permanently"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ServerDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();

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
      const status = action === "start" ? "starting"
        : action === "stop" ? "stopping" : "starting";
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
      <div style={{ textAlign: "center", padding: "80px" }}>
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
              color: "var(--text-muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ActionBtn icon={Play}      label="Start"   hoverColor="green"  disabled={!canStart   || actioning} loading={actioning} onClick={() => handleAction("start")}   />
          <ActionBtn icon={Square}    label="Stop"    hoverColor="red"    disabled={!canStop    || actioning} onClick={() => handleAction("stop")}    />
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
        <Tab id="overview" active={tab==="overview"} icon={Activity} label="Overview" onClick={setTab} />
        <Tab id="console"  active={tab==="console"}  icon={Terminal} label="Console"  onClick={setTab} />
        <Tab id="settings" active={tab==="settings"} icon={Settings} label="Settings" onClick={setTab} />
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            <StatCard icon={Cpu}         label="CPU Usage" value={`${server.statsSnapshot?.cpu ?? 0}%`}     sub={`Limit: ${server.cpuLimit}%`}     percent={server.statsSnapshot?.cpu ?? 0}                                                                     color="#6366f1" />
            <StatCard icon={MemoryStick} label="Memory"    value={`${server.statsSnapshot?.memory ?? 0}MB`} sub={`Limit: ${server.memoryLimit}MB`} percent={server.statsSnapshot ? Math.round((server.statsSnapshot.memory / server.memoryLimit) * 100) : 0}    color="#22c55e" />
            <StatCard icon={HardDrive}   label="Disk"      value={`${server.statsSnapshot?.disk ?? 0}MB`}   sub={`Limit: ${server.diskLimit}MB`}   percent={server.statsSnapshot ? Math.round((server.statsSnapshot.disk / server.diskLimit) * 100) : 0}       color="#eab308" />
            <StatCard icon={Activity}    label="Players"   value={server.statsSnapshot?.players ?? 0}        sub="connected"                                                                                                                                        color="#3b82f6" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Server Details</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Configuration and connection info</p>
              <InfoRow label="Server ID"    value={server.uuid}                         copy />
              <InfoRow label="Short ID"     value={`#${server.shortId}`}                    />
              <InfoRow label="Game Type"    value={server.gameType?.replace(/_/g, " ")}     />
              <InfoRow label="Docker Image" value={server.dockerImage}                      />
              <InfoRow label="IP Address"   value={server.allocation?.ip}               copy />
              <InfoRow label="Port"         value={String(server.allocation?.port)}         />
            </div>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Node & Timing</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Hosting and lifecycle info</p>
              <InfoRow label="Node"         value={server.node?.name}                       />
              <InfoRow label="Location"     value={server.node?.location}                   />
              <InfoRow label="Auto Restart" value={server.autoRestart ? "Yes" : "No"}       />
              <InfoRow label="SFTP"         value={server.sftpEnabled ? "Enabled" : "Disabled"} />
              <InfoRow label="Created"      value={new Date(server.createdAt).toLocaleDateString()} />
              <InfoRow label="Last Started" value={server.lastStartedAt ? new Date(server.lastStartedAt).toLocaleString() : "Never"} />
            </div>
          </div>

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

      {tab === "console"  && <Console serverId={server.uuid} />}
      {tab === "settings" && <ServerSettings server={server} onUpdate={setServer} onDelete={() => navigate("/servers")} />}

    </Layout>
  );
}