const db = require('../config/db');

const obtenerUbicaciones = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, u.numero as unidad_numero, u.estado as unidad_estado,
             r.nombre as ruta_nombre, r.color as ruta_color
      FROM gps_ubicaciones g
      JOIN unidades u ON g.unidad_id = u.id
      LEFT JOIN asignaciones a ON a.unidad_id = u.id AND a.estado = 'activa'
      LEFT JOIN rutas r ON a.ruta_id = r.id
      WHERE g.id IN (
        SELECT MAX(id) FROM gps_ubicaciones GROUP BY unidad_id
      )
      ORDER BY g.timestamp DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const actualizarUbicacion = async (req, res) => {
  const { latitud, longitud, velocidad } = req.body;
  const { unidad_id } = req.params;
  try {
    await db.query(
      'INSERT INTO gps_ubicaciones (unidad_id, latitud, longitud, velocidad) VALUES (?, ?, ?, ?)',
      [unidad_id, latitud, longitud, velocidad || 0]);
    res.json({ mensaje: 'Ubicación actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const historial = async (req, res) => {
  const { unidad_id } = req.params;
  const { limite } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM gps_ubicaciones WHERE unidad_id = ? ORDER BY timestamp DESC LIMIT ?',
      [unidad_id, parseInt(limite) || 50]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { obtenerUbicaciones, actualizarUbicacion, historial };
