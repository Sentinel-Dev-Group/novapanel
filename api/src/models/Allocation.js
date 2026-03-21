// ============================================================
//  Allocation.js — Port allocations table model
//  Tracks which ports on a node are free or assigned
//  to a game server. Each server needs at least one port.
// ============================================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Allocation = sequelize.define("Allocation", {

  // ── Primary key ─────────────────────────────────────────────
  id: {
    type:          DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey:    true,
  },

  // ── Which node this port lives on ───────────────────────────
  nodeId: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  // ── Which server this port is assigned to ───────────────────
  //  NULL means the port is free and available to assign
  serverId: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  },

  // ── Port details ────────────────────────────────────────────
  //  ip — the IP on the node this port is bound to
  ip: {
    type:      DataTypes.STRING(45),
    allowNull: false,
  },

  //  The actual port number e.g. 27015
  port: {
    type:      DataTypes.SMALLINT.UNSIGNED,
    allowNull: false,
    validate:  { min: 1024, max: 65535 },
  },

  //  Optional friendly alias e.g. "Game Port", "Query Port"
  alias: {
    type:      DataTypes.STRING(64),
    allowNull: true,
  },

  // ── State ───────────────────────────────────────────────────
  //  Whether this is the primary port for its server
  //  Each server has exactly one primary allocation
  isPrimary: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },

  //  Marks a port as reserved — visible but never auto-assigned
  //  Useful for keeping certain ports free for specific use
  isReserved: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },

}, {
  tableName: "allocations",

  //  Prevent the same IP+port combo appearing twice on a node
  indexes: [
    {
      unique: true,
      fields: ["node_id", "ip", "port"],
    },
  ],
});

// ── Associations ──────────────────────────────────────────────
Allocation.associate = (models) => {
  //  An allocation belongs to one node
  Allocation.belongsTo(models.Node, {
    foreignKey: "nodeId",
    as:         "node",
  });

  //  An allocation optionally belongs to one server
  Allocation.belongsTo(models.Server, {
    foreignKey: "serverId",
    as:         "server",
  });
};

// ── Instance methods ──────────────────────────────────────────

//  Quick check if this port is currently in use
Allocation.prototype.isAssigned = function () {
  return this.serverId !== null;
};

//  Returns a human readable string e.g. "192.168.1.10:27015"
Allocation.prototype.toString = function () {
  return `${this.ip}:${this.port}`;
};

module.exports = Allocation;