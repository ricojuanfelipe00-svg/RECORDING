const mysql = require('mysql2/promise');
require('dotenv').config();

function readEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : value;
}

function missingMysqlEnv() {
  return ['MYSQL_ADDON_HOST', 'MYSQL_ADDON_USER', 'MYSQL_ADDON_PASSWORD', 'MYSQL_ADDON_DB'].filter(
    (name) => !readEnv(name)
  );
}

function mysqlEnvStatus() {
  return {
    MYSQL_ADDON_HOST: Boolean(readEnv('MYSQL_ADDON_HOST')),
    MYSQL_ADDON_USER: Boolean(readEnv('MYSQL_ADDON_USER')),
    MYSQL_ADDON_PASSWORD: Boolean(readEnv('MYSQL_ADDON_PASSWORD')),
    MYSQL_ADDON_DB: Boolean(readEnv('MYSQL_ADDON_DB')),
    MYSQL_ADDON_PORT: Boolean(readEnv('MYSQL_ADDON_PORT')),
  };
}

function getConnectionConfig() {
  const missing = missingMysqlEnv();
  if (missing.length) {
    throw new Error(`Faltan variables en Vercel: ${missing.join(', ')}`);
  }

  // Clever Cloud: máximo ~5 conexiones. En Vercel no usamos pool persistente.
  const sslDisabled = readEnv('MYSQL_SSL') === '0';

  return {
    host: readEnv('MYSQL_ADDON_HOST'),
    user: readEnv('MYSQL_ADDON_USER'),
    password: readEnv('MYSQL_ADDON_PASSWORD'),
    database: readEnv('MYSQL_ADDON_DB'),
    port: Number(readEnv('MYSQL_ADDON_PORT')) || 3306,
    connectTimeout: 15000,
    namedPlaceholders: true,
    timezone: 'Z',
    dateStrings: true,
    ssl: sslDisabled ? undefined : { rejectUnauthorized: false },
  };
}

async function withConnection(fn) {
  const connection = await mysql.createConnection(getConnectionConfig());
  try {
    return await fn(connection);
  } finally {
    try {
      await connection.end();
    } catch {
      // ignore close errors
    }
  }
}

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
      notificado_email TINYINT(1) NOT NULL DEFAULT 0,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL
    )
  `);
}

async function pingWithRetry(retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await withConnection((connection) => connection.query('SELECT 1 AS ok'));
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function initDatabase() {
  await pingWithRetry(2);

  if (readEnv('AUTO_MIGRATE') === '1') {
    await withConnection((connection) => ensureSchema(connection));
  }

  // Columna para no reenviar el mismo recordatorio por correo.
  try {
    await withConnection(async (connection) => {
      await connection.query(`
        ALTER TABLE recordatorios
        ADD COLUMN notificado_email TINYINT(1) NOT NULL DEFAULT 0
      `);
    });
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.warn('No se pudo asegurar columna notificado_email:', error.message);
    }
  }

  console.log('Base de datos lista.');
}

/** Formatea Date o string ISO a DATETIME MySQL (UTC). */
function toMysqlDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Compatible con `const { pool } = require(...)` — cada query abre y cierra conexión.
const pool = {
  query: (...args) => withConnection((connection) => connection.query(...args)),
  execute: (...args) => withConnection((connection) => connection.execute(...args)),
  getConnection: async () => {
    const connection = await mysql.createConnection(getConnectionConfig());
    const originalRelease = connection.release?.bind(connection);
    connection.release = async () => {
      if (originalRelease) {
        try {
          originalRelease();
        } catch {
          // ignore
        }
      }
      await connection.end().catch(() => {});
    };
    return connection;
  },
};

module.exports = {
  pool,
  withConnection,
  initDatabase,
  toMysqlDateTime,
  mysqlEnvStatus,
};
