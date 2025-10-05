const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'catbit',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',

  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500,

  allowExitOnIdle: true,
  statement_timeout: 30000,
});

pool.on('connect', (client) => {
  client.query('SET timezone = "UTC"');
});

pool.on('error', (err, client) => {
  console.error('Unexpected database pool error:', err);
});

process.on('SIGINT', async () => {
  console.log('Closing database connection pool...');
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection pool...');
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
});

module.exports = pool;