require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/db');
const authRoutes = require('./routes/auth');
const categoriasRoutes = require('./routes/categorias');
const recordatoriosRoutes = require('./routes/recordatorios');

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
