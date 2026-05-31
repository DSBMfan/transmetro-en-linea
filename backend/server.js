require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/rutas', require('./routes/rutas'));
app.use('/api/unidades', require('./routes/unidades'));
app.use('/api/conductores', require('./routes/conductores'));
app.use('/api/asignaciones', require('./routes/asignaciones'));
app.use('/api/gps', require('./routes/gps'));
app.use('/api/reportes', require('./routes/reportes'));

// Servir frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dashboard.html')));
app.get('/:page', (req, res) => {
  const file = path.join(__dirname, '../frontend', req.params.page + '.html');
  res.sendFile(file, err => { if (err) res.redirect('/'); });
});

// =============================================
// GPS Simulación en tiempo real con Socket.io
// =============================================
const db = require('./config/db');

// Almacena las posiciones actuales de cada unidad
const posicionesActuales = {};

// Rutas de simulación GPS (polilíneas de Guatemala City)
const rutasGPS = {
  1: [[14.5638, -90.5480], [14.5718, -90.5420], [14.5798, -90.5365], [14.5958, -90.5255], [14.6038, -90.5205], [14.6158, -90.5162], [14.6218, -90.5148], [14.6272, -90.5138], [14.6315, -90.5130], [14.6322, -90.5148]],
  2: [[14.6648, -90.5092], [14.6558, -90.5110], [14.6498, -90.5122], [14.6428, -90.5138], [14.6382, -90.5120], [14.6315, -90.5132], [14.6295, -90.5142]],
  3: [[14.5508, -90.5148], [14.5718, -90.5148], [14.5958, -90.5148], [14.6058, -90.5148], [14.6138, -90.5130], [14.6238, -90.5148], [14.6295, -90.5140]],
};

const simularGPS = async () => {
  try {
    const [unidades] = await db.query(`
      SELECT u.id, u.numero, a.ruta_id FROM unidades u
      LEFT JOIN asignaciones a ON a.unidad_id = u.id AND a.estado = 'activa'
      WHERE u.estado = 'en_servicio'`);

    for (const unidad of unidades) {
      const rutaCoords = rutasGPS[unidad.ruta_id] || rutasGPS[1];
      if (!posicionesActuales[unidad.id]) posicionesActuales[unidad.id] = { index: 0, forward: true };
      const pos = posicionesActuales[unidad.id];
      const coords = rutaCoords[pos.index];

      // Pequeña variación aleatoria para simular movimiento real
      const lat = coords[0] + (Math.random() - 0.5) * 0.0005;
      const lng = coords[1] + (Math.random() - 0.5) * 0.0005;
      const velocidad = 20 + Math.random() * 30;

      // Avanzar en la ruta
      if (pos.forward) {
        pos.index++;
        if (pos.index >= rutaCoords.length - 1) pos.forward = false;
      } else {
        pos.index--;
        if (pos.index <= 0) pos.forward = true;
      }

      // Guardar en BD
      await db.query('INSERT INTO gps_ubicaciones (unidad_id, latitud, longitud, velocidad) VALUES (?, ?, ?, ?)',
        [unidad.id, lat, lng, velocidad.toFixed(1)]);

      // Emitir a clientes conectados
      io.emit('gps_update', { unidad_id: unidad.id, numero: unidad.numero, lat, lng, velocidad: velocidad.toFixed(1), timestamp: new Date() });
    }
  } catch {}
};

// Actualizar GPS cada 5 segundos
setInterval(simularGPS, 5000);

// Socket.io conexión
io.on('connection', socket => {
  console.log('📡 Cliente GPS conectado:', socket.id);
  socket.on('disconnect', () => console.log('📡 Cliente GPS desconectado:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚌 TRANSMETRO EN LÍNEA`);
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard\n`);
});
