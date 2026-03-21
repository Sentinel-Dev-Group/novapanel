// ============================================================
//  Server.js — Game servers table model
//  Represents a single game server instance running
//  inside a Docker container on a node.
// ============================================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Server = sequelize.define("Server", {

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

  //  Short ID shown in the panel UI e.g. "a1b2c3d4"
  shortId: {
    type:      DataTypes.STRING(8),
    allowNull: false,
    unique:    true,
  },

  name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    validate:  { len: [1, 100] },
  },

  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },

  // ── Ownership ───────────────────────────────────────────────
  //  userId — the user who owns this server
  //  nodeId — which node it runs on
  //  Both set as foreign keys in associations below
  userId: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  nodeId: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  // ── Docker ──────────────────────────────────────────────────
  //  The Docker container ID once the server is created
  containerId: {
    type:      DataTypes.STRING(128),
    allowNull: true,
  },

  //  Docker image to use e.g. "novapanel/minecraft:java21"
  dockerImage: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

  // ── Game type ───────────────────────────────────────────────
  //  e.g. "minecraft_java", "csgo", "valheim", "rust"
  gameType: {
    type:      DataTypes.STRING(64),
    allowNull: false,
  },

  // ── Resource limits ─────────────────────────────────────────
  //  Hard limits enforced by Docker — the container cannot
  //  exceed these regardless of what the game tries to use

  //  RAM limit in MB
  memoryLimit: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment:   "MB",
    validate:  { min: 128 },
  },

  //  Swap in MB — extra virtual memory (slower, uses disk)
  //  Set to 0 to disable swap entirely
  swapLimit: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    comment:      "MB. 0 = disabled",
  },

  //  CPU limit as a percentage across all cores
  //  100 = 1 full core, 200 = 2 full cores, 0 = unlimited
  cpuLimit: {
    type:         DataTypes.SMALLINT.UNSIGNED,
    allowNull:    false,
    defaultValue: 100,
    comment:      "% of CPU. 100 = 1 core",
  },

  //  Disk space limit in MB
  diskLimit: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment:   "MB",
  },

  //  Max number of processes inside the container
  //  Prevents fork bombs
  processLimit: {
    type:         DataTypes.SMALLINT.UNSIGNED,
    allowNull:    false,
    defaultValue: 64,
  },

  // ── Network ─────────────────────────────────────────────────
  //  Primary port the game runs on — from the node's port range
  //  Linked to an Allocation row
  allocationId: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  // ── Startup ─────────────────────────────────────────────────
  //  The command used to start the game server
  //  Can include variables e.g. "java -Xmx{{MEMORY}}M -jar server.jar"
  startCommand: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },

  //  Key/value environment variables passed into the container
  //  e.g. { "SERVER_NAME": "My Server", "MAX_PLAYERS": "20" }
  environment: {
    type:         DataTypes.JSON,
    allowNull:    false,
    defaultValue: {},
  },

  // ── Feature flags ───────────────────────────────────────────
  //  Whether players can connect from outside the panel network
  isPublic: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },

  //  SFTP access for file management
  sftpEnabled: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },

  //  Auto restart if the server process crashes
  autoRestart: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },

  //  Auto start when the node daemon boots
  autoStart: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },

  // ── Backups ─────────────────────────────────────────────────
  backupLimit: {
    type:         DataTypes.TINYINT.UNSIGNED,
    allowNull:    false,
    defaultValue: 3,
    comment:      "Max number of backups to keep",
  },

  // ── State ───────────────────────────────────────────────────
  //  installing   — being set up for the first time
  //  starting     — container is booting
  //  running      — online and accepting connections
  //  stopping     — graceful shutdown in progress
  //  stopped      — offline
  //  suspended    — admin suspended, cannot be started
  //  error        — crashed or failed to start
  status: {
    type:         DataTypes.ENUM(
      "installing",
      "starting",
      "running",
      "stopping",
      "stopped",
      "suspended",
      "error"
    ),
    allowNull:    false,
    defaultValue: "installing",
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

  // ── Live stats ──────────────────────────────────────────────
  //  Updated by the daemon every 10 seconds
  //  { cpu: 23.1, memory: 1024, memoryLimit: 2048, players: 4 }
  statsSnapshot: {
    type:         DataTypes.JSON,
    allowNull:    true,
    defaultValue: null,
  },

  // ── Timestamps ──────────────────────────────────────────────
  installedAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },

  lastStartedAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },

  lastStoppedAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },

}, {
  tableName: "servers",
  paranoid:  true,
});

// ── Associations ──────────────────────────────────────────────
//  Defined here and also re-declared in a central associations
//  file loaded after all models are required
Server.associate = (models) => {
  //  A server belongs to one user
  Server.belongsTo(models.User, {
    foreignKey: "userId",
    as:         "owner",
  });

  //  A server runs on one node
  Server.belongsTo(models.Node, {
    foreignKey: "nodeId",
    as:         "node",
  });

  //  A server has one primary allocation (port)
  Server.belongsTo(models.Allocation, {
    foreignKey: "allocationId",
    as:         "allocation",
  });
};

// ── Instance methods ──────────────────────────────────────────

//  Human readable status check helpers
Server.prototype.isRunning  = function () { return this.status === "running"; };
Server.prototype.isStopped  = function () { return this.status === "stopped"; };
Server.prototype.isInstalling = function () { return this.status === "installing"; };

//  Returns memory usage as a percentage of the limit
Server.prototype.memoryPercent = function () {
  if (!this.statsSnapshot?.memory) return 0;
  return Math.round((this.statsSnapshot.memory / this.memoryLimit) * 100);
};

module.exports = Server;