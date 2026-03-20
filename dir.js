// ============================================================
//  NovaPanel — Project Scaffold Script (Node.js)
//  Works on Windows, Mac, Linux — no bash needed
//
//  Usage:
//    1. Put this file wherever you want the project created
//    2. Open terminal in VSC (Ctrl + `)
//    3. Run:  node scaffold.js
// ============================================================

const fs   = require("fs");
const path = require("path");

const ROOT = "novapanel";

// ── Colours for terminal output ───────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
};

// ── Helper — make a dir (recursive, no error if exists) ───────
function mkdir(p) {
  fs.mkdirSync(path.join(ROOT, p), { recursive: true });
}

// ── Helper — create an empty file (or file with content) ──────
function touch(p, content = "") {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (!fs.existsSync(full)) {
    fs.writeFileSync(full, content, "utf8");
  }
}

// ── Print the logo ────────────────────────────────────────────
console.log(c.cyan(`
  ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ 
  ████╗  ██║██╔═══██╗██║   ██║██╔══██╗
  ██╔██╗ ██║██║   ██║██║   ██║███████║
  ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║
  ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║
  ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝
`));
console.log(c.bold("  NovaPanel — Scaffold v1.0"));
console.log(c.dim("  Building project structure...\n"));

// ─────────────────────────────────────────────────────────────
//  FILES & FOLDERS
//  Add anything new here in the future — just touch() it
// ─────────────────────────────────────────────────────────────

// ── GitHub Actions ────────────────────────────────────────────
touch(".github/workflows/deploy.yml");

// ── API ───────────────────────────────────────────────────────
touch("api/src/config/database.js");
touch("api/src/config/env.js");

touch("api/src/controllers/auth.controller.js");
touch("api/src/controllers/servers.controller.js");
touch("api/src/controllers/users.controller.js");
touch("api/src/controllers/nodes.controller.js");
touch("api/src/controllers/billing.controller.js");

touch("api/src/middleware/auth.middleware.js");
touch("api/src/middleware/rbac.middleware.js");
touch("api/src/middleware/ratelimit.js");
touch("api/src/middleware/logger.js");

touch("api/src/models/User.js");
touch("api/src/models/Server.js");
touch("api/src/models/Node.js");
touch("api/src/models/Allocation.js");
touch("api/src/models/AuditLog.js");

touch("api/src/routes/index.js");
touch("api/src/routes/auth.routes.js");
touch("api/src/routes/servers.routes.js");
touch("api/src/routes/nodes.routes.js");
touch("api/src/routes/admin.routes.js");

touch("api/src/services/docker.service.js");
touch("api/src/services/wings.service.js");
touch("api/src/services/metrics.service.js");
touch("api/src/services/email.service.js");

touch("api/src/utils/jwt.js");
touch("api/src/utils/crypto.js");
touch("api/src/utils/validators.js");

touch("api/src/app.js");
touch("api/.env.example");

// ── api/package.json — placeholder so Git tracks the folder ──
touch("api/package.json", JSON.stringify({
  name: "novapanel-api",
  version: "0.1.0",
  description: "NovaPanel REST API",
  main: "src/app.js",
  scripts: {
    start: "node src/app.js",
    dev:   "nodemon src/app.js"
  },
  dependencies: {},
  devDependencies: {}
}, null, 2));

// ── Panel ─────────────────────────────────────────────────────
touch("panel/public/.gitkeep");

touch("panel/src/assets/.gitkeep");

touch("panel/src/components/ui/.gitkeep");
touch("panel/src/components/layout/Sidebar.jsx");
touch("panel/src/components/layout/Topbar.jsx");
touch("panel/src/components/charts/ResourceChart.jsx");

touch("panel/src/pages/auth/Login.jsx");
touch("panel/src/pages/auth/Register.jsx");
touch("panel/src/pages/dashboard/Dashboard.jsx");
touch("panel/src/pages/servers/ServerList.jsx");
touch("panel/src/pages/servers/ServerDetail.jsx");
touch("panel/src/pages/servers/Console.jsx");
touch("panel/src/pages/admin/AdminPanel.jsx");
touch("panel/src/pages/settings/Settings.jsx");

