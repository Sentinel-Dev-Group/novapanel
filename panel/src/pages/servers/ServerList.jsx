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
      fontSize:      "11px",
      fontWeight:    600,
      padding:       "3px 10px",
      borderRadius:  "20px",
      background:    s.bg,
      color:         s.color,
      border:        `1px solid ${s.border}`,
      textTransform: "capitalize",
      letterSpacing: "0.02em",
      whiteSpace:    "nowrap",
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
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:          "30px",
        height:         "30px",
        borderRadius:   "7px",
        border:         `1px solid ${hovered && !disabled ? c.border : "var(--border)"}`,
        background:     hovered && !disabled ? c.bg : "transparent",
        color:          hovered && !disabled ? c.color : "var(--text-muted)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        cursor:         disabled ? "not-allowed" : "pointer",
        opacity:        disabled ? 0.3 : 1,
        transition:     "all 0.15s",
        flexShrink:     0,
      }}
    >
      <Icon size={13} />
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ServerList() {
  const navigate            = useNavigate();
  const { isAdmin }         = useAuthStore();
  const admin               = isAdmin();

  const [servers,  setServers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [actionId, setActionId] = useState(null);

  useEffect(() => { loadServers(); }, []);

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
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
            Servers
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {servers.length} server{servers.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {admin && (
          <button style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "6px",
            background:   "var(--indigo)",
            border:       "none",
            borderRadius: "8px",
            padding:      "8px 16px",
            color:        "white",
            fontSize:     "13px",
            fontWeight:   600,
            cursor:       "pointer",
            boxShadow:    "0 0 20px rgba(99,102,241,0.3)",
            transition:   "all 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--indigo-light)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--indigo)"}
          >
            <Plus size={14} />
            New Server
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={13} style={{
          position: "absolute", left: "12px",
          top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)",
        }} />
        <input
          type="text"
          placeholder="Search by name, game type or node..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width:        "100%",
            background:   "var(--bg-surface)",
            border:       "1px solid var(--border)",
            borderRadius: "8px",
            padding:      "10px 12px 10px 34px",
            fontSize:     "13px",
            color:        "var(--text-primary)",
            outline:      "none",
            transition:   "border 0.15s",
          }}
          onFocus={(e)  => e.target.style.borderColor = "var(--indigo)"}
          onBlur={(e)   => e.target.style.borderColor = "var(--border)"}
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
        <div style={{
          background:   "var(--bg-surface)",
          border:       "1px solid var(--border)",
          borderRadius: "12px",
          overflow:     "hidden",
        }}>
          {filtered.map((server, i) => (
            <div
              key={server.uuid}
              onClick={() => navigate(`/servers/${server.uuid}`)}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "14px",
                padding:      "14px 20px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                cursor:       "pointer",
                transition:   "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {/* Icon */}
              <div style={{
                width:          "38px",
                height:         "38px",
                borderRadius:   "9px",
                background:     "rgba(99,102,241,0.08)",
                border:         "1px solid rgba(99,102,241,0.2)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
              }}>
                <Server size={16} color="var(--indigo)" />
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {server.name}
                  </p>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: "4px" }}>
                    #{server.shortId}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Globe size={10} /> {server.node?.name}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Cpu size={10} /> {server.cpuLimit}%
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <MemoryStick size={10} /> {server.memoryLimit}MB
                  </span>
                  <span>{server.allocation?.ip}:{server.allocation?.port}</span>
                </div>
              </div>

              {/* Right side */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}>
                <StatusBadge status={server.status} />

                {actionId === server.uuid ? (
                  <Loader2 size={14} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <>
                    <ActionBtn
                      icon={Play} label="Start" hoverColor="green"
                      disabled={["running","starting","installing","suspended"].includes(server.status)}
                      onClick={(e) => handleAction(e, server, "start")}
                    />
                    <ActionBtn
                      icon={Square} label="Stop" hoverColor="red"
                      disabled={["stopped","stopping","installing","suspended"].includes(server.status)}
                      onClick={(e) => handleAction(e, server, "stop")}
                    />
                    <ActionBtn
                      icon={RotateCcw} label="Restart" hoverColor="yellow"
                      disabled={["stopped","stopping","installing","suspended"].includes(server.status)}
                      onClick={(e) => handleAction(e, server, "restart")}
                    />
                  </>
                )}

                <ChevronRight size={13} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}