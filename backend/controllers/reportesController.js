const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const estadisticasGenerales = async (req, res) => {
  try {
    const [[unidades]] = await db.query(`SELECT COUNT(*) as total, SUM(estado='en_servicio') as activas, SUM(estado='en_mantenimiento') as mantenimiento, SUM(estado='fuera_de_servicio') as inactivas FROM unidades`);
    const [[rutas]] = await db.query(`SELECT COUNT(*) as total, SUM(estado='activa') as activas FROM rutas`);
    const [[conductores]] = await db.query(`SELECT COUNT(*) as total, SUM(estado='activo') as activos FROM conductores`);
    const [[asignaciones]] = await db.query(`SELECT COUNT(*) as total, SUM(estado='activa') as activas FROM asignaciones`);
    res.json({ unidades, rutas, conductores, asignaciones });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const exportarPDF = async (req, res) => {
  const { tipo } = req.params;
  try {
    let titulo = '';
    let datos = [];
    let columnas = [];

    if (tipo === 'unidades') {
      titulo = 'Reporte de Unidades';
      const [rows] = await db.query('SELECT numero, placa, modelo, anio, capacidad, estado FROM unidades ORDER BY numero');
      datos = rows;
      columnas = ['Número', 'Placa', 'Modelo', 'Año', 'Capacidad', 'Estado'];
    } else if (tipo === 'conductores') {
      titulo = 'Reporte de Conductores';
      const [rows] = await db.query('SELECT nombre, apellido, dpi, licencia, telefono, estado FROM conductores ORDER BY apellido');
      datos = rows;
      columnas = ['Nombre', 'Apellido', 'DPI', 'Licencia', 'Teléfono', 'Estado'];
    } else if (tipo === 'rutas') {
      titulo = 'Reporte de Rutas';
      const [rows] = await db.query('SELECT nombre, numero, descripcion, estado FROM rutas ORDER BY numero');
      datos = rows;
      columnas = ['Nombre', 'Número', 'Descripción', 'Estado'];
    } else if (tipo === 'asignaciones') {
      titulo = 'Reporte de Asignaciones';
      const [rows] = await db.query(`SELECT u.numero, r.nombre as ruta, CONCAT(c.nombre,' ',c.apellido) as conductor, a.fecha_inicio, a.estado FROM asignaciones a JOIN unidades u ON a.unidad_id=u.id JOIN rutas r ON a.ruta_id=r.id JOIN conductores c ON a.conductor_id=c.id ORDER BY a.created_at DESC`);
      datos = rows;
      columnas = ['Unidad', 'Ruta', 'Conductor', 'Fecha Inicio', 'Estado'];
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${tipo}_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#0F0DFF');
    doc.fillColor('white').fontSize(22).text('TRANSMETRO EN LÍNEA', 50, 20);
    doc.fontSize(12).text(titulo, 50, 50);
    doc.fillColor('black');

    doc.moveDown(4);
    doc.fontSize(10).fillColor('#555').text(`Generado: ${new Date().toLocaleString('es-GT')}`, { align: 'right' });
    doc.moveDown();

    // Tabla header
    const colWidth = (doc.page.width - 100) / columnas.length;
    let x = 50;
    doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#86ED5A');
    columnas.forEach(col => {
      doc.fillColor('black').fontSize(9).text(col, x + 2, doc.y - 18, { width: colWidth - 4 });
      x += colWidth;
    });
    doc.moveDown(0.5);

    // Filas
    datos.forEach((row, i) => {
      if (doc.y > doc.page.height - 100) { doc.addPage(); }
      const bg = i % 2 === 0 ? '#f9f9f9' : 'white';
      doc.rect(50, doc.y, doc.page.width - 100, 18).fill(bg);
      let cx = 50;
      Object.values(row).forEach(val => {
        doc.fillColor('#333').fontSize(8).text(String(val ?? ''), cx + 2, doc.y - 16, { width: colWidth - 4 });
        cx += colWidth;
      });
      doc.moveDown(0.3);
    });

    doc.end();

    // Log
    await db.query('INSERT INTO reportes_log (tipo, descripcion, usuario_id) VALUES (?, ?, ?)',
      [tipo, `Reporte PDF de ${titulo}`, req.usuario?.id || null]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const exportarExcel = async (req, res) => {
  const { tipo } = req.params;
  try {
    let titulo = '';
    let datos = [];
    let columnas = [];

    if (tipo === 'unidades') {
      titulo = 'Unidades';
      const [rows] = await db.query('SELECT numero, placa, modelo, anio, capacidad, estado FROM unidades ORDER BY numero');
      datos = rows; columnas = ['Número', 'Placa', 'Modelo', 'Año', 'Capacidad', 'Estado'];
    } else if (tipo === 'conductores') {
      titulo = 'Conductores';
      const [rows] = await db.query('SELECT nombre, apellido, dpi, licencia, telefono, email, estado FROM conductores ORDER BY apellido');
      datos = rows; columnas = ['Nombre', 'Apellido', 'DPI', 'Licencia', 'Teléfono', 'Email', 'Estado'];
    } else if (tipo === 'rutas') {
      titulo = 'Rutas';
      const [rows] = await db.query('SELECT nombre, numero, descripcion, estado FROM rutas ORDER BY numero');
      datos = rows; columnas = ['Nombre', 'Número', 'Descripción', 'Estado'];
    } else if (tipo === 'asignaciones') {
      titulo = 'Asignaciones';
      const [rows] = await db.query(`SELECT u.numero, r.nombre, CONCAT(c.nombre,' ',c.apellido), a.fecha_inicio, a.estado FROM asignaciones a JOIN unidades u ON a.unidad_id=u.id JOIN rutas r ON a.ruta_id=r.id JOIN conductores c ON a.conductor_id=c.id`);
      datos = rows; columnas = ['Unidad', 'Ruta', 'Conductor', 'Fecha Inicio', 'Estado'];
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(titulo);

    // Título
    sheet.mergeCells('A1:' + String.fromCharCode(64 + columnas.length) + '1');
    sheet.getCell('A1').value = `TRANSMETRO EN LÍNEA - ${titulo}`;
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F0DFF' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Columnas
    const headerRow = sheet.addRow(columnas);
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF86ED5A' } };
      cell.font = { bold: true };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Datos
    datos.forEach((row, i) => {
      const dr = sheet.addRow(Object.values(row));
      if (i % 2 === 0) dr.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; });
    });

    sheet.columns.forEach(col => { col.width = 18; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${tipo}_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { estadisticasGenerales, exportarPDF, exportarExcel };
