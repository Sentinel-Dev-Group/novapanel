// ============================================================
//  Node.js — Game nodes table model
//  A node is a physical or virtual server that hosts
//  game servers. Each node runs the NovaPanel daemon.
// ============================================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Node = sequelize.define("Node", {

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

  name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
    validate:  { len: [3, 100] },
  },

  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },

  // ── Location ────────────────────────────────────────────────
  //  Just a label e.g. "UK - London", "US - New York"
  location: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },

  // ── Network ─────────────────────────────────────────────────
  //  fqdn — the domain or IP the daemon is reachable on
  //  e.g. node1.yourdomain.com or 192.168.1.10
  fqdn: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    unique:    true,
  },

  //  Which IP game servers on this node bind to
  //  Usually the same as fqdn but can differ
  bindIp: {
    type:      DataTypes.STRING(45),
    allowNull: false,
  },

  //  Port the NovaPanel daemon listens on
  daemonPort: {
    type:         DataTypes.SMALLINT.UNSIGNED,
    allowNull:    false,
    defaultValue: 8080,
  },

  //  Whether to use HTTPS to talk to the daemon
  useSsl: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },

  // ── Auth ────────────────────────────────────────────────────
  //  Secret token the daemon uses to authenticate with the API
  //  Generated on node creation, stored hashed
  daemonSecret: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

  // ── Resource limits ─────────────────────────────────────────
  //  How much of this node's resources can be allocated
  //  to game servers. Allows slight overprovisioning.

  //  Total RAM available on the node in MB
  memoryTotal: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment:   "MB",
  },

  //  How much RAM to reserve for the OS and daemon
  memoryOverallocate: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    comment:      "% overallocate. 0 = no overallocation",
  },

  //  Total disk space available in MB
  diskTotal: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment:   "MB",
  },

  diskOverallocate: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    comment:      "% overallocate. 0 = no overallocation",
  },

  //  Total CPU cores available (stored as threads)
  cpuTotal: {
    type:      DataTypes.SMALLINT.UNSIGNED,
    allowNull: false,
    comment:   "Number of CPU threads",
  },

  // ── Port range ──────────────────────────────────────────────
  //  Game servers get allocated a port from this range
  portRangeStart: {
    type:         DataTypes.SMALLINT.UNSIGNED,
    allowNull:    false,
    defaultValue: 27015,
  },

  portRangeEnd: {
    type:         DataTypes.SMALLINT.UNSIGNED,
    allowNull:    false,
    defaultValue: 27100,
  },

  // ── State ───────────────────────────────────────────────────
  //  online    — daemon is reachable and healthy
  //  offline   — daemon is not responding
  //  draining  — no new servers, existing ones still running
  //              used when you want to decommission a node
  status: {
    type:         DataTypes.ENUM("online", "offline", "draining"),
    allowNull:    false,
    defaultValue: "offline",
  },

  isPublic: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
    comment:      "If false, only admins can deploy servers to this node",
  },

  // ── Health snapshot ─────────────────────────────────────────
  //  Updated by the daemon heartbeat every 30 seconds
  lastHeartbeatAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },

  //  Snapshot of current usage — stored as JSON
  //  { cpu: 45.2, memory: 8192, disk: 102400 }
  usageSnapshot: {
    type:         DataTypes.JSON,
    allowNull:    true,
    defaultValue: null,
  },

}, {
  tableName: "nodes",
  paranoid:  true,
});

// ── Instance methods ──────────────────────────────────────────

//  Returns the base URL used to talk to the daemon
Node.prototype.daemonUrl = function () {
  const protocol = this.useSsl ? "https" : "http";
  return `${protocol}://${this.fqdn}:${this.daemonPort}`;
};

//  How much memory is allocatable after overallocation %
Node.prototype.allocatableMemory = function () {
  return Math.floor(this.memoryTotal * (1 + this.memoryOverallocate / 100));
};

//  How much disk is allocatable after overallocation %
Node.prototype.allocatableDisk = function () {
  return Math.floor(this.diskTotal * (1 + this.diskOverallocate / 100));
};

//  Strip the daemon secret from API responses
Node.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.daemonSecret;
  return values;
};

module.exports = Node;