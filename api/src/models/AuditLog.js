// ============================================================
//  AuditLog.js — Audit log table model
//  Records every important action taken in the panel.
//  Who did it, what they did, when, and from where.
//  Rows are never updated or deleted — append only.
// ============================================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const AuditLog = sequelize.define("AuditLog", {

  // ── Primary key ─────────────────────────────────────────────
  id: {
    type:          DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey:    true,
  },

  // ── Who did it ──────────────────────────────────────────────
  //  NULL if the action was triggered by the system itself
  userId: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  //  Snapshot of the username at the time of the action
  //  Stored separately so logs stay accurate if user is renamed
  username: {
    type:      DataTypes.STRING(32),
    allowNull: true,
  },

  // ── What they did ───────────────────────────────────────────
  //  Action is a short dot-notation string e.g.:
  //  "server.start"  "server.delete"  "user.suspend"
  //  "node.create"   "auth.login"     "auth.failed_login"
  action: {
    type:      DataTypes.STRING(64),
    allowNull: false,
  },

  //  Human readable description of the action
  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },

  // ── What it affected ────────────────────────────────────────
  //  The type of resource that was acted on
  //  e.g. "server", "user", "node", "allocation"
  resourceType: {
    type:      DataTypes.STRING(32),
    allowNull: true,
  },

  //  The ID of that resource
  resourceId: {
    type:      DataTypes.STRING(36), // long enough for a UUID
    allowNull: true,
  },

  // ── Extra context ───────────────────────────────────────────
  //  Any additional structured data relevant to the action
  //  e.g. { "old_status": "running", "new_status": "stopped" }
  //  e.g. { "ip": "1.2.3.4", "reason": "wrong password" }
  metadata: {
    type:         DataTypes.JSON,
    allowNull:    true,
    defaultValue: null,
  },

  // ── Where it came from ──────────────────────────────────────
  ipAddress: {
    type:      DataTypes.STRING(45),
    allowNull: true,
  },

  userAgent: {
    type:      DataTypes.STRING(512),
    allowNull: true,
  },

  // ── Severity ────────────────────────────────────────────────
  //  info     — normal operation e.g. server started
  //  warning  — something worth noting e.g. failed login
  //  critical — serious action e.g. user deleted, node removed
  severity: {
    type:         DataTypes.ENUM("info", "warning", "critical"),
    allowNull:    false,
    defaultValue: "info",
  },

}, {
  tableName:  "audit_logs",
  updatedAt:  false,   // logs are append-only, never updated
  paranoid:   false,   // logs are never soft deleted either
});

// ── Associations ──────────────────────────────────────────────
AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.User, {
    foreignKey: "userId",
    as:         "user",
  });
};

// ── Static helper ─────────────────────────────────────────────
//  Call AuditLog.record({...}) anywhere to log an action
//  without having to remember all the fields every time
AuditLog.record = async function ({
  userId       = null,
  username     = null,
  action,
  description  = null,
  resourceType = null,
  resourceId   = null,
  metadata     = null,
  ipAddress    = null,
  userAgent    = null,
  severity     = "info",
}) {
  try {
    await AuditLog.create({
      userId,
      username,
      action,
      description,
      resourceType,
      resourceId,
      metadata,
      ipAddress,
      userAgent,
      severity,
    });
  } catch (err) {
    // Never let a logging failure crash the main request
    console.error("[AuditLog] Failed to write log entry:", err.message);
  }
};

module.exports = AuditLog;