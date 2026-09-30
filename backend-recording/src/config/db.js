const mysql = require('mysql2/promise');
require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  port: Number(process.env.MYSQL_ADDON_PORT) || 3306,
  waitForConnections: true,
  // En Vercel cada invocación es efímera: un pool grande agota conexiones de Clever Cloud.
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 1,
  maxIdle: 1,
  idleTimeout: 10000,
  connectTimeout: 15000,
  enableKeepAlive: true,
  namedPlaceholders: true,
  timezone: 'Z',
  dateStrings: true,
});

async function ensureSchema(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id_categoria INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL,
      color_hex VARCHAR(7) DEFAULT '#3B82F6',
      id_usuario INT NOT NULL,
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS recordatorios (
      id_recordatorio INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      descripcion TEXT,
      fecha_vencimiento DATETIME NOT NULL,
      prioridad ENUM('Baja', 'Media', 'Alta') DEFAULT 'Media',
      estado ENUM('Pendiente', 'En Proceso', 'Completada') DEFAULT 'Pendiente',
      id_usuario INT NOT NULL,
      id_categoria INT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL
    )
  `);
}

async function initDatabase() {
  requireEnv('MYSQL_ADDON_HOST');
  requireEnv('MYSQL_ADDON_USER');
  requireEnv('MYSQL_ADDON_PASSWORD');
  requireEnv('MYSQL_ADDON_DB');

  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');

    // Solo crear tablas si aún no existen (evita locks en cada cold start).
    const [tables] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.tables
       WHERE table_schema = :db
         AND table_name IN ('usuarios', 'categorias', 'recordatorios')`,
      { db: process.env.MYSQL_ADDON_DB }
    );

    if (Number(tables[0].total) < 3) {
      await ensureSchema(connection);
    }

    console.log('Base de datos lista.');
  } finally {
    connection.release();
  }
}

/** Formatea Date o string ISO a DATETIME MySQL (UTC). */
function toMysqlDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { pool, initDatabase, toMysqlDateTime };
