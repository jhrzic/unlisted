const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "unlisted.db");
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    state TEXT,
    plan TEXT DEFAULT 'standard',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profile_identifiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('email','phone','address')),
    value TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS brokers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    opt_out_method TEXT NOT NULL CHECK(opt_out_method IN ('form','email','call','drop')),
    opt_out_url TEXT,
    opt_out_email TEXT,
    process_notes TEXT,
    avg_response_days INTEGER,
    reappears_days INTEGER,
    source_url TEXT,
    last_verified TEXT
  );

  CREATE TABLE IF NOT EXISTS removal_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_id INTEGER NOT NULL REFERENCES brokers(id),
    status TEXT NOT NULL DEFAULT 'not_started'
      CHECK(status IN ('not_started','request_sent','pending','verified_removed','reappeared')),
    sent_at TEXT,
    last_checked_at TEXT,
    notes TEXT,
    UNIQUE(user_id, broker_id)
  );

  CREATE TABLE IF NOT EXISTS breach_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_checked TEXT NOT NULL,
    breach_count INTEGER NOT NULL,
    breach_names TEXT,
    checked_at TEXT DEFAULT (datetime('now'))
  );
`;

function initSchema() {
  getDb().exec(SCHEMA);
}

function get(sql, params = []) {
  return getDb().prepare(sql).get(...params);
}

function all(sql, params = []) {
  return getDb().prepare(sql).all(...params);
}

function run(sql, params = []) {
  const stmt = getDb().prepare(sql);
  if (/RETURNING/i.test(sql)) {
    const row = stmt.get(...params);
    return { changes: 1, lastInsertRowid: row?.id };
  }
  const result = stmt.run(...params);
  return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
}

function exec(sql) {
  getDb().exec(sql);
}

async function transaction(fn) {
  const conn = getDb();
  conn.exec("BEGIN");
  const tx = {
    get: (sql, params) => Promise.resolve(get(sql, params)),
    all: (sql, params) => Promise.resolve(all(sql, params)),
    run: (sql, params) => Promise.resolve(run(sql, params)),
  };
  try {
    await fn(tx);
    conn.exec("COMMIT");
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}

module.exports = { initSchema, get, all, run, exec, transaction };
