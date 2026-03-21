// ============================================================
//  env.js — Environment variable loader
//  Loads .env and validates all required variables are present
//  before the app starts. Crashes early with a clear message
//  rather than failing mysteriously later.
// ============================================================

require("dotenv").config();

// ── Required variables ────────────────────────────────────────
//  If any of these are missing the app will refuse to start
const REQUIRED = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASS",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("\n  ❌  Missing required environment variables:\n");
  missing.forEach((key) => console.error(`     - ${key}`));
  console.error("\n  ➡   Copy api/.env.example to api/.env and fill them in\n");
  process.exit(1);
}

// ── Export everything in one place ────────────────────────────
//  Import this file instead of using process.env directly
//  so you get autocomplete and a single source of truth
module.exports = {
  app: {
    name:     process.env.APP_NAME     || "NovaPanel",
    url:      process.env.APP_URL      || "http://localhost",
    port:     parseInt(process.env.APP_PORT) || 3000,
    env:      process.env.NODE_ENV     || "development",
    isDev:    process.env.NODE_ENV !== "production",
  },

  db: {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    name:     process.env.DB_NAME,
    user:     process.env.DB_USER,
    pass:     process.env.DB_PASS,
  },

  jwt: {
    secret:           process.env.JWT_SECRET,
    expiresIn:        process.env.JWT_EXPIRES_IN        || "15m",
    refreshSecret:    process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },

  mail: {
    host:   process.env.MAIL_HOST,
    port:   parseInt(process.env.MAIL_PORT) || 587,
    user:   process.env.MAIL_USER,
    pass:   process.env.MAIL_PASS,
    from:   process.env.MAIL_FROM || "noreply@novapanel.dev",
  },
};