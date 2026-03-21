// ============================================================
//  auth.controller.js — Authentication logic
//  Handles register, login, token refresh, logout and
//  returning the current user profile.
// ============================================================

const { User }     = require("../models");
const AuditLog     = require("../models/AuditLog");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { v4: uuidv4 } = require("uuid");

// ── Helpers ───────────────────────────────────────────────────

//  Pull IP from request — works behind a proxy too
function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

//  Send both tokens back in a consistent shape
function sendTokens(res, user, statusCode = 200) {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return res.status(statusCode).json({
    status: statusCode,
    accessToken,
    refreshToken,
    user,
  });
}

// ── Register ──────────────────────────────────────────────────
//  POST /api/auth/register
//  Body: { username, email, password, firstName?, lastName? }
async function register(req, res, next) {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // ── Basic validation ───────────────────────────────────
    if (!username || !email || !password) {
      return res.status(400).json({
        status:  400,
        message: "Username, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status:  400,
        message: "Password must be at least 8 characters",
      });
    }

    // ── Check for duplicates ───────────────────────────────
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        status:  409,
        message: "An account with that email already exists",
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({
        status:  409,
        message: "That username is already taken",
      });
    }

    // ── Create the user ────────────────────────────────────
    //  Password is hashed automatically by the beforeSave hook
    const user = await User.create({
      username,
      email,
      password,
      firstName: firstName || null,
      lastName:  lastName  || null,
    });

    // ── Generate tokens ────────────────────────────────────
    const refreshToken = generateRefreshToken(user);

    //  Store refresh token on the user row
    await user.update({ refreshToken });

    // ── Audit log ──────────────────────────────────────────
    await AuditLog.record({
      userId:       user.id,
      username:     user.username,
      action:       "auth.register",
      description:  `New user registered: ${user.email}`,
      resourceType: "user",
      resourceId:   user.uuid,
      ipAddress:    getIp(req),
      userAgent:    req.headers["user-agent"],
      severity:     "info",
    });

    return sendTokens(res, user, 201);

  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────
//  POST /api/auth/login
//  Body: { email, password }
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status:  400,
        message: "Email and password are required",
      });
    }

    // ── Find the user ──────────────────────────────────────
    const user = await User.findOne({ where: { email } });

    //  Vague error message on purpose — don't reveal if the
    //  email exists or not (prevents user enumeration)
    if (!user) {
      return res.status(401).json({
        status:  401,
        message: "Invalid email or password",
      });
    }

    // ── Check account state ────────────────────────────────
    if (!user.isActive) {
      return res.status(403).json({
        status:  403,
        message: "This account has been deactivated",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        status:  403,
        message: `Account suspended: ${user.suspendReason || "contact support"}`,
      });
    }

    // ── Verify password ────────────────────────────────────
    const valid = await user.validatePassword(password);

    if (!valid) {
      // Log failed attempt
      await AuditLog.record({
        userId:      user.id,
        username:    user.username,
        action:      "auth.failed_login",
        description: `Failed login attempt for ${email}`,
        ipAddress:   getIp(req),
        userAgent:   req.headers["user-agent"],
        severity:    "warning",
      });

      return res.status(401).json({
        status:  401,
        message: "Invalid email or password",
      });
    }

    // ── Generate tokens ────────────────────────────────────
    const refreshToken = generateRefreshToken(user);

    //  Update last login info and store refresh token
    await user.update({
      refreshToken,
      lastLoginAt: new Date(),
      lastLoginIp: getIp(req),
    });

    // ── Audit log ──────────────────────────────────────────
    await AuditLog.record({
      userId:      user.id,
      username:    user.username,
      action:      "auth.login",
      description: `User logged in from ${getIp(req)}`,
      ipAddress:   getIp(req),
      userAgent:   req.headers["user-agent"],
      severity:    "info",
    });

    return sendTokens(res, user);

  } catch (err) {
    next(err);
  }
}

// ── Refresh ───────────────────────────────────────────────────
//  POST /api/auth/refresh
//  Body: { refreshToken }
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status:  400,
        message: "Refresh token is required",
      });
    }

    // ── Verify the refresh token ───────────────────────────
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        status:  401,
        message: "Invalid or expired refresh token — please log in again",
      });
    }

    // ── Load user and validate stored token ────────────────
    //  We check the token matches what's in the DB
    //  This means logout instantly invalidates the token
    const user = await User.findByPk(payload.sub);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        status:  401,
        message: "Refresh token has been revoked — please log in again",
      });
    }

    if (user.isSuspended || !user.isActive) {
      return res.status(403).json({
        status:  403,
        message: "Account is suspended or inactive",
      });
    }

    // ── Rotate the refresh token ───────────────────────────
    //  Issue a brand new refresh token each time
    //  Old one is replaced — limits the refresh token window
    const newRefreshToken = generateRefreshToken(user);
    await user.update({ refreshToken: newRefreshToken });

    const accessToken = generateAccessToken(user);

    return res.json({
      status: 200,
      accessToken,
      refreshToken: newRefreshToken,
    });

  } catch (err) {
    next(err);
  }
}

// ── Logout ────────────────────────────────────────────────────
//  POST /api/auth/logout
//  Protected — requires valid access token
async function logout(req, res, next) {
  try {
    //  Wipe the refresh token from the DB
    //  This means the user cannot get new access tokens
    await req.user.update({ refreshToken: null });

    await AuditLog.record({
      userId:    req.user.id,
      username:  req.user.username,
      action:    "auth.logout",
      ipAddress: getIp(req),
      severity:  "info",
    });

    return res.json({
      status:  200,
      message: "Logged out successfully",
    });

  } catch (err) {
    next(err);
  }
}

// ── Me ────────────────────────────────────────────────────────
//  GET /api/auth/me
//  Protected — returns the current user's profile
async function me(req, res) {
  //  req.user is already loaded by auth middleware
  //  toJSON() strips sensitive fields automatically
  return res.json({
    status: 200,
    user:   req.user,
  });
}

module.exports = { register, login, refresh, logout, me };