const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post(
  '/register',
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    try {
      const [existing] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = :email', { email });
      if (existing.length) {
        return res.status(409).json({ message: 'El correo ya está registrado' });
      }

      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password) VALUES (:nombre, :email, :password)',
        { nombre, email, password: hash }
      );

      const defaultCategories = [
        { nombre: 'Trabajo', color_hex: '#6366F1' },
        { nombre: 'Personal', color_hex: '#EC4899' },
        { nombre: 'Estudio', color_hex: '#F59E0B' },
      ];

      for (const cat of defaultCategories) {
        await pool.query(
          'INSERT INTO categorias (nombre, color_hex, id_usuario) VALUES (:nombre, :color_hex, :id_usuario)',
          { ...cat, id_usuario: result.insertId }
        );
      }

      const user = { id_usuario: result.insertId, nombre, email };
      const token = signToken(user);

      return res.status(201).json({
        message: 'Registro exitoso',
        token,
        user,
      });
    } catch (error) {
      console.error('Error en registro:', error);
      return res.status(500).json({ message: 'Error al registrar usuario' });
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const [rows] = await pool.query(
        'SELECT id_usuario, nombre, email, password FROM usuarios WHERE email = :email',
        { email }
      );

      if (!rows.length) {
        return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
      }

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
      }

      const payload = { id_usuario: user.id_usuario, nombre: user.nombre, email: user.email };
      const token = signToken(payload);

      return res.json({ message: 'Inicio de sesión exitoso', token, user: payload });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ message: 'Error al iniciar sesión' });
    }
  }
);

router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, email, creado_en FROM usuarios WHERE id_usuario = :id',
      { id: req.user.id_usuario }
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error en /me:', error);
    return res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

module.exports = router;
