// ============================================================
//  rbac.middleware.js — Role Based Access Control
//  Used to restrict routes to specific roles.
//  Always used AFTER the auth middleware, never before.
//
//  Usage in a route file:
//  const { requireRole } = require("../middleware/rbac.middleware");
//
//  router.get("/nodes", auth, requireRole("admin"), listNodes);
//  router.get("/me",    auth, requireRole("user"),  getMe);
// ============================================================

// ── Role hierarchy ────────────────────────────────────────────
//  Higher number = more permissions
//  A role always has access to everything below it
const ROLE_LEVEL = {
  user:  1,
  admin: 2,
  root:  3,
};

// ── requireRole ───────────────────────────────────────────────
//  Pass the MINIMUM role required to access the route
//  e.g. requireRole("admin") allows admin and root
//  e.g. requireRole("user")  allows user, admin and root
function requireRole(minimumRole) {
  return (req, res, next) => {
    // auth middleware must run first — req.user must exist
    if (!req.user) {
      return res.status(401).json({
        status:  401,
        message: "Not authenticated",
      });
    }

    const userLevel    = ROLE_LEVEL[req.user.role] ?? 0;
    const requiredLevel = ROLE_LEVEL[minimumRole]  ?? 999;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        status:  403,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}

// ── requireOwnerOrAdmin ───────────────────────────────────────
//  Used for routes where a user can access their own resource
//  but not other users' resources, unless they are an admin.
//
//  Usage:
//  router.get("/servers/:id", auth, requireOwnerOrAdmin, getServer);
//
//  The controller must set req.resourceOwnerId before this runs
//  or pass the ownerId as a parameter
function requireOwnerOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      status:  401,
      message: "Not authenticated",
    });
  }

  const isAdmin = ROLE_LEVEL[req.user.role] >= ROLE_LEVEL["admin"];
  const isOwner = req.resourceOwnerId && req.resourceOwnerId === req.user.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      status:  403,
      message: "You do not have permission to access this resource",
    });
  }

  next();
}

// ── isAdmin ───────────────────────────────────────────────────
//  Simple boolean helper you can use inside controllers
//  e.g. if (isAdmin(req.user)) { show extra fields }
function isAdmin(user) {
  return ROLE_LEVEL[user?.role] >= ROLE_LEVEL["admin"];
}

module.exports = { requireRole, requireOwnerOrAdmin, isAdmin };