// ============================================================
//  users.controller.js — User profile management
// ============================================================

const { User }    = require("../models");
const AuditLog    = require("../models/AuditLog");

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

// ── Get current user ──────────────────────────────────────────
//  GET /api/users/me
async function getMe(req, res) {
  return res.json({
    status: 200,
    user:   req.user,
  });
}

// ── Update profile ────────────────────────────────────────────
//  PATCH /api/users/me
//  Only allows updating firstName and lastName
//  Username and email require admin action
async function updateMe(req, res, next) {
  try {
    const { firstName, lastName } = req.body;

    // ── Validate ───────────────────────────────────────────
    if (firstName !== undefined && typeof firstName !== "string") {
      return res.status(400).json({
        status:  400,
        message: "First name must be a string",
      });
    }

    if (lastName !== undefined && typeof lastName !== "string") {
      return res.status(400).json({
        status:  400,
        message: "Last name must be a string",
      });
    }

    // ── Build updates ──────────────────────────────────────
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName?.trim() || null;
    if (lastName  !== undefined) updates.lastName  = lastName?.trim()  || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status:  400,
        message: "No valid fields to update",
      });
    }

    await req.user.update(updates);

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "user.update_profile",
      description:  "User updated their profile",
      resourceType: "user",
      resourceId:   req.user.uuid,
      ipAddress:    getIp(req),
      severity:     "info",
    });

    return res.json({
      status:  200,
      message: "Profile updated successfully",
      user:    req.user,
    });

  } catch (err) {
    next(err);
  }
}

// ── Change password ───────────────────────────────────────────
//  PATCH /api/users/me/password
async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    // ── Validate ───────────────────────────────────────────
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status:  400,
        message: "currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status:  400,
        message: "New password must be at least 8 characters",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        status:  400,
        message: "New password must be different from your current password",
      });
    }

    // ── Verify current password ────────────────────────────
    //  Load full user with password field for comparison
    const user = await User.findOne({
    where: { id: req.user.id },
    attributes: [
        "id", "uuid", "username", "email", "password",
        "role", "isActive", "isSuspended", "refreshToken",
    ],
    });

    const valid = await user.validatePassword(currentPassword);

    if (!valid) {
      await AuditLog.record({
        userId:      req.user.id,
        username:    req.user.username,
        action:      "user.failed_password_change",
        description: "Failed password change — incorrect current password",
        ipAddress:   getIp(req),
        severity:    "warning",
      });

      return res.status(401).json({
        status:  401,
        message: "Current password is incorrect",
      });
    }

    // ── Update password ────────────────────────────────────
    //  The beforeSave hook in User.js hashes it automatically
    await user.update({
      password:     newPassword,
      refreshToken: null, // invalidate all sessions
    });

    await AuditLog.record({
      userId:      req.user.id,
      username:    req.user.username,
      action:      "user.password_changed",
      description: "User changed their password",
      ipAddress:   getIp(req),
      severity:    "warning",
    });

    return res.json({
      status:  200,
      message: "Password changed successfully — please log in again",
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, updatePassword };
