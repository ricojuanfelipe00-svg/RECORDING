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

function createPool() {
  const missing = missingMysqlEnv();
  if (missing.length) {
    throw new Error(`Faltan variables en Vercel: ${missing.join(', ')}`);
  }

  // Clever Cloud suele exigir SSL desde hosts externos (Vercel).
  const sslDisabled = readEnv('MYSQL_SSL') === '0';

  return mysql.createPool({
    host: readEnv('MYSQL_ADDON_HOST'),
    user: readEnv('MYSQL_ADDON_USER'),
    password: readEnv('MYSQL_ADDON_PASSWORD'),
    database: readEnv('MYSQL_ADDON_DB'),
    port: Number(readEnv('MYSQL_ADDON_PORT')) || 3306,
    waitForConnections: true,
    connectionLimit: Number(readEnv('MYSQL_CONNECTION_LIMIT')) || 1,
    queueTimeout: 10000,
    connectTimeout: 20000,
    enableKeepAlive: true,
    namedPlaceholders: true,
    timezone: 'Z',
    dateStrings: true,
    ssl: sslDisabled ? undefined : { rejectUnauthorized: false },
  });
}

let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
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
      await getPool().query('SELECT 1 AS ok');
      return;
    } catch (error) {
      lastError = error;
      // Recrear pool si la conexión quedó en mal estado.
      poolInstance = null;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function initDatabase() {
  await pingWithRetry(2);

  // Las tablas ya deberían existir; solo crearlas si se pide explícitamente.
  if (readEnv('AUTO_MIGRATE') === '1') {
    const connection = await getPool().getConnection();
    try {
      await ensureSchema(connection);
    } finally {
      connection.release();
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

// Proxy para que `const { pool } = require(...)` siga funcionando con lazy-connect.
const pool = {
  query: (...args) => getPool().query(...args),
  execute: (...args) => getPool().execute(...args),
  getConnection: (...args) => getPool().getConnection(...args),
  end: (...args) => (poolInstance ? poolInstance.end(...args) : Promise.resolve()),
};

module.exports = {
  pool,
  getPool,
  initDatabase,
  toMysqlDateTime,
  mysqlEnvStatus,
};
