const db = require('../config/db');

const listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, u.numero as unidad_numero, u.estado as unidad_estado,
             r.nombre as ruta_nombre, r.color as ruta_color,
             c.nombre as conductor_nombre, c.apellido as conductor_apellido
      FROM asignaciones a
      JOIN unidades u ON a.unidad_id = u.id
      JOIN rutas r ON a.ruta_id = r.id
      JOIN conductores c ON a.conductor_id = c.id
      ORDER BY a.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const crear = async (req, res) => {
  const { unidad_id, ruta_id, conductor_id, fecha_inicio, fecha_fin } = req.body;
  if (!unidad_id || !ruta_id || !conductor_id || !fecha_inicio)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  try {
    // Validar disponibilidad de unidad
    const [unidadOcupada] = await db.query(
      `SELECT id FROM asignaciones WHERE unidad_id = ? AND estado = 'activa' AND
       (fecha_fin IS NULL OR fecha_fin >= ?)`, [unidad_id, fecha_inicio]);
    if (unidadOcupada.length > 0)
      return res.status(400).json({ error: 'La unidad ya está asignada en ese período' });

    // Validar disponibilidad de conductor
    const [conductorOcupado] = await db.query(
      `SELECT id FROM asignaciones WHERE conductor_id = ? AND estado = 'activa' AND
       (fecha_fin IS NULL OR fecha_fin >= ?)`, [conductor_id, fecha_inicio]);
    if (conductorOcupado.length > 0)
      return res.status(400).json({ error: 'El conductor ya tiene una asignación activa' });

    const [result] = await db.query(
      'INSERT INTO asignaciones (unidad_id, ruta_id, conductor_id, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
      [unidad_id, ruta_id, conductor_id, fecha_inicio, fecha_fin || null]);
    res.status(201).json({ id: result.insertId, mensaje: 'Asignación creada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const actualizar = async (req, res) => {
  const { unidad_id, ruta_id, conductor_id, fecha_inicio, fecha_fin, estado } = req.body;
  try {
    await db.query(
      'UPDATE asignaciones SET unidad_id=?, ruta_id=?, conductor_id=?, fecha_inicio=?, fecha_fin=?, estado=? WHERE id=?',
      [unidad_id, ruta_id, conductor_id, fecha_inicio, fecha_fin, estado, req.params.id]);
    res.json({ mensaje: 'Asignación actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const eliminar = async (req, res) => {
  try {
    await db.query('DELETE FROM asignaciones WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Asignación eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { listar, crear, actualizar, eliminar };
