import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div style={{ padding: "2rem" }}>
          <h1 style={{ color: "#6366f1", fontSize: "2rem" }}>
            ⚡ NovaPanel
          </h1>
          <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
            Frontend is running — time to build the UI!
          </p>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;