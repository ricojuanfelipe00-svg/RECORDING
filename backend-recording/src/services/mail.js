const nodemailer = require('nodemailer');

function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  if (!mailConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === '1',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatFechaEmail(value) {
  const date = value instanceof Date ? value : new Date(String(value).includes('T') || String(value).includes('Z') ? value : `${String(value).replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function sendReminderEmail({ to, nombre, recordatorio }) {
  const transport = createTransport();
  if (!transport) {
    const error = new Error('SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS)');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const cuando = formatFechaEmail(recordatorio.fecha_vencimiento);
  const subject = `Recordatorio: ${recordatorio.titulo}`;
  const text = [
    `Hola ${nombre || 'usuario'},`,
    '',
    'Tienes un recordatorio próximo a vencer en Recuérdame:',
    '',
    `Título: ${recordatorio.titulo}`,
    recordatorio.descripcion ? `Descripción: ${recordatorio.descripcion}` : null,
    `Fecha y hora: ${cuando}`,
    `Prioridad: ${recordatorio.prioridad || 'Media'}`,
    `Estado: ${recordatorio.estado || 'Pendiente'}`,
    recordatorio.categoria_nombre ? `Categoría: ${recordatorio.categoria_nombre}` : null,
    '',
    'Abre la app Recuérdame para gestionarlo.',
    '',
    '— Equipo Recuérdame',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
      <h2 style="color:#5b5ce2;margin-bottom:8px">Recuérdame</h2>
      <p>Hola <strong>${nombre || 'usuario'}</strong>,</p>
      <p>Tienes un recordatorio próximo a vencer:</p>
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#f8fafc">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700">${recordatorio.titulo}</p>
        ${recordatorio.descripcion ? `<p style="margin:0 0 8px;color:#64748b">${recordatorio.descripcion}</p>` : ''}
        <p style="margin:0"><strong>Fecha y hora:</strong> ${cuando}</p>
        <p style="margin:8px 0 0"><strong>Prioridad:</strong> ${recordatorio.prioridad || 'Media'}</p>
        ${recordatorio.categoria_nombre ? `<p style="margin:8px 0 0"><strong>Categoría:</strong> ${recordatorio.categoria_nombre}</p>` : ''}
      </div>
      <p style="color:#64748b;font-size:13px;margin-top:20px">Este correo se envió a ${to} porque está registrado en Recuérdame.</p>
    </div>
  `;

  await transport.sendMail({ from, to, subject, text, html });
}

module.exports = {
  mailConfigured,
  sendReminderEmail,
  formatFechaEmail,
};
