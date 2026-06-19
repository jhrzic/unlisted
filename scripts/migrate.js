#!/usr/bin/env node
/**
 * Apply SQL migrations from supabase/migrations/ in filename order.
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { getPoolConfig, getConnectionString } = require("../server/data/db-config");

if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch {
    // optional in production
  }
}

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

async function tableExists(pool, tableName) {
  const { rows } = await pool.query("SELECT to_regclass($1) AS reg", [`public.${tableName}`]);
  return Boolean(rows[0]?.reg);
}

async function main() {
  if (!getConnectionString()) {
    if (process.env.NODE_ENV === "production") {
      console.error("DATABASE_URL is required in production.");
      process.exit(1);
    }
    console.log("No DATABASE_URL set — skipping migrations (SQLite dev mode).");
    return;
  }

  const pool = new Pool(getPoolConfig());

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

      if (file.includes("initial") && (await tableExists(pool, "brokers"))) {
        console.log(`skip ${file} (schema already present)`);
        await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        continue;
      }

      if (file.includes("seed") && (await tableExists(pool, "brokers"))) {
        const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS c FROM brokers");
        if (countRows[0]?.c > 0) {
          console.log(`skip ${file} (${countRows[0].c} brokers already seeded)`);
          await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
          continue;
        }
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`apply ${file}`);
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    }

    const { rows: brokerCount } = await pool.query("SELECT COUNT(*)::int AS c FROM brokers");
    console.log(`Migrations complete. Brokers: ${brokerCount[0]?.c ?? 0}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
