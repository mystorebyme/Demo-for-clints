const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 20 });
pool.on('error', (err) => console.error('[pg] idle client error', err.message));

module.exports = { pool };
