const db = require('../config/db');

const listar = async (req, res) => {
  try {
    const { q, estado } = req.query;
    let query = `SELECT c.*, u.numero as unidad_numero FROM conductores c LEFT JOIN unidades u ON c.unidad_id = u.id`;
    const params = [];
    const conditions = [];
    if (estado) { conditions.push('c.estado = ?'); params.push(estado); }
    if (q) { conditions.push('(c.nombre LIKE ? OR c.apellido LIKE ? OR c.dpi LIKE ? OR c.licencia LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY c.apellido, c.nombre';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const obtener = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT c.*, u.numero as unidad_numero FROM conductores c LEFT JOIN unidades u ON c.unidad_id = u.id WHERE c.id = ?',
      [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Conductor no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const crear = async (req, res) => {
  const { nombre, apellido, dpi, licencia, telefono, email, estado } = req.body;
  if (!nombre || !apellido) return res.status(400).json({ error: 'Nombre y apellido requeridos' });
  try {
    const [result] = await db.query(
      'INSERT INTO conductores (nombre, apellido, dpi, licencia, telefono, email, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido, dpi, licencia, telefono, email, estado || 'activo']
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Conductor registrado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'DPI ya registrado' });
    res.status(500).json({ error: err.message });
  }
};

const actualizar = async (req, res) => {
  const { nombre, apellido, dpi, licencia, telefono, email, estado } = req.body;
  try {
    await db.query('UPDATE conductores SET nombre=?, apellido=?, dpi=?, licencia=?, telefono=?, email=?, estado=? WHERE id=?',
      [nombre, apellido, dpi, licencia, telefono, email, estado, req.params.id]);
    res.json({ mensaje: 'Conductor actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const asignarUnidad = async (req, res) => {
  const { unidad_id } = req.body;
  try {
    // Verificar que la unidad esté disponible
    if (unidad_id) {
      const [ocupada] = await db.query('SELECT id FROM conductores WHERE unidad_id = ? AND id != ?', [unidad_id, req.params.id]);
      if (ocupada.length > 0) return res.status(400).json({ error: 'La unidad ya tiene un conductor asignado' });
    }
    await db.query('UPDATE conductores SET unidad_id = ? WHERE id = ?', [unidad_id || null, req.params.id]);
    res.json({ mensaje: 'Unidad asignada al conductor' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const eliminar = async (req, res) => {
  try {
    await db.query('DELETE FROM conductores WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Conductor eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { listar, obtener, crear, actualizar, asignarUnidad, eliminar };
