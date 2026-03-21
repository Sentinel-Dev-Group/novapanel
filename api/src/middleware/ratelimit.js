// ============================================================
//  ratelimit.js — API rate limiting middleware
//  Prevents brute force attacks and API abuse by limiting
//  how many requests a single IP can make per window.
// ============================================================

const rateLimit = require("express-rate-limit");

// ── General API limiter ───────────────────────────────────────
//  Applied to all /api routes in app.js
const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minute window
  max:              200,             // max 200 requests per window
  standardHeaders:  true,            // return rate limit info in headers
  legacyHeaders:    false,
  message: {
    status:  429,
    message: "Too many requests, please slow down and try again shortly.",
  },
});

// ── Strict limiter for auth routes ────────────────────────────
//  Applied specifically to /api/auth/login and /api/auth/register
//  Much tighter to prevent brute forcing passwords
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minute window
  max:              10,              // max 10 attempts per window
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    status:  429,
    message: "Too many login attempts, please wait 15 minutes and try again.",
  },
});

module.exports = { generalLimiter, authLimiter };