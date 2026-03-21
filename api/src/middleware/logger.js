// ============================================================
//  logger.js — HTTP request logger middleware
//  Logs every incoming request with method, path, status
//  and how long it took to respond.
// ============================================================

const { app: cfg } = require("../config/env");

// ── Colour map for HTTP methods ───────────────────────────────
const METHOD_COLOURS = {
  GET:    "\x1b[32m",  // green
  POST:   "\x1b[34m",  // blue
  PUT:    "\x1b[33m",  // yellow
  PATCH:  "\x1b[33m",  // yellow
  DELETE: "\x1b[31m",  // red
};

// ── Colour map for status codes ───────────────────────────────
function statusColour(status) {
  if (status >= 500) return "\x1b[31m"; // red
  if (status >= 400) return "\x1b[33m"; // yellow
  if (status >= 300) return "\x1b[36m"; // cyan
  return "\x1b[32m";                    // green
}

const RESET = "\x1b[0m";
const DIM   = "\x1b[2m";

// ── Middleware function ───────────────────────────────────────
function logger(req, res, next) {
  // Skip logging in test environment
  if (cfg.env === "test") return next();

  const start = Date.now();

  // Run after the response is sent
  res.on("finish", () => {
    const ms      = Date.now() - start;
    const method  = req.method;
    const path    = req.originalUrl;
    const status  = res.statusCode;
    const time    = new Date().toISOString();

    const methodCol = METHOD_COLOURS[method] || "\x1b[37m";
    const statusCol = statusColour(status);

    console.log(
      `${DIM}[${time}]${RESET} ` +
      `${methodCol}${method.padEnd(6)}${RESET} ` +
      `${path.padEnd(40)} ` +
      `${statusCol}${status}${RESET} ` +
      `${DIM}${ms}ms${RESET}`
    );
  });

  next();
}

module.exports = logger;