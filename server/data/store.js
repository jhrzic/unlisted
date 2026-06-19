const path = require("path");

if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch {
    // dotenv is only needed for local development
  }
}

function isNetlifyRuntime() {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
}

function usePostgres() {
  if (process.env.NETLIFY_DB_URL || process.env.DATABASE_URL) return true;
  if (isNetlifyRuntime()) return true;
  return false;
}

let backend;

function getBackend() {
  if (!backend) {
    backend = usePostgres() ? require("./pg-store") : require("./sqlite-store");
  }
  return backend;
}

const store = {
  usePostgres,
  async get(sql, params = []) {
    return getBackend().get(sql, params);
  },
  async all(sql, params = []) {
    return getBackend().all(sql, params);
  },
  async run(sql, params = []) {
    return getBackend().run(sql, params);
  },
  async exec(sql) {
    return getBackend().exec(sql);
  },
  async transaction(fn) {
    return getBackend().transaction(fn);
  },
};

if (!usePostgres()) {
  require("./sqlite-store").initSchema();
}

module.exports = store;
