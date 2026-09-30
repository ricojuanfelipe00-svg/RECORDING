const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool, toMysqlDateTime } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

const PRIORIDADES = ['Baja', 'Media', 'Alta'];
const ESTADOS = ['Pendiente', 'En Proceso', 'Completada'];
const SAME_DAY_MESSAGE =
  'No se puede hacer el recordatorio para el mismo día. Elige una fecha a partir de mañana.';

function toBogotaDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isSameDayInBogota(fechaValue) {
  const selected = toBogotaDateKey(fechaValue);
  const today = toBogotaDateKey(new Date());
  return Boolean(selected && today && selected === today);
}

router.get(
  '/',
  query('categoria').optional().isInt(),
  query('estado').optional().isIn(ESTADOS),
  query('prioridad').optional().isIn(PRIORIDADES),
  query('q').optional().isString(),
  async (req, res) => {
    try {
      const { categoria, estado, prioridad, q } = req.query;
      const params = { id_usuario: req.user.id_usuario };
      let sql = `
        SELECT r.id_recordatorio, r.titulo, r.descripcion, r.fecha_vencimiento,
               r.prioridad, r.estado, r.id_usuario, r.id_categoria, r.creado_en,
               c.nombre AS categoria_nombre, c.color_hex AS categoria_color
        FROM recordatorios r
        LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
        WHERE r.id_usuario = :id_usuario
      `;

      if (categoria) {
        sql += ' AND r.id_categoria = :categoria';
        params.categoria = Number(categoria);
      }
      if (estado) {
        sql += ' AND r.estado = :estado';
        params.estado = estado;
      }
      if (prioridad) {
        sql += ' AND r.prioridad = :prioridad';
        params.prioridad = prioridad;
      }
      if (q && q.trim()) {
        sql += ' AND (r.titulo LIKE :q OR r.descripcion LIKE :q)';
        params.q = `%${q.trim()}%`;
      }

      sql += ' ORDER BY r.fecha_vencimiento ASC';

      const [rows] = await pool.query(sql, params);
      return res.json({ recordatorios: rows });
    } catch (error) {
      console.error('Error listando recordatorios:', error);
      return res.status(500).json({ message: 'Error al obtener recordatorios' });
    }
  }
);

router.get('/proximos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id_recordatorio, r.titulo, r.descripcion, r.fecha_vencimiento,
              r.prioridad, r.estado, r.id_categoria,
              c.nombre AS categoria_nombre, c.color_hex AS categoria_color
       FROM recordatorios r
       LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
       WHERE r.id_usuario = :id_usuario
         AND r.estado <> 'Completada'
         AND r.fecha_vencimiento BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
       ORDER BY r.fecha_vencimiento ASC`,
      { id_usuario: req.user.id_usuario }
    );
    return res.json({ recordatorios: rows });
  } catch (error) {
    console.error('Error listando próximos:', error);
    return res.status(500).json({ message: 'Error al obtener próximos recordatorios' });
  }
});

// Envía al correo del usuario los recordatorios próximos aún no notificados.
router.post('/notificar-email', async (req, res) => {
  try {
    const { sendPendingReminderEmails } = require('../services/notifyReminders');
    const { mailConfigured } = require('../services/mail');
    const result = await sendPendingReminderEmails({
      idUsuario: req.user.id_usuario,
      hours: 24,
    });
    return res.json({
      message: result.sent
        ? `Se enviaron ${result.sent} correo(s) a tu cuenta registrada`
        : result.skipped || 'No hay recordatorios nuevos para notificar por correo',
      mailConfigured: mailConfigured(),
      ...result,
    });
  } catch (error) {
    console.error('Error notificando por correo:', error);
    return res.status(500).json({ message: 'Error al enviar notificación por correo' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, c.nombre AS categoria_nombre, c.color_hex AS categoria_color
       FROM recordatorios r
       LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
       WHERE r.id_recordatorio = :id AND r.id_usuario = :id_usuario`,
      { id: Number(req.params.id), id_usuario: req.user.id_usuario }
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }
    return res.json({ recordatorio: rows[0] });
  } catch (error) {
    console.error('Error obteniendo recordatorio:', error);
    return res.status(500).json({ message: 'Error al obtener recordatorio' });
  }
});

