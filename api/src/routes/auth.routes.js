// ============================================================
//  auth.routes.js — Authentication routes
//  Defines the endpoints for register, login, refresh,
//  logout and current user (me).
// ============================================================

const router      = require("express").Router();
const { authLimiter } = require("../middleware/ratelimit");
const auth            = require("../middleware/auth.middleware");
const {
  register,
  login,
  refresh,
  logout,
  me,
} = require("../controllers/auth.controller");

// ── Public routes ─────────────────────────────────────────────
//  authLimiter applied here — max 10 attempts per 15 minutes

// POST /api/auth/register
router.post("/register", authLimiter, register);

// POST /api/auth/login
router.post("/login",    authLimiter, login);

// POST /api/auth/refresh
//  Accepts a refresh token and returns a new access token
router.post("/refresh",  authLimiter, refresh);

// ── Protected routes ──────────────────────────────────────────
//  auth middleware checks the Bearer token before the handler

// POST /api/auth/logout
router.post("/logout", auth, logout);

// GET /api/auth/me
//  Returns the currently logged in user's profile
router.get("/me", auth, me);

module.exports = router;