touch("panel/src/hooks/useAuth.js");
touch("panel/src/hooks/useServers.js");
touch("panel/src/hooks/useWebSocket.js");

touch("panel/src/store/authStore.js");
touch("panel/src/store/serverStore.js");

touch("panel/src/lib/api.js");
touch("panel/src/lib/websocket.js");

touch("panel/src/App.jsx");
touch("panel/src/main.jsx");

touch("panel/tailwind.config.js");
touch("panel/vite.config.js");
touch("panel/index.html");

touch("panel/package.json", JSON.stringify({
  name: "novapanel-panel",
  version: "0.1.0",
  description: "NovaPanel Frontend",
  scripts: {
    dev:     "vite",
    build:   "vite build",
    preview: "vite preview"
  },
  dependencies: {},
  devDependencies: {}
}, null, 2));

// ── Daemon ────────────────────────────────────────────────────
touch("daemon/src/docker.js");
touch("daemon/src/websocket.js");
touch("daemon/src/metrics.js");
touch("daemon/src/index.js");

touch("daemon/package.json", JSON.stringify({
  name: "novapanel-daemon",
  version: "0.1.0",
  description: "NovaPanel Node Daemon",
  main: "src/index.js",
  scripts: {
    start: "node src/index.js",
    dev:   "nodemon src/index.js"
  },
  dependencies: {},
  devDependencies: {}
}, null, 2));

// ── Database ──────────────────────────────────────────────────
touch("database/migrations/001_create_users.sql");
touch("database/migrations/002_create_nodes.sql");
touch("database/migrations/003_create_servers.sql");
touch("database/migrations/004_create_allocations.sql");
touch("database/migrations/005_create_audit_logs.sql");
touch("database/seeds/admin_user.js");

// ── Scripts ───────────────────────────────────────────────────
touch("scripts/install.sh");
touch("scripts/update.sh");
touch("scripts/setup-db.sh");

// ── Nginx ─────────────────────────────────────────────────────
touch("nginx/novapanel.conf");

// ── Root ──────────────────────────────────────────────────────
touch("docker-compose.yml");
touch("README.md", "# NovaPanel\n\nAdvanced game & hosting panel.\n");

// ── .gitignore ────────────────────────────────────────────────
touch(".gitignore", [
  "# Dependencies",
  "node_modules/",
  "",
  "# Environment files — NEVER commit these",
  ".env",
  ".env.local",
  "*.env",
  "",
  "# Build output",
  "dist/",
  "build/",
  "",
  "# Logs",
  "logs/",
  "*.log",
  "",
  "# OS files",
  ".DS_Store",
  "Thumbs.db",
  "",
  "# Editor",
  ".vscode/",
  ".idea/",
].join("\n"));

// ── Count what was created ────────────────────────────────────
function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    count += entry.isDirectory() ? countFiles(full) : 1;
  }
  return count;
}

const total = countFiles(ROOT);

// ── Done ──────────────────────────────────────────────────────
console.log(c.green(`  ✅  Done! Created ${total} files inside /${ROOT}\n`));

console.log(c.bold("  ── Next steps ──────────────────────────────────────────"));
console.log("");
console.log(c.yellow("  1.") + "  Open the novapanel folder in VSC:");
console.log(c.dim("       File → Open Folder → select novapanel"));
console.log("");
console.log(c.yellow("  2.") + "  Initialise Git (in VSC terminal):");
console.log(c.dim("       cd novapanel"));
console.log(c.dim("       git init"));
console.log(c.dim("       git branch -M main"));
console.log("");
console.log(c.yellow("  3.") + "  Create a repo on GitHub, then:");
console.log(c.dim("       git remote add origin https://github.com/YOU/novapanel.git"));
console.log(c.dim("       git add ."));
console.log(c.dim('       git commit -m "chore: initial scaffold"'));
console.log(c.dim("       git push -u origin main"));
console.log("");
console.log(c.yellow("  4.") + "  Come back here — next step is the API & package installs.");
console.log("");
console.log(c.dim("  ────────────────────────────────────────────────────────\n"));