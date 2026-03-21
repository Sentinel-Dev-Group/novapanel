const router = require("express").Router();
const auth   = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { User } = require("../models");

// GET /api/admin/users
router.get("/users", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const users = await User.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json({ status: 200, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;