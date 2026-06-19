const path = require("path");

if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch {
    // dotenv is only needed for local development
  }
}

const { getConnectionString } = require("./db-config");

function usePostgres() {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  return Boolean(getConnectionString());
}

let backend;

function getBackend() {
  if (!backend) {
    if (usePostgres()) {
      backend = require("./pg-store");
    } else {
      backend = require("./sqlite-store");
    }
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
