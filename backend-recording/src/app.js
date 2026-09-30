require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, mysqlEnvStatus } = require('./config/db');
const authRoutes = require('./routes/auth');
const categoriasRoutes = require('./routes/categorias');
const recordatoriosRoutes = require('./routes/recordatorios');

const app = express();

const defaultOrigins = [
  'http://localhost:5173',
  'https://recording-eight.vercel.app',
];

const fromEnv = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...fromEnv])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'recording-api',
    endpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/categorias',
      'GET /api/recordatorios',
    ],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'recording-api' });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await initDatabase();
    return res.json({ status: 'ok', database: 'connected', env: mysqlEnvStatus() });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message,
      code: error.code || undefined,
      env: mysqlEnvStatus(),
    });
  }
});

let dbReady = null;
function ensureDatabase() {
  if (!dbReady) {
    dbReady = initDatabase().catch((error) => {
      dbReady = null;
      throw error;
    });
  }
  return dbReady;
}

app.use(async (_req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error('Error de base de datos:', error.message, error.code);
    return res.status(503).json({
      message:
        'No se pudo conectar a la base de datos. Revisa las variables MYSQL_ADDON_* en Vercel.',
      detail: error.message,
      code: error.code || undefined,
      env: mysqlEnvStatus(),
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/recordatorios', recordatoriosRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    message: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
