const bcrypt = require('bcryptjs');
const db = require('../config/db');

const listar = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, estado, created_at FROM usuarios ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const obtener = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, estado FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const crear = async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Campos requeridos incompletos' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, email, hash, rol || 'consulta']
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Usuario creado exitosamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: err.message });
  }
};

const actualizar = async (req, res) => {
  const { nombre, apellido, email, rol, estado, password } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query('UPDATE usuarios SET nombre=?, apellido=?, email=?, rol=?, estado=?, password=? WHERE id=?',
        [nombre, apellido, email, rol, estado, hash, req.params.id]);
    } else {
      await db.query('UPDATE usuarios SET nombre=?, apellido=?, email=?, rol=?, estado=? WHERE id=?',
        [nombre, apellido, email, rol, estado, req.params.id]);
    }
    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const eliminar = async (req, res) => {
  try {
    await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
