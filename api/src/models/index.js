// ============================================================
//  models/index.js — Model loader & association wirer
//  Requires all models in the right order and sets up
//  the relationships between them.
//  Import this file anywhere you need access to models:
//  const { User, Server, Node } = require("../models");
// ============================================================

const User       = require("./User");
const Node       = require("./Node");
const Server     = require("./Server");
const Allocation = require("./Allocation");
const AuditLog   = require("./AuditLog");

const models = { User, Node, Server, Allocation, AuditLog };

// ── Wire up associations ──────────────────────────────────────
//  Calls the associate() function on each model that has one
//  Keeps all relationship definitions inside each model file
Object.values(models)
  .filter((model) => typeof model.associate === "function")
  .forEach((model) => model.associate(models));

// ── Relationships not defined in associate() ─────────────────
//  These are the reverse/complementary sides of relationships
//  defined in the model files above

//  A user owns many servers
User.hasMany(Server, {
  foreignKey: "userId",
  as:         "servers",
});

//  A node hosts many servers
Node.hasMany(Server, {
  foreignKey: "nodeId",
  as:         "servers",
});

//  A node has many allocations (its full port pool)
Node.hasMany(Allocation, {
  foreignKey: "nodeId",
  as:         "allocations",
});

//  A server can have many allocations (extra ports)
//  e.g. a game port + a query port + a RCON port
Server.hasMany(Allocation, {
  foreignKey: "serverId",
  as:         "allocations",
});

// ── Export all models from one place ──────────────────────────
module.exports = models;