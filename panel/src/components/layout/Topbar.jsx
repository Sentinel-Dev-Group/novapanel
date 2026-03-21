import { Bell, Search } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function Topbar({ title }) {
  const { user } = useAuthStore();

  return (
    <header style={{
      height:       "56px",
      background:   "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
      display:      "flex",
      alignItems:   "center",
      justifyContent: "space-between",
      padding:      "0 24px",
      flexShrink:   0,
    }}>
      <h1 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
        {title}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={13} style={{
            position: "absolute", left: "10px",
            top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }} />
          <input
            type="text"
            placeholder="Search..."
            style={{
              background:   "var(--bg-elevated)",
              border:       "1px solid var(--border)",
              borderRadius: "8px",
              padding:      "7px 12px 7px 30px",
              fontSize:     "13px",
              color:        "var(--text-primary)",
              width:        "180px",
              outline:      "none",
              transition:   "border 0.15s",
            }}
            onFocus={(e)  => e.target.style.borderColor = "var(--indigo)"}
            onBlur={(e)   => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Bell */}
        <button style={{
          width:          "34px",
          height:         "34px",
          borderRadius:   "8px",
          background:     "var(--bg-elevated)",
          border:         "1px solid var(--border)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          color:          "var(--text-secondary)",
          cursor:         "pointer",
          position:       "relative",
        }}>
          <Bell size={14} />
          <span style={{
            position:    "absolute",
            top:         "6px",
            right:       "6px",
            width:       "6px",
            height:      "6px",
            background:  "var(--indigo)",
            borderRadius:"50%",
          }} />
        </button>

        {/* Avatar */}
        <div style={{
          width:          "34px",
          height:         "34px",
          borderRadius:   "8px",
          background:     "linear-gradient(135deg, #6366f1, #4f46e5)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       "12px",
          fontWeight:     700,
          color:          "white",
          boxShadow:      "0 0 12px rgba(99,102,241,0.3)",
        }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}