const { Pool } = require('pg');
const config = require('./config');

const pool = config.databaseUrl || process.env.PGHOST
  ? new Pool({
      ...(config.databaseUrl ? { connectionString: config.databaseUrl } : {}),
      max: config.databasePoolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

module.exports = {
  pool,
  query: (...args) => {
    if (!pool) {
      throw new Error('PostgreSQL is not configured. Set DATABASE_URL before running migrations or data access endpoints.');
    }
    return pool.query(...args);
  },
};
