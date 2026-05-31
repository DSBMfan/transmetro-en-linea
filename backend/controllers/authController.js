const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND estado = 1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const usuario = rows[0];
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detalle: err.message });
  }
};

const perfil = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, created_at FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, perfil };
