const express = require('express');
const { sendPendingReminderEmails } = require('../services/notifyReminders');
const { mailConfigured } = require('../services/mail');

const router = express.Router();

function cronAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const querySecret = req.query.secret;
  return bearer === secret || querySecret === secret;
}

// Vercel Cron / llamado manual: envía correos de recordatorios próximos.
router.get('/notify-emails', async (req, res) => {
  if (!cronAuthorized(req)) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const result = await sendPendingReminderEmails({ hours: 24 });
    return res.json({
      message: 'Proceso de notificaciones por correo finalizado',
      mailConfigured: mailConfigured(),
      ...result,
    });
  } catch (error) {
    console.error('Error en cron notify-emails:', error);
    return res.status(500).json({ message: 'Error al notificar por correo', detail: error.message });
  }
});

module.exports = router;
