const { pool } = require('../config/db');
const { mailConfigured, sendReminderEmail } = require('./mail');

async function ensureNotificadoEmailColumn() {
  try {
    await pool.query(`
      ALTER TABLE recordatorios
      ADD COLUMN notificado_email TINYINT(1) NOT NULL DEFAULT 0
    `);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error;
  }
}

async function fetchPendingEmailReminders({ idUsuario = null, hours = 24 } = {}) {
  const params = { hours: Number(hours) || 24 };
  let sql = `
    SELECT r.id_recordatorio, r.titulo, r.descripcion, r.fecha_vencimiento,
           r.prioridad, r.estado, r.id_usuario, r.id_categoria,
           c.nombre AS categoria_nombre,
           u.nombre AS usuario_nombre, u.email AS usuario_email
    FROM recordatorios r
    INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
    LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
    WHERE r.estado <> 'Completada'
      AND COALESCE(r.notificado_email, 0) = 0
      AND r.fecha_vencimiento BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL :hours HOUR)
  `;

  if (idUsuario) {
    sql += ' AND r.id_usuario = :id_usuario';
    params.id_usuario = idUsuario;
  }

  sql += ' ORDER BY r.fecha_vencimiento ASC LIMIT 50';

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function sendPendingReminderEmails(options = {}) {
  if (!mailConfigured()) {
    return {
      sent: 0,
      failed: 0,
      skipped: 'SMTP no configurado. Agrega SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM en Vercel.',
      items: [],
    };
  }

  await ensureNotificadoEmailColumn();
  const pending = await fetchPendingEmailReminders(options);
  const items = [];
  let sent = 0;
  let failed = 0;

  for (const recordatorio of pending) {
    try {
      await sendReminderEmail({
        to: recordatorio.usuario_email,
        nombre: recordatorio.usuario_nombre,
        recordatorio,
      });
      await pool.query(
        `UPDATE recordatorios
         SET notificado_email = 1
         WHERE id_recordatorio = :id`,
        { id: recordatorio.id_recordatorio }
      );
      sent += 1;
      items.push({
        id_recordatorio: recordatorio.id_recordatorio,
        email: recordatorio.usuario_email,
        status: 'sent',
      });
    } catch (error) {
      failed += 1;
      console.error('Error enviando correo de recordatorio:', error.message);
      items.push({
        id_recordatorio: recordatorio.id_recordatorio,
        email: recordatorio.usuario_email,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return { sent, failed, items };
}

module.exports = {
  ensureNotificadoEmailColumn,
  fetchPendingEmailReminders,
  sendPendingReminderEmails,
};
