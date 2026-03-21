import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";

export default function Layout({ title, children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />
      <div style={{ marginLeft: "220px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar title={title} />
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}