router.post(
  '/',
  body('titulo').trim().notEmpty().withMessage('El título es obligatorio'),
  body('fecha_vencimiento').notEmpty().withMessage('La fecha y hora son requeridas'),
  body('prioridad').optional().isIn(PRIORIDADES),
  body('estado').optional().isIn(ESTADOS),
  body('id_categoria').optional({ nullable: true, values: 'falsy' }).isInt().toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const {
      titulo,
      descripcion = null,
      fecha_vencimiento,
      prioridad = 'Media',
      estado = 'Pendiente',
      id_categoria = null,
    } = req.body;

    let fechaMysql;
    try {
      fechaMysql = toMysqlDateTime(fecha_vencimiento);
    } catch {
      return res.status(400).json({ message: 'Fecha de vencimiento inválida' });
    }

    if (isSameDayInBogota(fecha_vencimiento)) {
      return res.status(400).json({ message: SAME_DAY_MESSAGE });
    }

    try {
      if (id_categoria) {
        const [cat] = await pool.query(
          `SELECT id_categoria FROM categorias
           WHERE id_categoria = :id_categoria AND id_usuario = :id_usuario`,
          { id_categoria, id_usuario: req.user.id_usuario }
        );
        if (!cat.length) {
          return res.status(400).json({ message: 'Categoría inválida' });
        }
      }

      const [result] = await pool.query(
        `INSERT INTO recordatorios
          (titulo, descripcion, fecha_vencimiento, prioridad, estado, id_usuario, id_categoria)
         VALUES
          (:titulo, :descripcion, :fecha_vencimiento, :prioridad, :estado, :id_usuario, :id_categoria)`,
        {
          titulo,
          descripcion,
          fecha_vencimiento: fechaMysql,
          prioridad,
          estado,
          id_usuario: req.user.id_usuario,
          id_categoria,
        }
      );

      const [rows] = await pool.query(
        `SELECT r.*, c.nombre AS categoria_nombre, c.color_hex AS categoria_color
         FROM recordatorios r
         LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
         WHERE r.id_recordatorio = :id`,
        { id: result.insertId }
      );

      return res.status(201).json({ recordatorio: rows[0] });
    } catch (error) {
      console.error('Error creando recordatorio:', error);
      return res.status(500).json({
        message: 'Error al crear recordatorio',
        code: error.code || undefined,
      });
    }
  }
);

router.put(
  '/:id',
  body('titulo').optional().trim().notEmpty(),
  body('prioridad').optional().isIn(PRIORIDADES),
  body('estado').optional().isIn(ESTADOS),
  body('id_categoria').optional({ nullable: true }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const id = Number(req.params.id);
    const { titulo, descripcion, fecha_vencimiento, prioridad, estado, id_categoria } = req.body;

    try {
      const [existing] = await pool.query(
        `SELECT id_recordatorio FROM recordatorios
         WHERE id_recordatorio = :id AND id_usuario = :id_usuario`,
        { id, id_usuario: req.user.id_usuario }
      );
      if (!existing.length) {
        return res.status(404).json({ message: 'Recordatorio no encontrado' });
      }

      let fecha = null;
      if (fecha_vencimiento !== undefined) {
        try {
          fecha = toMysqlDateTime(fecha_vencimiento);
        } catch {
          return res.status(400).json({ message: 'Fecha de vencimiento inválida' });
        }
        if (isSameDayInBogota(fecha_vencimiento)) {
          return res.status(400).json({ message: SAME_DAY_MESSAGE });
        }
      }

      if (id_categoria) {
        const [cat] = await pool.query(
          `SELECT id_categoria FROM categorias
           WHERE id_categoria = :id_categoria AND id_usuario = :id_usuario`,
          { id_categoria, id_usuario: req.user.id_usuario }
        );
        if (!cat.length) {
          return res.status(400).json({ message: 'Categoría inválida' });
        }
      }

      await pool.query(
        `UPDATE recordatorios SET
          titulo = COALESCE(:titulo, titulo),
          descripcion = IF(:descripcion_set = 1, :descripcion, descripcion),
          fecha_vencimiento = COALESCE(:fecha_vencimiento, fecha_vencimiento),
          prioridad = COALESCE(:prioridad, prioridad),
          estado = COALESCE(:estado, estado),
          id_categoria = IF(:categoria_set = 1, :id_categoria, id_categoria),
          notificado_email = IF(:fecha_reset = 1, 0, notificado_email)
         WHERE id_recordatorio = :id AND id_usuario = :id_usuario`,
        {
          titulo: titulo ?? null,
          descripcion: descripcion ?? null,
          descripcion_set: descripcion !== undefined ? 1 : 0,
          fecha_vencimiento: fecha,
          fecha_reset: fecha ? 1 : 0,
          prioridad: prioridad ?? null,
          estado: estado ?? null,
          id_categoria: id_categoria === undefined ? null : id_categoria,
          categoria_set: id_categoria !== undefined ? 1 : 0,
          id,
          id_usuario: req.user.id_usuario,
        }
      );

      const [rows] = await pool.query(
        `SELECT r.*, c.nombre AS categoria_nombre, c.color_hex AS categoria_color
         FROM recordatorios r
         LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
         WHERE r.id_recordatorio = :id`,
        { id }
      );

      return res.json({ recordatorio: rows[0] });
    } catch (error) {
      console.error('Error actualizando recordatorio:', error);
      return res.status(500).json({ message: 'Error al actualizar recordatorio' });
    }
  }
);

router.patch('/:id/estado', body('estado').isIn(ESTADOS), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const id = Number(req.params.id);
  const { estado } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE recordatorios SET estado = :estado
       WHERE id_recordatorio = :id AND id_usuario = :id_usuario`,
      { estado, id, id_usuario: req.user.id_usuario }
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }

    const [rows] = await pool.query(
      `SELECT r.*, c.nombre AS categoria_nombre, c.color_hex AS categoria_color
       FROM recordatorios r
       LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
       WHERE r.id_recordatorio = :id`,
      { id }
    );

    return res.json({ recordatorio: rows[0] });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    return res.status(500).json({ message: 'Error al cambiar estado' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.query(
      `DELETE FROM recordatorios
       WHERE id_recordatorio = :id AND id_usuario = :id_usuario`,
      { id, id_usuario: req.user.id_usuario }
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }
    return res.json({ message: 'Recordatorio eliminado' });
  } catch (error) {
    console.error('Error eliminando recordatorio:', error);
    return res.status(500).json({ message: 'Error al eliminar recordatorio' });
  }
});

module.exports = router;
