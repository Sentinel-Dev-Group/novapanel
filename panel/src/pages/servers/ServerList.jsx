import { useEffect, useState }  from "react";
import { useNavigate }          from "react-router-dom";
import {
  Server, Play, Square, RotateCcw,
  Plus, Search, Loader2, Cpu,
  MemoryStick, Globe, ChevronRight,
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
      textTransform: "capitalize", letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, hoverColor, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  const colors = {
    green:  { bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)",  color: "#22c55e" },
    red:    { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  color: "#ef4444" },
    yellow: { bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)",  color: "#eab308" },
  };
  const c = colors[hoverColor];
  return (
    <button
      title={label} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "30px", height: "30px", borderRadius: "7px",
        border: `1px solid ${hovered && !disabled ? c.border : "var(--border)"}`,
        background: hovered && !disabled ? c.bg : "transparent",
        color: hovered && !disabled ? c.color : "var(--text-muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1, transition: "all 0.15s", flexShrink: 0,
      }}
    >
      <Icon size={13} />
    </button>
  );
}

// ── Create Server Modal ───────────────────────────────────────
function CreateServerModal({ nodes, users, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "", description: "", userId: "", nodeId: "",
    gameType: "", dockerImage: "", memoryLimit: 1024,
    diskLimit: 5120, cpuLimit: 100, swapLimit: 0,
    startCommand: "", environment: "",
    autoRestart: true, autoStart: false, backupLimit: 3,
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [step,    setStep]    = useState(1);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setError(null);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const environment = {};
      if (form.environment.trim()) {
        form.environment.split("\n").forEach((line) => {
          const [key, ...rest] = line.split("=");
          if (key?.trim()) environment[key.trim()] = rest.join("=").trim();
        });
      }
      const { data } = await api.post("/servers", {
        name:         form.name,
        description:  form.description || undefined,
        userId:       parseInt(form.userId),
        nodeId:       parseInt(form.nodeId),
        gameType:     form.gameType,
        dockerImage:  form.dockerImage,
        memoryLimit:  parseInt(form.memoryLimit),
        diskLimit:    parseInt(form.diskLimit),
        cpuLimit:     parseInt(form.cpuLimit),
        swapLimit:    parseInt(form.swapLimit),
        startCommand: form.startCommand,
        environment,
        autoRestart:  form.autoRestart,
        autoStart:    form.autoStart,
        backupLimit:  parseInt(form.backupLimit),
      });
      onCreate(data.server);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create server");
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "9px 12px",
    fontSize: "13px", color: "var(--text-primary)",
    outline: "none", transition: "border 0.15s",
  };

  const labelStyle = {
    display: "block", fontSize: "12px",
    fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px",
  };

  const GAME_TYPES = [
    { value: "minecraft_java",    label: "Minecraft Java"    },
    { value: "minecraft_bedrock", label: "Minecraft Bedrock" },
    { value: "csgo",              label: "CS:GO / CS2"       },
    { value: "valheim",           label: "Valheim"           },
    { value: "rust",              label: "Rust"              },
    { value: "terraria",          label: "Terraria"          },
    { value: "ark",               label: "ARK"               },
    { value: "satisfactory",      label: "Satisfactory"      },
    { value: "custom",            label: "Custom"            },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 100,
      }} />

      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "560px", maxHeight: "85vh",
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "16px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
        zIndex: 101, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
              Create Server
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Step {step} of 3 — {step === 1 ? "Basic details" : step === 2 ? "Resource limits" : "Startup config"}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: "30px", height: "30px", borderRadius: "8px",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >✕</button>
        </div>

        {/* Step bar */}
        <div style={{ display: "flex", gap: "4px", padding: "14px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {[1,2,3].map((s) => (
            <div key={s} onClick={() => s < step && setStep(s)} style={{
              flex: 1, height: "4px", borderRadius: "4px",
              background: s <= step ? "var(--indigo)" : "var(--bg-elevated)",
              cursor: s < step ? "pointer" : "default", transition: "background 0.2s",
              boxShadow: s === step ? "0 0 8px rgba(99,102,241,0.5)" : "none",
            }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px", padding: "10px 14px",
              color: "#ef4444", fontSize: "13px", marginBottom: "16px",
            }}>⚠ {error}</div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Server name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="My Minecraft Server" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={labelStyle}>Description <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="A short description..." rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Owner *</label>
                  <select name="userId" value={form.userId} onChange={handleChange}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                    onBlur={(e)  => e.target.style.borderColor = "var(--border)"}>
                    <option value="">Select a user...</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Node *</label>
                  <select name="nodeId" value={form.nodeId} onChange={handleChange}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                    onBlur={(e)  => e.target.style.borderColor = "var(--border)"}>
                    <option value="">Select a node...</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} — {n.location}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Game type *</label>
                <select name="gameType" value={form.gameType} onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"}>
                  <option value="">Select a game type...</option>
                  {GAME_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { name: "memoryLimit", label: "Memory limit", hint: "(MB) *",          min: 128  },
                  { name: "diskLimit",   label: "Disk limit",   hint: "(MB) *",          min: 512  },
                  { name: "cpuLimit",    label: "CPU limit",    hint: "(%, 100 = 1 core)", min: 10, max: 800 },
                  { name: "swapLimit",   label: "Swap limit",   hint: "(MB, 0 = off)",   min: 0   },
                ].map(({ name, label, hint, min, max }) => (
                  <div key={name}>
                    <label style={labelStyle}>{label} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{hint}</span></label>
                    <input type="number" name={name} value={form[name]} onChange={handleChange}
                      min={min} max={max} style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                      onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
                  </div>
                ))}
              </div>
              <div>
                <label style={labelStyle}>Backup limit <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(max to keep)</span></label>
                <input type="number" name="backupLimit" value={form.backupLimit} onChange={handleChange}
                  min={0} max={10} style={{ ...inputStyle, width: "120px" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { key: "autoRestart", label: "Auto Restart", sub: "Restart on crash"   },
                  { key: "autoStart",   label: "Auto Start",   sub: "Start on node boot" },
                ].map(({ key, label, sub }) => (
                  <div key={key} style={{
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: "8px", padding: "12px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>{label}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{sub}</p>
                    </div>
                    <button type="button" onClick={() => setForm((p) => ({ ...p, [key]: !p[key] }))} style={{
                      width: "40px", height: "22px", borderRadius: "11px",
                      border: "none", cursor: "pointer", transition: "background 0.2s",
                      background: form[key] ? "var(--indigo)" : "var(--bg-base)",
                      position: "relative", flexShrink: 0,
                    }}>
                      <div style={{
                        position: "absolute", top: "3px",
                        left: form[key] ? "21px" : "3px",
                        width: "16px", height: "16px",
                        borderRadius: "50%", background: "white", transition: "left 0.2s",
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Docker image *</label>
                <input name="dockerImage" value={form.dockerImage} onChange={handleChange}
                  placeholder="e.g. novapanel/minecraft:java21" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={labelStyle}>Start command *</label>
                <input name="startCommand" value={form.startCommand} onChange={handleChange}
                  placeholder="e.g. java -Xmx{{MEMORY}}M -jar server.jar"
                  style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  Use {"{{MEMORY}}"} to inject the memory limit
                </p>
              </div>
              <div>
                <label style={labelStyle}>
                  Environment variables <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional — one per line)</span>
                </label>
                <textarea name="environment" value={form.environment} onChange={handleChange}
                  placeholder={"MAX_PLAYERS=20\nDIFFICULTY=normal\nSERVER_NAME=My Server"}
                  rows={5} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px", resize: "vertical" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderTop: "1px solid var(--border)", flexShrink: 0,
        }}>
          <button type="button"
            onClick={() => step > 1 ? setStep((s) => s - 1) : onClose()}
            style={{
              background: "transparent", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "8px 16px",
              color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.color = "var(--indigo-light)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            {step > 1 ? "← Back" : "Cancel"}
          </button>

          {step < 3 ? (
            <button type="button" onClick={() => {
              if (step === 1 && (!form.name || !form.userId || !form.nodeId || !form.gameType)) {
                setError("Please fill in all required fields");
                return;
              }
              setError(null);
              setStep((s) => s + 1);
            }} style={{
              background: "var(--indigo)", border: "none", borderRadius: "8px",
              padding: "8px 20px", color: "white", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", boxShadow: "0 0 16px rgba(99,102,241,0.25)",
            }}>
              Next →
            </button>
          ) : (
            <button type="button"
              disabled={loading || !form.dockerImage || !form.startCommand}
              onClick={handleSubmit}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "var(--indigo)", border: "none", borderRadius: "8px",
                padding: "8px 20px", color: "white", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !form.dockerImage || !form.startCommand ? 0.6 : 1,
                boxShadow: "0 0 16px rgba(99,102,241,0.25)",
              }}
            >
              {loading
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Creating...</>
                : "Create Server"
              }
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ServerList() {
  const navigate    = useNavigate();
  const { isAdmin } = useAuthStore();
  const admin       = isAdmin();

  const [servers,     setServers]     = useState([]);
  const [nodes,       setNodes]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [actionId,    setActionId]    = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const promises = [api.get("/servers"), api.get("/nodes")];
      if (admin) promises.push(api.get("/admin/users"));
      const [s, n, u] = await Promise.all(promises);
      setServers(s.data.servers || []);
      setNodes(n.data.nodes     || []);
      if (u) setUsers(u.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(e, server, action) {
    e.stopPropagation();
    setActionId(server.uuid);
    try {
      await api.post(`/servers/${server.uuid}/${action}`);
      const newStatus = action === "start" ? "starting"
        : action === "stop" ? "stopping" : "starting";
      setServers((prev) =>
        prev.map((s) => s.uuid === server.uuid ? { ...s, status: newStatus } : s)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  }

  const filtered = servers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.gameType?.toLowerCase().includes(search.toLowerCase()) ||
    s.node?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Servers">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>Servers</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {servers.length} server{servers.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {admin && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "var(--indigo)", border: "none", borderRadius: "8px",
              padding: "8px 16px", color: "white", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", boxShadow: "0 0 20px rgba(99,102,241,0.3)", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--indigo-light)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--indigo)"}
          >
            <Plus size={14} /> New Server
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="text" placeholder="Search by name, game type or node..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", background: "var(--bg-surface)",
            border: "1px solid var(--border)", borderRadius: "8px",
            padding: "10px 12px 10px 34px", fontSize: "13px",
            color: "var(--text-primary)", outline: "none", transition: "border 0.15s",
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
          onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--text-muted)", gap: "8px" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "13px" }}>Loading servers...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          <Server size={32} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
          <p style={{ fontSize: "13px" }}>{search ? "No servers match your search" : "No servers yet"}</p>
        </div>
      ) : (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {filtered.map((server, i) => (
            <div
              key={server.uuid}
              onClick={() => navigate(`/servers/${server.uuid}`)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 20px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: "38px", height: "38px", borderRadius: "9px",
                background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Server size={16} color="var(--indigo)" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{server.name}</p>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: "4px" }}>
                    #{server.shortId}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Globe size={10} /> {server.node?.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Cpu size={10} /> {server.cpuLimit}%</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MemoryStick size={10} /> {server.memoryLimit}MB</span>
                  <span>{server.allocation?.ip}:{server.allocation?.port}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}>
                <StatusBadge status={server.status} />
                {actionId === server.uuid ? (
                  <Loader2 size={14} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <>
                    <ActionBtn icon={Play}      label="Start"   hoverColor="green"
                      disabled={["running","starting","installing","suspended"].includes(server.status)}
                      onClick={(e) => handleAction(e, server, "start")} />
                    <ActionBtn icon={Square}    label="Stop"    hoverColor="red"
                      disabled={["stopped","stopping","installing","suspended"].includes(server.status)}
                      onClick={(e) => handleAction(e, server, "stop")} />
                    <ActionBtn icon={RotateCcw} label="Restart" hoverColor="yellow"
                      disabled={["stopped","stopping","installing","suspended"].includes(server.status)}
                      onClick={(e) => handleAction(e, server, "restart")} />
                  </>
                )}
                <ChevronRight size={13} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateServerModal
          nodes={nodes}
          users={users}
          onClose={() => setShowCreate(false)}
          onCreate={(server) => {
            setServers((prev) => [server, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </Layout>
  );
}