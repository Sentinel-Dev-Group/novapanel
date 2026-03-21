// ============================================================
//  database.js — MariaDB connection via Sequelize
//  Handles the connection pool, tests the connection on
//  startup, and exports the instance for use in models.
// ============================================================

const { Sequelize } = require("sequelize");
const { db, app }   = require("./env");

// ── Create the Sequelize instance ─────────────────────────────
const sequelize = new Sequelize(db.name, db.user, db.pass, {
  host:    db.host,
  port:    db.port,
  dialect: "mariadb",

  // ── Connection pool ────────────────────────────────────────
  //  Reuses connections instead of opening a new one per query
  pool: {
    max:     10,   // maximum connections open at once
    min:     2,    // keep at least 2 open when idle
    acquire: 30000, // ms to wait before throwing a timeout error
    idle:    10000, // ms a connection can sit idle before release
  },

  // ── MariaDB specific options ───────────────────────────────
  dialectOptions: {
    timezone: "Z", // store all dates as UTC
  },

  // ── Logging ────────────────────────────────────────────────
  //  In dev: logs every SQL query to the console
  //  In production: turns off to keep logs clean
  logging: app.isDev
    ? (sql) => console.log(`\x1b[2m[SQL] ${sql}\x1b[0m`)
    : false,

  // ── Model defaults ─────────────────────────────────────────
  define: {
    underscored:   true,  // use snake_case columns (user_id not userId)
    timestamps:    true,  // auto add createdAt / updatedAt to every table
    freezeTableName: false, // auto pluralise table names (User → users)
  },
});

// ── Test the connection ────────────────────────────────────────
//  Called once when the app starts — fails fast if DB is down
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("  ✅  MariaDB connected successfully");

    // In development: auto-sync models to the database
    // alter:true updates columns without dropping the table
    // NEVER use force:true in production — it drops everything
    if (app.isDev) {
      await sequelize.sync({ alter: false });
      console.log("  ✅  Database models synced");
    }
  } catch (error) {
    console.error("  ❌  MariaDB connection failed:", error.message);
    console.error("  ➡   Check your DB_* variables in api/.env");
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };