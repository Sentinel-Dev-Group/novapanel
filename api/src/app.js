// ============================================================
//  app.js — Express application entry point
//  This is the file that starts the whole API server.
//  It wires together middleware, routes, and the database.
// ============================================================

const express        = require("express");
const http           = require("http");
const cors           = require("cors");
const helmet         = require("helmet");
const { Server }     = require("socket.io");

const { app: cfg }   = require("./config/env");
const { connectDB }  = require("./config/database");
const models         = require("./models");
const routes         = require("./routes/index");
const logger         = require("./middleware/logger");
const { generalLimiter: ratelimit } = require("./middleware/ratelimit");

// ── Create Express app & HTTP server ──────────────────────────
//  We wrap Express in a raw HTTP server so Socket.io can
//  share the same port as the REST API
const app    = express();
const server = http.createServer(app);

// ── Socket.io (real-time console & metrics) ───────────────────
const io = new Server(server, {
  cors: {
    origin:  cfg.cors?.origin || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io available anywhere via req.io
app.set("io", io);

// ── Global middleware ─────────────────────────────────────────

// Security headers on every response
app.use(helmet());

// CORS — only allow requests from the panel frontend
app.use(cors({
  origin:      cfg.cors?.origin || "http://localhost:5173",
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form bodies
app.use(express.urlencoded({ extended: true }));

// Request logger — logs method, path, status, response time
app.use(logger);

// Rate limiter — applied to all /api routes
app.use("/api", ratelimit);

// ── Routes ────────────────────────────────────────────────────
app.use("/api", routes);

// ── Health check ──────────────────────────────────────────────
//  Hit GET /health to confirm the API is alive
//  Useful for monitoring and the VPS install script
app.get("/health", (req, res) => {
  res.json({
    status:  "ok",
    name:    cfg.name,
    env:     cfg.env,
    time:    new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────
//  Any route not matched above returns a clean JSON 404
app.use((req, res) => {
  res.status(404).json({
    status:  404,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ── Global error handler ──────────────────────────────────────
//  Catches any error thrown inside a route or middleware
//  Always returns JSON instead of Express's default HTML error
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  console.error(`[ERROR] ${err.message}`);
  if (cfg.isDev) console.error(err.stack);

  res.status(status).json({
    status,
    message: cfg.isDev ? err.message : "An unexpected error occurred",
    ...(cfg.isDev && { stack: err.stack }),
  });
});

// ── Socket.io connection handler ──────────────────────────────
io.on("connection", (socket) => {
  console.log(`  🔌  Socket connected: ${socket.id}`);

  // ── Subscribe to a server's console ─────────────────────
  //  Client sends: { serverId: "uuid" }
  socket.on("console:subscribe", async ({ serverId }) => {
    if (!serverId) return;

    // Join a room named after the server UUID
    socket.join(`server:${serverId}`);
    console.log(`  📺  Socket ${socket.id} subscribed to server ${serverId}`);

    // Send a welcome message to just this socket
    socket.emit("console:line", {
      serverId,
      type: "info",
      text: `Connected to console for server ${serverId}`,
      time: new Date().toISOString(),
    });
  });

  // ── Unsubscribe from a server's console ──────────────────
  socket.on("console:unsubscribe", ({ serverId }) => {
    socket.leave(`server:${serverId}`);
    console.log(`  📺  Socket ${socket.id} unsubscribed from server ${serverId}`);
  });

  // ── Send a command to a server ───────────────────────────
  //  In production the daemon would handle this
  //  For now we echo it back as a console line
  socket.on("console:command", ({ serverId, command }) => {
    if (!serverId || !command) return;

    console.log(`  ⌨️   Command for ${serverId}: ${command}`);

    // Echo the command back to all subscribers
    io.to(`server:${serverId}`).emit("console:line", {
      serverId,
      type: "command",
      text: `> ${command}`,
      time: new Date().toISOString(),
    });

    // Simulate a response — daemon will replace this
    setTimeout(() => {
      io.to(`server:${serverId}`).emit("console:line", {
        serverId,
        type: "info",
        text: `[Server] Command received: ${command}`,
        time: new Date().toISOString(),
      });
    }, 200);
  });

  socket.on("disconnect", () => {
    console.log(`  🔌  Socket disconnected: ${socket.id}`);
  });
});

// ── Boot ──────────────────────────────────────────────────────
//  Connect to MariaDB first, then start listening for requests
async function boot() {
  console.log("\n  ⚡  Starting NovaPanel API...\n");

  await connectDB();

  server.listen(cfg.port, () => {
    console.log(`  🚀  API running at http://localhost:${cfg.port}`);
    console.log(`  🔍  Health check: http://localhost:${cfg.port}/health`);
    console.log(`  🌍  Environment: ${cfg.env}\n`);
  });
}

boot();