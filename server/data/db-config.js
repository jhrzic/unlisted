/**
 * Postgres connection settings for Supabase / Render Postgres.
 * Use the Session pooler URI (port 5432) for Supabase on Node hosts like Render.
 */
function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.RENDER_DATABASE_URL
  );
}

function isRenderInternalPostgres(url) {
  return /@dpg-[a-z0-9-]+\//i.test(url);
}

function normalizeConnectionString(url) {
  if (!url) return url;

  let normalized = url;
  if (!normalized.includes("sslmode=")) {
    normalized += normalized.includes("?") ? "&" : "?";
    normalized += isRenderInternalPostgres(normalized) ? "sslmode=disable" : "sslmode=require";
  }

  // Transaction pooler (6543) needs pgbouncer mode for node-pg.
  if (normalized.includes(":6543") && !normalized.includes("pgbouncer=")) {
    normalized += "&pgbouncer=true";
  }

  return normalized;
}

function getPoolConfig() {
  const raw = getConnectionString();
  const connectionString = normalizeConnectionString(raw);
  if (!connectionString) {
    return null;
  }

  const sslDisabled =
    process.env.PGSSLMODE === "disable" ||
    connectionString.includes("sslmode=disable") ||
    isRenderInternalPostgres(raw || connectionString);

  return {
    connectionString,
    ssl: sslDisabled ? false : { rejectUnauthorized: false },
    max: Number(process.env.PGPOOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  };
}

function requireConnectionString() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Session pooler URI in Render environment variables."
    );
  }
  return connectionString;
}

module.exports = {
  getConnectionString,
  normalizeConnectionString,
  getPoolConfig,
  requireConnectionString,
};
