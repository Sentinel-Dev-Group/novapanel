// ============================================================
//  admin.routes.js — Admin management routes
// ============================================================

const router = require("express").Router();
const auth   = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { User } = require("../models");
const AuditLog = require("../models/AuditLog");

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress || "unknown"
  );
}

// ── GET /api/admin/users ──────────────────────────────────────
router.get("/users", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ status: 200, count: users.length, users });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/users/:id/role ──────────────────────────
router.patch("/users/:id/role", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        status: 400,
        message: "Role must be 'user' or 'admin'",
      });
    }

    const user = await User.findOne({
      where: isNaN(req.params.id) ? { uuid: req.params.id } : { id: req.params.id },
    });

    if (!user) return res.status(404).json({ status: 404, message: "User not found" });

    // Cannot change root role
    if (user.role === "root") {
      return res.status(403).json({ status: 403, message: "Cannot change role of root user" });
    }

    // Cannot demote yourself
    if (user.id === req.user.id) {
      return res.status(403).json({ status: 403, message: "Cannot change your own role" });
    }

    await user.update({ role });

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "admin.user.role_change",
      description:  `Changed ${user.username} role to ${role}`,
      resourceType: "user",
      resourceId:   user.uuid,
      ipAddress:    getIp(req),
      severity:     "critical",
    });

    res.json({ status: 200, message: `Role updated to ${role}`, user });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/users/:id/suspend ───────────────────────
router.patch("/users/:id/suspend", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const { suspended, reason } = req.body;

    const user = await User.findOne({
      where: isNaN(req.params.id) ? { uuid: req.params.id } : { id: req.params.id },
    });

    if (!user) return res.status(404).json({ status: 404, message: "User not found" });
    if (user.role === "root") return res.status(403).json({ status: 403, message: "Cannot suspend root user" });
    if (user.id === req.user.id) return res.status(403).json({ status: 403, message: "Cannot suspend yourself" });

    await user.update({
      isSuspended:   suspended,
      suspendReason: suspended ? (reason || "Suspended by admin") : null,
      refreshToken:  suspended ? null : user.refreshToken,
    });

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       suspended ? "admin.user.suspend" : "admin.user.unsuspend",
      description:  `${suspended ? "Suspended" : "Unsuspended"} user ${user.username}`,
      resourceType: "user",
      resourceId:   user.uuid,
      metadata:     { reason },
      ipAddress:    getIp(req),
      severity:     "critical",
    });

    res.json({
      status:  200,
      message: suspended ? "User suspended" : "User unsuspended",
      user,
    });
  } catch (err) { next(err); }
});

module.exports = router;