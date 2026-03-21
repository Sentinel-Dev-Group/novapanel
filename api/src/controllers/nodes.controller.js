// ============================================================
//  nodes.controller.js — Node management logic
// ============================================================

const { Node, Server, Allocation } = require("../models");
const AuditLog = require("../models/AuditLog");
const { isAdmin } = require("../middleware/rbac.middleware");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const { Op } = require("sequelize");

// ── Helpers ───────────────────────────────────────────────────

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

//  Generate a secure random daemon secret
function generateDaemonSecret() {
  return crypto.randomBytes(32).toString("hex");
}

//  Find a node by either numeric id or uuid
async function findNode(identifier) {
  const isNumeric = /^\d+$/.test(identifier);
  return Node.findOne({
    where: isNumeric
      ? { id: identifier }
      : { uuid: identifier },
  });
}

// ── List nodes ────────────────────────────────────────────────
//  GET /api/nodes
async function listNodes(req, res, next) {
  try {
    const admin = isAdmin(req.user);

    //  Admins see all nodes including offline and private ones
    //  Regular users only see public online nodes
    const where = admin
      ? {}
      : { isPublic: true, status: "online" };

    const nodes = await Node.findAll({
      where,
      attributes: admin
        ? undefined  // admins see all columns
        : [          // regular users see limited columns
            "uuid", "name", "location", "status",
            "memoryTotal", "diskTotal", "cpuTotal",
            "portRangeStart", "portRangeEnd", "usageSnapshot",
          ],
      order: [["name", "ASC"]],
    });

    return res.json({
      status: 200,
      count:  nodes.length,
      nodes,
    });

  } catch (err) {
    next(err);
  }
}

// ── Get single node ───────────────────────────────────────────
//  GET /api/nodes/:id
async function getNode(req, res, next) {
  try {
    const node = await findNode(req.params.id);

    if (!node) {
      return res.status(404).json({
        status:  404,
        message: "Node not found",
      });
    }

    //  Non admins cannot see private or offline nodes
    if (!isAdmin(req.user)) {
      if (!node.isPublic || node.status !== "online") {
        return res.status(404).json({
          status:  404,
          message: "Node not found",
        });
      }
    }

    //  Include server count for admins
    let extra = {};
    if (isAdmin(req.user)) {
      const serverCount = await Server.count({
        where: { nodeId: node.id },
      });
      extra.serverCount = serverCount;
      extra.daemonUrl   = node.daemonUrl();
      extra.allocatableMemory = node.allocatableMemory();
      extra.allocatableDisk   = node.allocatableDisk();
    }

    return res.json({
      status: 200,
      node:   { ...node.toJSON(), ...extra },
    });

  } catch (err) {
    next(err);
  }
}

// ── Get node stats ────────────────────────────────────────────
//  GET /api/nodes/:id/stats
async function getNodeStats(req, res, next) {
  try {
    const node = await findNode(req.params.id);

    if (!node) {
      return res.status(404).json({
        status:  404,
        message: "Node not found",
      });
    }

    //  Get allocation usage
    const totalAllocations = await Allocation.count({
      where: { nodeId: node.id },
    });

    const usedAllocations = await Allocation.count({
      where: { nodeId: node.id, serverId: { [Op.ne]: null } },
    });

    //  Get server counts by status
    const servers = await Server.findAll({
      where:      { nodeId: node.id },
      attributes: ["status"],
    });

    const serversByStatus = servers.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      status: 200,
      stats: {
        node: {
          id:     node.uuid,
          name:   node.name,
          status: node.status,
          lastHeartbeatAt: node.lastHeartbeatAt,
        },
        resources: node.usageSnapshot || {
          cpu:    0,
          memory: 0,
          disk:   0,
        },
        limits: {
          memory: node.allocatableMemory(),
          disk:   node.allocatableDisk(),
          cpu:    node.cpuTotal,
        },
        allocations: {
          total: totalAllocations,
          used:  usedAllocations,
          free:  totalAllocations - usedAllocations,
        },
        servers: {
          total:   servers.length,
          ...serversByStatus,
        },
      },
    });

  } catch (err) {
    next(err);
  }
}

