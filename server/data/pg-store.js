const { Pool } = require("pg");
const { getPoolConfig, requireConnectionString } = require("./db-config");

let pool;

function getPool() {
  if (!pool) {
    const config = getPoolConfig();
    if (!config) {
      requireConnectionString();
    }
    pool = new Pool(config);
  }
  return pool;
}

function toPgParams(sql, params) {
  let index = 0;
  const values = [];
  const text = sql.replace(/\?/g, () => {
    index += 1;
    values.push(params[index - 1]);
    return `$${index}`;
  });
  return { text, values };
}

async function get(sql, params = []) {
  const { text, values } = toPgParams(sql, params);
  const result = await getPool().query(text, values);
  return result.rows[0];
}

async function all(sql, params = []) {
  const { text, values } = toPgParams(sql, params);
  const result = await getPool().query(text, values);
  return result.rows;
}

async function run(sql, params = []) {
  const { text, values } = toPgParams(sql, params);
  const result = await getPool().query(text, values);
  const row = result.rows[0] || {};
  return {
    changes: result.rowCount,
    lastInsertRowid: row.id ?? row.lastInsertRowid,
  };
}

async function exec(sql) {
  await getPool().query(sql);
}

async function transaction(fn) {
  const client = await getPool().connect();
  const tx = {
    async get(sql, params = []) {
      const { text, values } = toPgParams(sql, params);
      const result = await client.query(text, values);
      return result.rows[0];
    },
    async all(sql, params = []) {
      const { text, values } = toPgParams(sql, params);
      const result = await client.query(text, values);
      return result.rows;
    },
    async run(sql, params = []) {
      const { text, values } = toPgParams(sql, params);
      const result = await client.query(text, values);
      const row = result.rows[0] || {};
      return {
        changes: result.rowCount,
        lastInsertRowid: row.id ?? row.lastInsertRowid,
      };
    },
  };

  try {
    await client.query("BEGIN");
    await fn(tx);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { get, all, run, exec, transaction };
