// ============================================================
//  nodes.routes.js — Node management routes
//  Nodes are the physical/virtual servers that host
//  game server containers.
//  All routes require authentication.
//  Most routes require admin role or above.
// ============================================================

const router   = require("express").Router();
const auth     = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const {
  listNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  getNodeStats,
} = require("../controllers/nodes.controller");

// ── GET /api/nodes ────────────────────────────────────────────
//  List all nodes
//  Admin sees everything including offline nodes
//  Regular users only see public online nodes
router.get(
  "/",
  auth,
  requireRole("user"),
  listNodes
);

// ── GET /api/nodes/:id ────────────────────────────────────────
//  Get a single node by ID or UUID
router.get(
  "/:id",
  auth,
  requireRole("user"),
  getNode
);

// ── GET /api/nodes/:id/stats ──────────────────────────────────
//  Get live resource usage stats for a node
//  Pulled from the usageSnapshot updated by the daemon
router.get(
  "/:id/stats",
  auth,
  requireRole("user"),
  getNodeStats
);

// ── POST /api/nodes ───────────────────────────────────────────
//  Create a new node
//  Admin only
router.post(
  "/",
  auth,
  requireRole("admin"),
  createNode
);

// ── PATCH /api/nodes/:id ──────────────────────────────────────
//  Update a node's details or settings
//  Admin only
router.patch(
  "/:id",
  auth,
  requireRole("admin"),
  updateNode
);

// ── DELETE /api/nodes/:id ─────────────────────────────────────
//  Remove a node
//  Only allowed if the node has no active servers on it
//  Admin only
router.delete(
  "/:id",
  auth,
  requireRole("admin"),
  deleteNode
);

module.exports = router;