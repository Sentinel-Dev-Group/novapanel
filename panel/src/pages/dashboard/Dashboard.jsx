import { useEffect, useState }  from "react";
import { useNavigate }          from "react-router-dom";
import {
  Server, Activity, Globe, AlertTriangle,
  Play, Square, ChevronRight,
} from "lucide-react";
import Layout           from "../../components/layout/Layout";
import api              from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  const accents = {
    indigo: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", icon: "#6366f1", glow: "rgba(99,102,241,0.15)" },
    green:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  icon: "#22c55e", glow: "rgba(34,197,94,0.15)"  },
    yellow: { bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)",  icon: "#eab308", glow: "rgba(234,179,8,0.15)"  },
    red:    { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  icon: "#ef4444", glow: "rgba(239,68,68,0.15)"  },
  };
  const a = accents[accent] || accents.indigo;

  return (
    <div style={{
      background:   "var(--bg-surface)",
      border:       "1px solid var(--border)",
      borderRadius: "12px",
      padding:      "20px",
      display:      "flex",
      alignItems:   "flex-start",
      gap:          "14px",
      transition:   "border 0.2s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = a.border}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{
        width:          "40px",
        height:         "40px",
        borderRadius:   "10px",
        background:     a.bg,
        border:         `1px solid ${a.border}`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        boxShadow:      `0 0 16px ${a.glow}`,
      }}>
        <Icon size={18} color={a.icon} />
      </div>
      <div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</p>
        <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</p>}
      </div>
    </div>
  );
}

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
      fontSize:     "11px",
      fontWeight:   600,
      padding:      "3px 10px",
      borderRadius: "20px",
      background:   s.bg,
      color:        s.color,
      border:       `1px solid ${s.border}`,
      textTransform: "capitalize",
      letterSpacing: "0.02em",
    }}>
      {status}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate              = useNavigate();
  const { user }              = useAuthStore();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/servers")
      .then(({ data }) => setServers(data.servers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const running = servers.filter((s) => s.status === "running").length;
  const stopped = servers.filter((s) => s.status === "stopped").length;
  const issues  = servers.filter((s) => ["error","suspended"].includes(s.status)).length;

  return (
    <Layout title="Dashboard">

      {/* Welcome */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
          Welcome back, {user?.username} 👋
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Here's what's happening with your servers today.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap:                 "16px",
        marginBottom:        "24px",
      }}>
        <StatCard icon={Server}        label="Total Servers" value={servers.length} sub="across all nodes"     accent="indigo" />
        <StatCard icon={Activity}      label="Running"       value={running}        sub={`${stopped} stopped`} accent="green"  />
        <StatCard icon={Globe}         label="Nodes"         value="1"              sub="online"               accent="yellow" />
        <StatCard icon={AlertTriangle} label="Issues"        value={issues}         sub="need attention"       accent={issues > 0 ? "red" : "indigo"} />
      </div>

      {/* Server list */}
      <div style={{
        background:   "var(--bg-surface)",
        border:       "1px solid var(--border)",
        borderRadius: "12px",
        overflow:     "hidden",
      }}>
        {/* Header */}
        <div style={{
          display:       "flex",
          alignItems:    "center",
          justifyContent:"space-between",
          padding:       "16px 20px",
          borderBottom:  "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Server size={14} color="var(--indigo)" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              Your Servers
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {servers.length} total
          </span>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            Loading...
          </div>
        ) : servers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            No servers yet
          </div>
        ) : servers.map((server, i) => (
          <div
            key={server.uuid}
            onClick={() => navigate(`/servers/${server.uuid}`)}
            style={{
              display:       "flex",
              alignItems:    "center",
              gap:           "14px",
              padding:       "14px 20px",
              borderBottom:  i < servers.length - 1 ? "1px solid var(--border)" : "none",
              cursor:        "pointer",
              transition:    "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {/* Icon */}
            <div style={{
              width:          "36px",
              height:         "36px",
              borderRadius:   "8px",
              background:     "rgba(99,102,241,0.08)",
              border:         "1px solid rgba(99,102,241,0.2)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}>
              <Server size={15} color="var(--indigo)" />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                {server.name}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {server.gameType?.replace(/_/g, " ")} · {server.allocation?.ip}:{server.allocation?.port}
              </p>
            </div>

            {/* Right */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {server.node?.name} · {server.memoryLimit}MB
              </span>
              <StatusBadge status={server.status} />
              <ChevronRight size={13} color="var(--text-muted)" />
            </div>
          </div>
        ))}
      </div>

    </Layout>
  );
}