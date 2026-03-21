// ============================================================
//  users.routes.js — User profile routes
// ============================================================

const router = require("express").Router();
const auth   = require("../middleware/auth.middleware");
const {
  getMe,
  updateMe,
  updatePassword,
} = require("../controllers/users.controller");

// GET  /api/users/me          — get current user profile
router.get("/me",          auth, getMe);

// PATCH /api/users/me         — update profile (name etc)
router.patch("/me",        auth, updateMe);

// PATCH /api/users/me/password — change password
router.patch("/me/password", auth, updatePassword);

module.exports = router;