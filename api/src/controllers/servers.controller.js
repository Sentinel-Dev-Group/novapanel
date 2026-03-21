// ============================================================
//  servers.controller.js — Game server management logic
// ============================================================

const { Server, Node, User, Allocation, AuditLog } = require("../models");
const { isAdmin } = require("../middleware/rbac.middleware");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

// ── Helpers ───────────────────────────────────────────────────

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

//  Generate a short 8 character ID for the server
//  e.g. "a1b2c3d4"
function generateShortId() {
  return Math.random().toString(36).substring(2, 10);
}

//  Find a server by numeric id or uuid
//  Also checks ownership unless the user is an admin
async function findServer(identifier, userId, admin) {
  const isNumeric = /^\d+$/.test(identifier);

  const where = isNumeric
    ? { id: identifier }
    : { uuid: identifier };

  //  Non admins can only find their own servers
  if (!admin) where.userId = userId;

  return Server.findOne({
    where,
    include: [
      { model: Node,       as: "node"       },
      { model: Allocation, as: "allocation" },
      { model: User,       as: "owner",
        attributes: ["id", "uuid", "username", "email"] },
    ],
  });
}

// ── List servers ──────────────────────────────────────────────
//  GET /api/servers
async function listServers(req, res, next) {
  try {
    const admin = isAdmin(req.user);

    //  Admins see all servers, users see only their own
    const where = admin ? {} : { userId: req.user.id };

    const servers = await Server.findAll({
      where,
      include: [
        { model: Node,       as: "node",
          attributes: ["uuid", "name", "location", "status"] },
        { model: Allocation, as: "allocation",
          attributes: ["ip", "port"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      status: 200,
      count:  servers.length,
      servers,
    });

  } catch (err) {
    next(err);
  }
}

// ── Get single server ─────────────────────────────────────────
//  GET /api/servers/:id
async function getServer(req, res, next) {
  try {
    const admin  = isAdmin(req.user);
    const server = await findServer(req.params.id, req.user.id, admin);

    if (!server) {
      return res.status(404).json({
        status:  404,
        message: "Server not found",
      });
    }

    //  Suspended servers are hidden from regular users
    if (server.isSuspended && !admin) {
      return res.status(403).json({
        status:  403,
        message: "This server has been suspended — contact support",
      });
    }

    return res.json({
      status: 200,
      server,
    });

  } catch (err) {
    next(err);
  }
}

// ── Get server stats ──────────────────────────────────────────
//  GET /api/servers/:id/stats
async function getServerStats(req, res, next) {
  try {
    const admin  = isAdmin(req.user);
    const server = await findServer(req.params.id, req.user.id, admin);

    if (!server) {
      return res.status(404).json({
        status:  404,
        message: "Server not found",
      });
    }

    return res.json({
      status: 200,
      stats: {
        server: {
          id:      server.uuid,
          name:    server.name,
          status:  server.status,
        },
        resources: server.statsSnapshot || {
          cpu:         0,
          memory:      0,
          memoryLimit: server.memoryLimit,
          disk:        0,
          players:     0,
        },
        uptime: server.lastStartedAt
          ? Math.floor((Date.now() - new Date(server.lastStartedAt)) / 1000)
          : 0,
        memoryPercent: server.memoryPercent(),
      },
    });

  } catch (err) {
    next(err);
  }
}

// ── Create server ─────────────────────────────────────────────
//  POST /api/servers
async function createServer(req, res, next) {
  try {
    const {
      name,
      description,
      userId,
      nodeId,
      dockerImage,
      gameType,
      memoryLimit,
      diskLimit,
      cpuLimit,
      swapLimit,
      startCommand,
      environment,
      autoRestart,
      autoStart,
      backupLimit,
    } = req.body;

    // ── Validation ─────────────────────────────────────────
    if (!name || !userId || !nodeId || !dockerImage ||
        !gameType || !memoryLimit || !diskLimit || !startCommand) {
      return res.status(400).json({
        status:  400,
        message: "name, userId, nodeId, dockerImage, gameType, memoryLimit, diskLimit and startCommand are required",
      });
    }

    // ── Check user exists ──────────────────────────────────
    const owner = await User.findByPk(userId);
    if (!owner) {
      return res.status(404).json({
        status:  404,
        message: "User not found",
      });
    }

    // ── Check node exists and is online ───────────────────
    const node = await Node.findByPk(nodeId);
    if (!node) {
      return res.status(404).json({
        status:  404,
        message: "Node not found",
      });
    }

    if (node.status === "draining") {
      return res.status(409).json({
        status:  409,
        message: "This node is draining — no new servers can be created on it",
      });
    }

    // ── Check node has enough resources ───────────────────
    const existingServers = await Server.findAll({
      where: { nodeId: node.id },
    });

    const usedMemory = existingServers.reduce(
      (sum, s) => sum + s.memoryLimit, 0
    );
    const usedDisk = existingServers.reduce(
      (sum, s) => sum + s.diskLimit, 0
    );

    if (usedMemory + memoryLimit > node.allocatableMemory()) {
      return res.status(409).json({
        status:  409,
        message: `Not enough memory on this node. Available: ${node.allocatableMemory() - usedMemory}MB`,
      });
    }

    if (usedDisk + diskLimit > node.allocatableDisk()) {
      return res.status(409).json({
        status:  409,
        message: `Not enough disk on this node. Available: ${node.allocatableDisk() - usedDisk}MB`,
      });
    }

    // ── Find a free allocation (port) ──────────────────────
    const allocation = await Allocation.findOne({
      where: {
        nodeId,
        serverId:   null,
        isReserved: false,
      },
      order: [["port", "ASC"]],
    });

    if (!allocation) {
      return res.status(409).json({
        status:  409,
        message: "No free ports available on this node",
      });
    }

    // ── Create the server ──────────────────────────────────
    const server = await Server.create({
      uuid:         uuidv4(),
      shortId:      generateShortId(),
      name,
      description:  description  || null,
      userId,
      nodeId,
      dockerImage,
      gameType,
      memoryLimit,
      diskLimit,
      cpuLimit:     cpuLimit     || 100,
      swapLimit:    swapLimit    || 0,
      processLimit: 64,
      allocationId: allocation.id,
      startCommand,
      environment:  environment  || {},
      autoRestart:  autoRestart  ?? true,
      autoStart:    autoStart    ?? false,
      backupLimit:  backupLimit  || 3,
      status:       "installing",
    });

    //  Assign the allocation to this server
    await allocation.update({ serverId: server.id, isPrimary: true });

    // ── Audit log ──────────────────────────────────────────
    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "server.create",
      description:  `Server created: ${server.name} (${server.shortId}) on node ${node.name}`,
      resourceType: "server",
      resourceId:   server.uuid,
      ipAddress:    getIp(req),
      severity:     "info",
    });

    //  Reload with associations
    const created = await findServer(server.id, req.user.id, true);

    return res.status(201).json({
      status:  201,
      message: "Server created successfully",
      server:  created,
    });

  } catch (err) {
    next(err);
  }
}

// ── Update server ─────────────────────────────────────────────
//  PATCH /api/servers/:id
async function updateServer(req, res, next) {
  try {
    const server = await findServer(req.params.id, req.user.id, true);

    if (!server) {
      return res.status(404).json({
        status:  404,
        message: "Server not found",
      });
    }

    const allowed = [
      "name", "description", "dockerImage",
      "memoryLimit", "diskLimit", "cpuLimit", "swapLimit",
      "startCommand", "environment",
      "autoRestart", "autoStart", "backupLimit",
      "isSuspended", "suspendReason",
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

    await server.update(updates);

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "server.update",
      description:  `Server updated: ${server.name}`,
      resourceType: "server",
      resourceId:   server.uuid,
      metadata:     updates,
      ipAddress:    getIp(req),
      severity:     "info",
    });

    return res.json({
      status:  200,
      message: "Server updated successfully",
      server,
    });

  } catch (err) {
    next(err);
  }
}

