const db = require('../config/db');

const listar = async (req, res) => {
  try {
    const { estado, q } = req.query;
    let query = `SELECT u.*, c.nombre as conductor_nombre, c.apellido as conductor_apellido
                 FROM unidades u LEFT JOIN conductores c ON c.unidad_id = u.id`;
    const params = [];
    const conditions = [];
    if (estado) { conditions.push('u.estado = ?'); params.push(estado); }
    if (q) { conditions.push('(u.numero LIKE ? OR u.placa LIKE ? OR u.modelo LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY u.numero';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const obtener = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, c.nombre as conductor_nombre, c.apellido as conductor_apellido
       FROM unidades u LEFT JOIN conductores c ON c.unidad_id = u.id WHERE u.id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Unidad no encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const crear = async (req, res) => {
  const { numero, placa, modelo, anio, capacidad, estado } = req.body;
  if (!numero) return res.status(400).json({ error: 'Número de unidad requerido' });
  try {
    const [result] = await db.query(
      'INSERT INTO unidades (numero, placa, modelo, anio, capacidad, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [numero, placa, modelo, anio, capacidad || 80, estado || 'en_servicio']
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Unidad registrada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Número de unidad ya existe' });
    res.status(500).json({ error: err.message });
  }
};

const actualizar = async (req, res) => {
  const { numero, placa, modelo, anio, capacidad, estado } = req.body;
  try {
    await db.query('UPDATE unidades SET numero=?, placa=?, modelo=?, anio=?, capacidad=?, estado=? WHERE id=?',
      [numero, placa, modelo, anio, capacidad, estado, req.params.id]);
    res.json({ mensaje: 'Unidad actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const actualizarEstado = async (req, res) => {
  const { estado } = req.body;
  const estados = ['en_servicio', 'fuera_de_servicio', 'en_mantenimiento'];
  if (!estados.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
  try {
    await db.query('UPDATE unidades SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ mensaje: 'Estado actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const eliminar = async (req, res) => {
  try {
    await db.query('DELETE FROM unidades WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Unidad eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const estadisticas = async (req, res) => {
  try {
    const [totales] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(estado='en_servicio') as en_servicio,
        SUM(estado='fuera_de_servicio') as fuera_servicio,
        SUM(estado='en_mantenimiento') as en_mantenimiento
      FROM unidades`);
    res.json(totales[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { listar, obtener, crear, actualizar, actualizarEstado, eliminar, estadisticas };
