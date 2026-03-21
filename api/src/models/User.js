// ============================================================
//  User.js — Users table model
//  Represents anyone who can log into NovaPanel.
//  Admins, subusers, and clients all use this model.
// ============================================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt        = require("bcryptjs");
const { bcrypt: bcryptCfg } = require("../config/env");

const User = sequelize.define("User", {

  // ── Primary key ─────────────────────────────────────────────
  id: {
    type:          DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey:    true,
  },

  // ── Identity ────────────────────────────────────────────────
  uuid: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull:    false,
    unique:       true,
  },

  username: {
    type:      DataTypes.STRING(32),
    allowNull: false,
    unique:    true,
    validate: {
      len:     [3, 32],
      // only letters, numbers, underscores, hyphens
      is:      /^[a-zA-Z0-9_-]+$/,
    },
  },

  email: {
    type:      DataTypes.STRING(191),
    allowNull: false,
    unique:    true,
    validate:  { isEmail: true },
  },

  password: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

  // ── Profile ─────────────────────────────────────────────────
  firstName: {
    type:      DataTypes.STRING(64),
    allowNull: true,
  },

  lastName: {
    type:      DataTypes.STRING(64),
    allowNull: true,
  },

  avatarUrl: {
    type:      DataTypes.STRING(512),
    allowNull: true,
  },

  // ── Role & permissions ──────────────────────────────────────
  //  root  — full access to everything, only set manually in DB
  //  admin — can manage all users, nodes, servers
  //  user  — standard client, can only see their own servers
  role: {
    type:         DataTypes.ENUM("root", "admin", "user"),
    allowNull:    false,
    defaultValue: "user",
  },

  // ── Account state ───────────────────────────────────────────
  isActive: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },

  isSuspended: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },

  suspendReason: {
    type:      DataTypes.STRING(255),
    allowNull: true,
  },

  // ── 2FA ─────────────────────────────────────────────────────
  twoFactorSecret: {
    type:      DataTypes.STRING(64),
    allowNull: true,
  },

  twoFactorEnabled: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },

  // ── Auth tokens ─────────────────────────────────────────────
  refreshToken: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },

  passwordResetToken: {
    type:      DataTypes.STRING(128),
    allowNull: true,
  },

  passwordResetExpires: {
    type:      DataTypes.DATE,
    allowNull: true,
  },

  // ── Tracking ────────────────────────────────────────────────
  lastLoginAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },

  lastLoginIp: {
    type:      DataTypes.STRING(45), // supports IPv6
    allowNull: true,
  },

}, {
  tableName: "users",
  paranoid:  true, // soft delete — adds deletedAt instead of removing the row
});

// ── Hooks ─────────────────────────────────────────────────────
//  Automatically hash the password before save
//  Only rehashes if the password field was actually changed
User.beforeSave(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, bcryptCfg.rounds);
  }
});

// ── Instance methods ──────────────────────────────────────────
//  Call user.validatePassword("plaintext") to check login
User.prototype.validatePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

//  Never expose the password hash, refresh token, or 2FA secret
//  in API responses — this runs automatically on JSON.stringify
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.refreshToken;
  delete values.twoFactorSecret;
  delete values.passwordResetToken;
  return values;
};

module.exports = User;