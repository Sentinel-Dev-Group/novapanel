import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";

export default function Layout({ title, children }) {
  return (
    <div className="min-h-screen bg-[#0f1117]">

      {/* Sidebar — fixed on the left */}
      <Sidebar />

      {/* Everything else — pushed right by exact sidebar width */}
      <div style={{ marginLeft: "224px" }} className="flex flex-col min-h-screen">
        <Topbar title={title} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

    </div>
  );
}