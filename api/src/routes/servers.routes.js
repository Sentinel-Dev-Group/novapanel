// ============================================================
//  servers.routes.js — Game server management routes
//  All routes require authentication.
//  Some routes are admin only.
//  Ownership is checked inside each controller.
// ============================================================

const router   = require("express").Router();
const auth     = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const {
  listServers,
  getServer,
  createServer,
  updateServer,
  deleteServer,
  startServer,
  stopServer,
  restartServer,
  getServerStats,
} = require("../controllers/servers.controller");

// ── GET /api/servers ──────────────────────────────────────────
//  List servers
//  Admins see all servers across all users
//  Regular users only see their own servers
router.get(
  "/",
  auth,
  requireRole("user"),
  listServers
);

// ── GET /api/servers/:id ──────────────────────────────────────
//  Get a single server by ID or UUID
router.get(
  "/:id",
  auth,
  requireRole("user"),
  getServer
);

// ── GET /api/servers/:id/stats ────────────────────────────────
//  Get live resource usage stats for a server
router.get(
  "/:id/stats",
  auth,
  requireRole("user"),
  getServerStats
);

// ── POST /api/servers ─────────────────────────────────────────
//  Create a new game server
//  Admin only — admins create servers and assign them to users
router.post(
  "/",
  auth,
  requireRole("admin"),
  createServer
);

// ── PATCH /api/servers/:id ────────────────────────────────────
//  Update server details or resource limits
//  Admin only
router.patch(
  "/:id",
  auth,
  requireRole("admin"),
  updateServer
);

// ── DELETE /api/servers/:id ───────────────────────────────────
//  Delete a server permanently
//  Admin only
router.delete(
  "/:id",
  auth,
  requireRole("admin"),
  deleteServer
);

// ── POST /api/servers/:id/start ───────────────────────────────
//  Start a stopped server
//  Owner or admin
router.post(
  "/:id/start",
  auth,
  requireRole("user"),
  startServer
);

// ── POST /api/servers/:id/stop ────────────────────────────────
//  Stop a running server gracefully
//  Owner or admin
router.post(
  "/:id/stop",
  auth,
  requireRole("user"),
  stopServer
);

// ── POST /api/servers/:id/restart ────────────────────────────
//  Restart a running server
//  Owner or admin
router.post(
  "/:id/restart",
  auth,
  requireRole("user"),
  restartServer
);

module.exports = router;