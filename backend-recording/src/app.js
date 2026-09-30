require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/db');
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

app.use(async (_req, _res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

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

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/recordatorios', recordatoriosRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
