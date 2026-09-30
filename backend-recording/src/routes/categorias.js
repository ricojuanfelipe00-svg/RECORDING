const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_categoria, nombre, color_hex, id_usuario
       FROM categorias
       WHERE id_usuario = :id_usuario
       ORDER BY nombre ASC`,
      { id_usuario: req.user.id_usuario }
    );
    return res.json({ categorias: rows });
  } catch (error) {
    console.error('Error listando categorías:', error);
    return res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

router.post(
  '/',
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('color_hex')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('color_hex inválido'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { nombre, color_hex = '#3B82F6' } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO categorias (nombre, color_hex, id_usuario)
         VALUES (:nombre, :color_hex, :id_usuario)`,
        { nombre, color_hex, id_usuario: req.user.id_usuario }
      );

      return res.status(201).json({
        categoria: {
          id_categoria: result.insertId,
          nombre,
          color_hex,
          id_usuario: req.user.id_usuario,
        },
      });
    } catch (error) {
      console.error('Error creando categoría:', error);
      return res.status(500).json({ message: 'Error al crear categoría' });
    }
  }
);

router.put(
  '/:id',
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('color_hex')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('color_hex inválido'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const id = Number(req.params.id);
    const { nombre, color_hex } = req.body;

    try {
      const [existing] = await pool.query(
        `SELECT id_categoria FROM categorias
         WHERE id_categoria = :id AND id_usuario = :id_usuario`,
        { id, id_usuario: req.user.id_usuario }
      );
      if (!existing.length) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      await pool.query(
        `UPDATE categorias
         SET nombre = COALESCE(:nombre, nombre),
             color_hex = COALESCE(:color_hex, color_hex)
         WHERE id_categoria = :id AND id_usuario = :id_usuario`,
        {
          nombre: nombre ?? null,
          color_hex: color_hex ?? null,
          id,
          id_usuario: req.user.id_usuario,
        }
      );

      const [rows] = await pool.query(
        'SELECT id_categoria, nombre, color_hex, id_usuario FROM categorias WHERE id_categoria = :id',
        { id }
      );

      return res.json({ categoria: rows[0] });
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      return res.status(500).json({ message: 'Error al actualizar categoría' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.query(
      `DELETE FROM categorias
       WHERE id_categoria = :id AND id_usuario = :id_usuario`,
      { id, id_usuario: req.user.id_usuario }
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    return res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return res.status(500).json({ message: 'Error al eliminar categoría' });
  }
});

module.exports = router;