// ── Delete server ─────────────────────────────────────────────
//  DELETE /api/servers/:id
async function deleteServer(req, res, next) {
  try {
    const server = await findServer(req.params.id, req.user.id, true);

    if (!server) {
      return res.status(404).json({
        status:  404,
        message: "Server not found",
      });
    }

    //  Cannot delete a running server
    if (server.status === "running" || server.status === "starting") {
      return res.status(409).json({
        status:  409,
        message: "Stop the server before deleting it",
      });
    }

    //  Free up the allocation
    await Allocation.update(
      { serverId: null, isPrimary: false },
      { where: { serverId: server.id } }
    );

    await server.destroy();

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "server.delete",
      description:  `Server deleted: ${server.name} (${server.shortId})`,
      resourceType: "server",
      resourceId:   server.uuid,
      ipAddress:    getIp(req),
      severity:     "critical",
    });

    return res.json({
      status:  200,
      message: "Server deleted successfully",
    });

  } catch (err) {
    next(err);
  }
}

// ── Start server ──────────────────────────────────────────────
//  POST /api/servers/:id/start
async function startServer(req, res, next) {
  try {
    const admin  = isAdmin(req.user);
    const server = await findServer(req.params.id, req.user.id, admin);

    if (!server) {
      return res.status(404).json({
        status:  404,
        message: "Server not found",
      });
    }

    if (server.isSuspended) {
      return res.status(403).json({
        status:  403,
        message: "Server is suspended and cannot be started",
      });
    }

    if (server.status === "running" || server.status === "starting") {
      return res.status(409).json({
        status:  409,
        message: "Server is already running",
      });
    }

    //  Update status — daemon will pick this up
    await server.update({
      status:        "starting",
      lastStartedAt: new Date(),
    });

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "server.start",
      description:  `Server started: ${server.name}`,
      resourceType: "server",
      resourceId:   server.uuid,
      ipAddress:    getIp(req),
      severity:     "info",
    });

    //  Emit socket event so the frontend updates instantly
    req.app.get("io").emit(`server:${server.uuid}:status`, {
      status: "starting",
    });

    return res.json({
      status:  200,
      message: "Server is starting",
      server:  { uuid: server.uuid, status: "starting" },
    });

  } catch (err) {
    next(err);
  }
}

