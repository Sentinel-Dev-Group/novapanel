// ============================================================
//  jwt.js — JSON Web Token utilities
//  Handles generating and verifying both access tokens
//  and refresh tokens used for authentication.
//
//  Access token  — short lived (15m), sent with every request
//  Refresh token — long lived (7d), used to get a new access
//                  token without logging in again
// ============================================================

const jwt        = require("jsonwebtoken");
const { jwt: jwtCfg } = require("../config/env");

// ── Generate an access token ──────────────────────────────────
//  Called after a successful login or token refresh
//  Embeds the user's id, uuid, and role into the token
function generateAccessToken(user) {
  return jwt.sign(
    {
      sub:  user.id,
      uuid: user.uuid,
      role: user.role,
    },
    jwtCfg.secret,
    { expiresIn: jwtCfg.expiresIn }
  );
}

// ── Generate a refresh token ──────────────────────────────────
//  Called at login — stored in the database on the user row
//  Only contains the user id — minimal payload for security
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    jwtCfg.refreshSecret,
    { expiresIn: jwtCfg.refreshExpiresIn }
  );
}

// ── Verify an access token ────────────────────────────────────
//  Returns the decoded payload if valid
//  Throws a JsonWebTokenError if invalid or expired
function verifyAccessToken(token) {
  return jwt.verify(token, jwtCfg.secret);
}

// ── Verify a refresh token ────────────────────────────────────
function verifyRefreshToken(token) {
  return jwt.verify(token, jwtCfg.refreshSecret);
}

// ── Decode without verifying ──────────────────────────────────
//  Only use this for non-sensitive reads e.g. logging
//  NEVER use this to authenticate a request
function decodeToken(token) {
  return jwt.decode(token);
}

// ── Extract token from request header ────────────────────────
//  Expects: Authorization: Bearer <token>
//  Returns the raw token string or null if not present
function extractTokenFromHeader(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)                       return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return token || null;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
};
