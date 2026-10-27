// backend/src/db.js
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('Configura DATABASE_URL con la cadena de conexión de Neon.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false // la conexión SSL de Neon
  }
});

module.exports = pool;