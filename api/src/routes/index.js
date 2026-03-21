// ============================================================
//  routes/index.js — Route aggregator
//  All routes plug in here. Add new route files below.
// ============================================================

const router = require("express").Router();

// ── Ping ──────────────────────────────────────────────────────
//  Simple test route — GET /api/ping
//  First thing to hit when testing the API is running
router.get("/ping", (req, res) => {
  res.json({
    status:  "ok",
    message: "NovaPanel API is alive 🚀",
    time:    new Date().toISOString(),
  });
});

// ── Feature routes (uncomment as we build them) ───────────────
 router.use("/auth",    require("./auth.routes"));
 router.use("/users",   require("./users.routes"));
 router.use("/servers", require("./servers.routes"));
 router.use("/nodes",   require("./nodes.routes"));
 router.use("/admin",   require("./admin.routes"));

module.exports = router;