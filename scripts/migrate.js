#!/usr/bin/env node
/**
 * Apply SQL migrations from supabase/migrations/ in filename order.
 * Uses DATABASE_URL (Supabase connection string — use the pooler URI in production).
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch {
    // optional in production
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.log("No DATABASE_URL set — skipping migrations (SQLite dev mode).");
  process.exit(0);
}

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await pool.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [file]
      );
      if (rows.length) {
        console.log(`skip ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`apply ${file}`);
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    }

    console.log("Migrations complete.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
