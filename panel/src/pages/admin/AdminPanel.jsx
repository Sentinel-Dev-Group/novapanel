import { useEffect, useState } from "react";
import {
  Users, Server, Globe, Shield,
  Search, Loader2, CheckCircle,
  XCircle, Plus, Activity,
  HardDrive, Cpu, ChevronRight,
} from "lucide-react";
import Layout   from "../../components/layout/Layout";
import api      from "../../lib/api";

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent = "indigo" }) {
  const accents = {
    indigo: { bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)",  color: "#6366f1"  },
    green:  { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)",   color: "#22c55e"  },
    yellow: { bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)",   color: "#eab308"  },
    red:    { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   color: "#ef4444"  },
  };
  const a = accents[accent];
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: "12px", padding: "20px",
      display: "flex", alignItems: "center", gap: "14px",
    }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px",
        background: a.bg, border: `1px solid ${a.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: `0 0 16px ${a.bg}`,
      }}>
        <Icon size={18} color={a.color} />
      </div>
      <div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</p>
        <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    root:  { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"   },
    admin: { bg: "rgba(99,102,241,0.1)",  color: "#6366f1", border: "rgba(99,102,241,0.25)"  },
    user:  { bg: "rgba(100,116,139,0.1)", color: "#64748b", border: "rgba(100,116,139,0.25)" },
  };
  const s = map[role] || map.user;
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600,
      padding: "2px 8px", borderRadius: "20px",
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: "capitalize",
    }}>{role}</span>
  );
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    running:    { bg: "rgba(34,197,94,0.1)",   color: "#22c55e", border: "rgba(34,197,94,0.25)"   },
    stopped:    { bg: "rgba(100,116,139,0.1)",  color: "#64748b", border: "rgba(100,116,139,0.25)" },
    starting:   { bg: "rgba(234,179,8,0.1)",   color: "#eab308", border: "rgba(234,179,8,0.25)"   },
    installing: { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.25)"  },
    error:      { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"   },
  };
  const s = map[status] || map.stopped;
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600,
      padding: "2px 8px", borderRadius: "20px",
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: "capitalize",
    }}>{status}</span>
  );
}

// ── Node status ───────────────────────────────────────────────
function NodeStatus({ status }) {
  const map = {
    online:   { color: "#22c55e", dot: "#22c55e" },
    offline:  { color: "#64748b", dot: "#64748b" },
    draining: { color: "#eab308", dot: "#eab308" },
  };
  const s = map[status] || map.offline;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: s.color }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ── Tab ───────────────────────────────────────────────────────
function Tab({ id, active, icon: Icon, label, count, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "8px 16px", borderRadius: "8px", border: "none",
        background: active ? "var(--indigo)" : "transparent",
        color: active ? "white" : "var(--text-muted)",
        fontSize: "13px", fontWeight: 500, cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: active ? "0 0 16px rgba(99,102,241,0.3)" : "none",
      }}
    >
      <Icon size={14} />
      {label}
      {count !== undefined && (
        <span style={{
          fontSize: "10px", fontWeight: 700,
          background: active ? "rgba(255,255,255,0.2)" : "var(--bg-elevated)",
          color: active ? "white" : "var(--text-muted)",
          padding: "1px 6px", borderRadius: "10px",
        }}>{count}</span>
      )}
    </button>
  );
}

// ── Search input ──────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
      <Search size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "9px 12px 9px 32px",
          fontSize: "13px", color: "var(--text-primary)", outline: "none",
          transition: "border 0.15s",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--indigo)"}
        onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

// ── Table header ──────────────────────────────────────────────
function THead({ cols }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: cols,
      padding: "10px 20px",
      borderBottom: "1px solid var(--border)",
      fontSize: "11px", fontWeight: 600,
      color: "var(--text-muted)", textTransform: "uppercase",
      letterSpacing: "0.05em",
    }}>
      {/* rendered by parent */}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab,     setTab]     = useState("overview");
  const [users,   setUsers]   = useState([]);
  const [servers, setServers] = useState([]);
  const [nodes,   setNodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => { loadAll(); }, []);

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

  const runningServers = servers.filter((s) => s.status === "running").length;
  const onlineNodes    = nodes.filter((n) => n.status === "online").length;
  const suspendedUsers = users.filter((u) => u.isSuspended).length;

  const filteredUsers   = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredServers = servers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.gameType?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredNodes   = nodes.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Admin">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "9px",
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Shield size={16} color="var(--indigo)" />
        </div>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>Admin Panel</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Manage users, servers and nodes</p>
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
        <Tab id="overview" active={tab==="overview"} icon={Activity} label="Overview"  onClick={(id) => { setTab(id); setSearch(""); }} />
        <Tab id="users"    active={tab==="users"}    icon={Users}    label="Users"     count={users.length}   onClick={(id) => { setTab(id); setSearch(""); }} />
        <Tab id="servers"  active={tab==="servers"}  icon={Server}   label="Servers"   count={servers.length} onClick={(id) => { setTab(id); setSearch(""); }} />
        <Tab id="nodes"    active={tab==="nodes"}    icon={Globe}    label="Nodes"     count={nodes.length}   onClick={(id) => { setTab(id); setSearch(""); }} />
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", color: "var(--text-muted)", gap: "8px" }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "13px" }}>Loading...</span>
        </div>
      ) : (
        <>
          {/* ── Overview ─────────────────────────────────── */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
                <StatCard icon={Users}  label="Total Users"     value={users.length}   accent="indigo" />
                <StatCard icon={Server} label="Total Servers"   value={servers.length} accent="green"  />
                <StatCard icon={Globe}  label="Online Nodes"    value={`${onlineNodes}/${nodes.length}`} accent="yellow" />
                <StatCard icon={Shield} label="Suspended Users" value={suspendedUsers} accent={suspendedUsers > 0 ? "red" : "indigo"} />
              </div>

              {/* Recent users */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Users</span>
                  <button onClick={() => setTab("users")} style={{ background: "none", border: "none", color: "var(--indigo-light)", fontSize: "12px", cursor: "pointer" }}>
                    View all →
                  </button>
                </div>
                {users.slice(0, 5).map((user, i) => (
                  <div key={user.uuid} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 20px",
                    borderBottom: i < Math.min(users.length, 5) - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, color: "white", flexShrink: 0,
                      }}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "1px" }}>{user.username}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user.email}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <RoleBadge role={user.role} />
                      {user.isSuspended
                        ? <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#ef4444" }}><XCircle size={12} /> Suspended</span>
                        : <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#22c55e" }}><CheckCircle size={12} /> Active</span>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent servers */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Servers</span>
                  <button onClick={() => setTab("servers")} style={{ background: "none", border: "none", color: "var(--indigo-light)", fontSize: "12px", cursor: "pointer" }}>
                    View all →
                  </button>
                </div>
                {servers.slice(0, 5).map((server, i) => (
                  <div key={server.uuid} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 20px",
                    borderBottom: i < Math.min(servers.length, 5) - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "1px" }}>{server.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{server.gameType?.replace(/_/g," ")} · {server.node?.name}</p>
                    </div>
                    <StatusBadge status={server.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Users ────────────────────────────────────── */}
          {tab === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                {/* Header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "10px 20px", borderBottom: "1px solid var(--border)",
                  fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  <span>User</span><span>Role</span><span>Status</span><span>Joined</span><span>Last Login</span>
                </div>
                {filteredUsers.map((user, i) => (
                  <div key={user.uuid} style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    padding: "12px 20px", alignItems: "center",
                    borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0,
                      }}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                      </div>
                    </div>
                    <div><RoleBadge role={user.role} /></div>
                    <div>
                      {user.isSuspended
                        ? <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#ef4444" }}><XCircle size={11} />Suspended</span>
                        : <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#22c55e" }}><CheckCircle size={11} />Active</span>
                      }
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(user.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Servers ──────────────────────────────────── */}
          {tab === "servers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SearchInput value={search} onChange={setSearch} placeholder="Search servers..." />
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "10px 20px", borderBottom: "1px solid var(--border)",
                  fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  <span>Server</span><span>Owner</span><span>Node</span><span>Resources</span><span>Status</span>
                </div>
                {filteredServers.map((server, i) => (
                  <div key={server.uuid} style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    padding: "12px 20px", alignItems: "center",
                    borderBottom: i < filteredServers.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "1px" }}>{server.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{server.gameType?.replace(/_/g," ")} · #{server.shortId}</p>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{server.owner?.username || "—"}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{server.node?.name || "—"}</span>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "2px" }}><Cpu size={10} />{server.cpuLimit}%</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}><HardDrive size={10} />{server.memoryLimit}MB</div>
                    </div>
                    <StatusBadge status={server.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Nodes ────────────────────────────────────── */}
          {tab === "nodes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <SearchInput value={search} onChange={setSearch} placeholder="Search nodes..." />
                <button style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "var(--indigo)", border: "none", borderRadius: "8px",
                  padding: "9px 16px", color: "white", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", boxShadow: "0 0 16px rgba(99,102,241,0.25)",
                }}>
                  <Plus size={14} /> Add Node
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
                {filteredNodes.map((node) => (
                  <div key={node.uuid} style={{
                    background: "var(--bg-surface)", border: "1px solid var(--border)",
                    borderRadius: "12px", padding: "20px",
                    transition: "border 0.15s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "9px",
                          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Globe size={16} color="var(--indigo)" />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{node.name}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{node.location} · {node.fqdn}</p>
                        </div>
                      </div>
                      <NodeStatus status={node.status} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                      {[
                        { icon: Cpu,       label: "CPU",    value: `${node.cpuTotal} cores` },
                        { icon: Activity,  label: "Memory", value: `${node.memoryTotal}MB`  },
                        { icon: HardDrive, label: "Disk",   value: `${node.diskTotal}MB`    },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} style={{
                          background: "var(--bg-elevated)", borderRadius: "8px",
                          padding: "10px", textAlign: "center",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
                            <Icon size={11} color="var(--text-muted)" />
                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{label}</span>
                          </div>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </Layout>
  );
}