// ── Stop server ───────────────────────────────────────────────
//  POST /api/servers/:id/stop
async function stopServer(req, res, next) {
  try {
    const admin  = isAdmin(req.user);
    const server = await findServer(req.params.id, req.user.id, admin);

    if (!server) {
      return res.status(404).json({
        status:  404,
        message: "Server not found",
      });
    }

    if (server.status === "stopped" || server.status === "stopping") {
      return res.status(409).json({
        status:  409,
        message: "Server is already stopped or stopping",
      });
    }

    await server.update({
      status:        "stopping",
      lastStoppedAt: new Date(),
    });

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "server.stop",
      description:  `Server stopped: ${server.name}`,
      resourceType: "server",
      resourceId:   server.uuid,
      ipAddress:    getIp(req),
      severity:     "info",
    });

    req.app.get("io").emit(`server:${server.uuid}:status`, {
      status: "stopping",
    });

    return res.json({
      status:  200,
      message: "Server is stopping",
      server:  { uuid: server.uuid, status: "stopping" },
    });

  } catch (err) {
    next(err);
  }
}

// ── Restart server ────────────────────────────────────────────
//  POST /api/servers/:id/restart
async function restartServer(req, res, next) {
  try {
    const admin  = isAdmin(req.user);
    const server = await findServer(req.params.id, req.user.id, admin);

    if (!server) {
      return res.status(404).json({
        status:  404,
        message: "Server not found",
      });
    }

    if (server.isSuspended) {
      return res.status(403).json({
        status:  403,
        message: "Server is suspended and cannot be restarted",
      });
    }

    await server.update({ status: "starting" });

    await AuditLog.record({
      userId:       req.user.id,
      username:     req.user.username,
      action:       "server.restart",
      description:  `Server restarted: ${server.name}`,
      resourceType: "server",
      resourceId:   server.uuid,
      ipAddress:    getIp(req),
      severity:     "info",
    });

    req.app.get("io").emit(`server:${server.uuid}:status`, {
      status: "starting",
    });

    return res.json({
      status:  200,
      message: "Server is restarting",
      server:  { uuid: server.uuid, status: "starting" },
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  listServers,
  getServer,
  createServer,
  updateServer,
  deleteServer,
  startServer,
  stopServer,
  restartServer,
  getServerStats,
};