// ── Create node ───────────────────────────────────────────────
//  POST /api/nodes
async function createNode(req, res, next) {
  try {
    const {
      name,
      description,
      location,
      fqdn,
      bindIp,
      daemonPort,
      useSsl,
      memoryTotal,
      diskTotal,
      cpuTotal,
      memoryOverallocate,
      diskOverallocate,
      portRangeStart,
      portRangeEnd,
      isPublic,
    } = req.body;

    // ── Validation ─────────────────────────────────────────
    if (!name || !location || !fqdn || !bindIp ||
        !memoryTotal || !diskTotal || !cpuTotal) {
      return res.status(400).json({
        status:  400,
        message: "name, location, fqdn, bindIp, memoryTotal, diskTotal and cpuTotal are required",
      });
    }

    //  Check for duplicate fqdn
    const existing = await Node.findOne({ where: { fqdn } });
    if (existing) {
      return res.status(409).json({
        status:  409,
        message: "A node with that FQDN already exists",
      });
    }

    //  Check port range is valid
    if (portRangeStart && portRangeEnd && portRangeStart >= portRangeEnd) {
      return res.status(400).json({
        status:  400,
        message: "portRangeStart must be less than portRangeEnd",
      });
    }

    // ── Create the node ────────────────────────────────────
    const daemonSecret = generateDaemonSecret();

    const node = await Node.create({
      uuid:               uuidv4(),
      name,
      description:        description || null,
      location,
      fqdn,
      bindIp,
      daemonPort:         daemonPort         || 8080,
      useSsl:             useSsl             ?? false,
      daemonSecret,
      memoryTotal,
      diskTotal,
      cpuTotal,
      memoryOverallocate: memoryOverallocate ?? 0,
      diskOverallocate:   diskOverallocate   ?? 0,
      portRangeStart:     portRangeStart     || 27015,
      portRangeEnd:       portRangeEnd       || 27100,
      isPublic:           isPublic           ?? true,
      status:             "offline",
    });

    // ── Auto create allocations for the port range ─────────
    const allocations = [];
    for (let port = node.portRangeStart; port <= node.portRangeEnd; port++) {
      allocations.push({
        nodeId: node.id,
        ip:     bindIp,
        port,
      });
    }
    await Allocation.bulkCreate(allocations, { ignoreDuplicates: true });

    // ── Audit log ──────────────────────────────────────────
    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "node.create",
      description:  `Node created: ${node.name} (${node.fqdn})`,
      resourceType: "node",
      resourceId:   node.uuid,
      ipAddress:    getIp(req),
      severity:     "critical",
    });

    //  Return the node with the daemon secret visible
    //  This is the ONLY time the secret is returned in plaintext
    return res.status(201).json({
      status:  201,
      message: "Node created successfully",
      node:    node.toJSON(),
      //  Tell the admin to save this — it won't be shown again
      daemonSecret,
      warning: "Save the daemonSecret now — it will not be shown again",
    });

  } catch (err) {
    next(err);
  }
}

// ── Update node ───────────────────────────────────────────────
//  PATCH /api/nodes/:id
async function updateNode(req, res, next) {
  try {
    const node = await findNode(req.params.id);

    if (!node) {
      return res.status(404).json({
        status:  404,
        message: "Node not found",
      });
    }

    //  Fields that are allowed to be updated
    const allowed = [
      "name", "description", "location",
      "daemonPort", "useSsl", "isPublic",
      "memoryTotal", "diskTotal", "cpuTotal",
      "memoryOverallocate", "diskOverallocate",
      "status",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status:  400,
        message: "No valid fields provided to update",
      });
    }

    await node.update(updates);

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "node.update",
      description:  `Node updated: ${node.name}`,
      resourceType: "node",
      resourceId:   node.uuid,
      metadata:     updates,
      ipAddress:    getIp(req),
      severity:     "info",
    });

    return res.json({
      status:  200,
      message: "Node updated successfully",
      node,
    });

  } catch (err) {
    next(err);
  }
}

// ── Delete node ───────────────────────────────────────────────
//  DELETE /api/nodes/:id
async function deleteNode(req, res, next) {
  try {
    const node = await findNode(req.params.id);

    if (!node) {
      return res.status(404).json({
        status:  404,
        message: "Node not found",
      });
    }

    //  Refuse to delete if there are servers on this node
    const serverCount = await Server.count({
      where: { nodeId: node.id },
    });

    if (serverCount > 0) {
      return res.status(409).json({
        status:  409,
        message: `Cannot delete node — it still has ${serverCount} server(s) on it. Move or delete them first.`,
      });
    }

    //  Delete all allocations for this node first
    await Allocation.destroy({ where: { nodeId: node.id } });

    //  Soft delete the node (paranoid: true)
    await node.destroy();

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "node.delete",
      description:  `Node deleted: ${node.name} (${node.fqdn})`,
      resourceType: "node",
      resourceId:   node.uuid,
      ipAddress:    getIp(req),
      severity:     "critical",
    });

    return res.json({
      status:  200,
      message: "Node deleted successfully",
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  getNodeStats,
};