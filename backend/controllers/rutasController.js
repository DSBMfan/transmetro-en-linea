const db = require('../config/db');
const xlsx = require('xlsx');
const path = require('path');

const listar = async (req, res) => {
  try {
    const [rutas] = await db.query('SELECT * FROM rutas ORDER BY numero');
    for (const ruta of rutas) {
      const [paradas] = await db.query('SELECT * FROM paradas WHERE ruta_id = ? ORDER BY orden', [ruta.id]);
      const [horarios] = await db.query('SELECT * FROM horarios WHERE ruta_id = ?', [ruta.id]);
      ruta.paradas = paradas;
      ruta.horarios = horarios;
    }
    res.json(rutas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const obtener = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rutas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Ruta no encontrada' });
    const [paradas] = await db.query('SELECT * FROM paradas WHERE ruta_id = ? ORDER BY orden', [req.params.id]);
    const [horarios] = await db.query('SELECT * FROM horarios WHERE ruta_id = ?', [req.params.id]);
    res.json({ ...rows[0], paradas, horarios });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const crear = async (req, res) => {
  const { nombre, numero, color, descripcion, paradas, horarios } = req.body;
  if (!nombre || !numero) return res.status(400).json({ error: 'Nombre y número son requeridos' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO rutas (nombre, numero, color, descripcion) VALUES (?, ?, ?, ?)',
      [nombre, numero, color || '#000000', descripcion]
    );
    const rutaId = result.insertId;
    if (paradas && paradas.length > 0) {
      for (let i = 0; i < paradas.length; i++) {
        const p = paradas[i];
        await conn.query('INSERT INTO paradas (ruta_id, nombre, orden, latitud, longitud) VALUES (?, ?, ?, ?, ?)',
          [rutaId, p.nombre, i + 1, p.latitud || null, p.longitud || null]);
      }
    }
    if (horarios && horarios.length > 0) {
      for (const h of horarios) {
        await conn.query('INSERT INTO horarios (ruta_id, hora_inicio, hora_fin, frecuencia_minutos, dias) VALUES (?, ?, ?, ?, ?)',
          [rutaId, h.hora_inicio, h.hora_fin, h.frecuencia_minutos || 15, h.dias]);
      }
    }
    await conn.commit();
    res.status(201).json({ id: rutaId, mensaje: 'Ruta creada exitosamente' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
};

const actualizar = async (req, res) => {
  const { nombre, numero, color, descripcion, estado } = req.body;
  try {
    await db.query('UPDATE rutas SET nombre=?, numero=?, color=?, descripcion=?, estado=? WHERE id=?',
      [nombre, numero, color, descripcion, estado, req.params.id]);
    res.json({ mensaje: 'Ruta actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const eliminar = async (req, res) => {
  try {
    await db.query('DELETE FROM rutas WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Ruta eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const importarExcel = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../data/lineas.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      for (const col of Object.keys(data[0])) {
        const nombreRuta = col.trim();
        const [existente] = await conn.query('SELECT id FROM rutas WHERE nombre = ?', [nombreRuta]);
        let rutaId;
        if (existente.length === 0) {
          const [r] = await conn.query('INSERT INTO rutas (nombre, numero, color) VALUES (?, ?, ?)',
            [nombreRuta, nombreRuta.replace(/[^0-9]/g, ''), '#808080']);
          rutaId = r.insertId;
        } else {
          rutaId = existente[0].id;
          await conn.query('DELETE FROM paradas WHERE ruta_id = ?', [rutaId]);
        }
        let orden = 1;
        for (const row of data) {
          if (row[col] && String(row[col]).trim() !== '') {
            await conn.query('INSERT INTO paradas (ruta_id, nombre, orden) VALUES (?, ?, ?)',
              [rutaId, String(row[col]).trim(), orden++]);
          }
        }
      }
      await conn.commit();
      res.json({ mensaje: 'Excel importado exitosamente' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const buscar = async (req, res) => {
  const { q } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM rutas WHERE nombre LIKE ? OR numero LIKE ? OR descripcion LIKE ?',
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, importarExcel, buscar };
