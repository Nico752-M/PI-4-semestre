// backend/src/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para la conexión SSL de Neon
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error conectando a la base de datos Neon:', err.stack);
  }
  console.log('Conexión exitosa a la base de datos Neon en PostgreSQL');
  release();
});

module.exports = pool;