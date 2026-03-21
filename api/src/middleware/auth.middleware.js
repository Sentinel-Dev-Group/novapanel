// ============================================================
//  auth.middleware.js — JWT authentication middleware
//  Verifies the Bearer token on protected routes.
//  Attaches the user object to req.user if valid.
// ============================================================

const { verifyAccessToken, extractTokenFromHeader } = require("../utils/jwt");
const { User } = require("../models");

async function auth(req, res, next) {
  try {
    // ── Extract token from header ──────────────────────────
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        status:  401,
        message: "No token provided — please log in",
      });
    }

    // ── Verify the token ───────────────────────────────────
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      const message = err.name === "TokenExpiredError"
        ? "Token expired — please refresh your session"
        : "Invalid token — please log in again";

      return res.status(401).json({ status: 401, message });
    }

    // ── Load the user from the database ────────────────────
    //  We always load fresh from DB so suspensions and
    //  role changes take effect immediately
    const user = await User.findByPk(payload.sub);

    if (!user) {
      return res.status(401).json({
        status:  401,
        message: "User no longer exists",
      });
    }

    if (!user.isActive || user.isSuspended) {
      return res.status(403).json({
        status:  403,
        message: user.isSuspended
          ? `Account suspended: ${user.suspendReason || "contact support"}`
          : "Account is inactive",
      });
    }

    // ── Attach user to request ─────────────────────────────
    req.user = user;
    next();

  } catch (err) {
    next(err);
  }
}

module.exports = auth;