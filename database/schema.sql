-- ============================================================
--  TRANSMETRO EN LÍNEA - Base de Datos
-- ============================================================

CREATE DATABASE IF NOT EXISTS transmetro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transmetro_db;

-- ----------------------------
-- Tabla: usuarios
-- ----------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'operador', 'consulta') DEFAULT 'consulta',
  estado TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- Tabla: rutas
-- ----------------------------
CREATE TABLE IF NOT EXISTS rutas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  color VARCHAR(7) DEFAULT '#000000',
  descripcion TEXT,
  estado ENUM('activa', 'inactiva') DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- Tabla: paradas
-- ----------------------------
CREATE TABLE IF NOT EXISTS paradas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruta_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  latitud DECIMAL(10, 7),
  longitud DECIMAL(10, 7),
  FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
);

-- ----------------------------
-- Tabla: horarios
-- ----------------------------
CREATE TABLE IF NOT EXISTS horarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruta_id INT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  frecuencia_minutos INT DEFAULT 15,
  dias VARCHAR(100) DEFAULT 'Lunes a Viernes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
);

-- ----------------------------
-- Tabla: unidades
-- ----------------------------
CREATE TABLE IF NOT EXISTS unidades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  numero VARCHAR(20) NOT NULL UNIQUE,
  placa VARCHAR(20),
  modelo VARCHAR(100),
  anio INT,
  capacidad INT DEFAULT 80,
  estado ENUM('en_servicio', 'fuera_de_servicio', 'en_mantenimiento') DEFAULT 'en_servicio',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- Tabla: conductores
-- ----------------------------
CREATE TABLE IF NOT EXISTS conductores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  dpi VARCHAR(20) UNIQUE,
  licencia VARCHAR(20),
  telefono VARCHAR(20),
  email VARCHAR(100),
  unidad_id INT DEFAULT NULL,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE SET NULL
);

-- ----------------------------
-- Tabla: asignaciones
-- ----------------------------
CREATE TABLE IF NOT EXISTS asignaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unidad_id INT NOT NULL,
  ruta_id INT NOT NULL,
  conductor_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado ENUM('activa', 'inactiva') DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unidad_id) REFERENCES unidades(id),
  FOREIGN KEY (ruta_id) REFERENCES rutas(id),
  FOREIGN KEY (conductor_id) REFERENCES conductores(id)
);

-- ----------------------------
-- Tabla: gps_ubicaciones
-- ----------------------------
CREATE TABLE IF NOT EXISTS gps_ubicaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unidad_id INT NOT NULL,
  latitud DECIMAL(10, 7) NOT NULL,
  longitud DECIMAL(10, 7) NOT NULL,
  velocidad DECIMAL(5, 2) DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unidad_id) REFERENCES unidades(id)
);

-- ----------------------------
-- Tabla: reportes_log
-- ----------------------------
CREATE TABLE IF NOT EXISTS reportes_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255),
  usuario_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ----------------------------
-- Datos iniciales: Admin
-- ----------------------------
INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES
('Administrador', 'Sistema', 'admin@transmetro.gt', '$2a$10$PbZBH7H7xyRRyvY/kT6CHOqZyXKXJsRt7QQLWpcqa86GQsH8.nsji', 'admin');
-- Contraseña: admin123

-- ----------------------------
-- Datos iniciales: Rutas
-- ----------------------------
INSERT INTO rutas (nombre, numero, color, descripcion) VALUES
('Línea 1', '1', '#808080', 'Ruta zona occidental - San Sebastián'),
('Línea 2', '2', '#8B008B', 'Ruta norte - Hipódromo del Norte'),
('Línea 6', '6', '#DAA520', 'Ruta oriental - Proyectos'),
('Línea 7', '7', '#A9A9A9', 'USAC Periférico'),
('Línea 12', '12', '#FF6600', 'Ruta sur - Centra Sur'),
('Línea 13', '13', '#228B22', 'Ruta Plaza Berlín'),
('Línea 18', '18', '#00BFFF', 'Ruta San Rafael - Paraíso'),
('Ruta 5', '5', '#000080', 'Ruta central - Parque Colón');

-- ----------------------------
-- Paradas Línea 12 (con coordenadas)
-- ----------------------------
INSERT INTO paradas (ruta_id, nombre, orden, latitud, longitud) VALUES
(5, 'Centra Sur', 1, 14.5638, -90.5480),
(5, 'Monte María', 2, 14.5718, -90.5420),
(5, 'Javier', 3, 14.5798, -90.5365),
(5, 'Las Charcas (Plaza Barrios)', 4, 14.5876, -90.5305),
(5, 'Las Charcas (Centra Sur)', 5, 14.5880, -90.5312),
(5, 'El Carmen', 6, 14.5958, -90.5255),
(5, 'Reformita (Plaza Barrios)', 7, 14.6035, -90.5198),
(5, 'Reformita (Centra Sur)', 8, 14.6038, -90.5205),
(5, 'Mariscal (Plaza Barrios)', 9, 14.6095, -90.5172),
(5, 'Mariscal (Centra Sur)', 10, 14.6098, -90.5178),
(5, 'Trébol', 11, 14.6158, -90.5162),
(5, 'Santa Cecilia', 12, 14.6218, -90.5148),
(5, 'Bolívar (Centra Sur)', 13, 14.6268, -90.5145),
(5, 'Bolívar (Plaza Barrios)', 14, 14.6272, -90.5138),
(5, 'Don Bosco', 15, 14.6312, -90.5130),
(5, 'Plaza El Amate', 16, 14.6352, -90.5120),
(5, 'Plaza Barrios', 17, 14.6315, -90.5132),
(5, 'Plaza Municipal', 18, 14.6322, -90.5148);

-- ----------------------------
-- Paradas Línea 13
-- ----------------------------
INSERT INTO paradas (ruta_id, nombre, orden, latitud, longitud) VALUES
(6, 'Plaza Berlín', 1, 14.5508, -90.5148),
(6, 'Juan Pablo II', 2, 14.5598, -90.5148),
(6, 'Plaza Argentina / Hangares', 3, 14.5718, -90.5148),
(6, 'Fuerza Aérea', 4, 14.5838, -90.5148),
(6, 'Acueducto', 5, 14.5958, -90.5148),
(6, 'Los Arcos', 6, 14.6058, -90.5148),
(6, 'Plaza España', 7, 14.6098, -90.5130),
(6, 'IGSS Zona 9', 8, 14.6138, -90.5130),
(6, 'Seis 26', 9, 14.6188, -90.5130),
(6, 'Industria', 10, 14.6238, -90.5148),
(6, 'Terminal', 11, 14.6278, -90.5162),
(6, 'Exposición', 12, 14.6308, -90.5168),
(6, 'Cantón Exposición', 13, 14.6318, -90.5158),
(6, 'Plaza de la República', 14, 14.6308, -90.5138),
(6, 'Torre del Reformador', 15, 14.6298, -90.5128),
(6, 'Penitenciaría/Palacio de Deportes', 16, 14.6295, -90.5140),
(6, 'Banco de Guatemala', 17, 14.6318, -90.5120),
(6, 'Mercado La Palmita', 18, 14.6295, -90.5048),
(6, 'La Palmita', 19, 14.6258, -90.5022),
(6, 'Vivibien', 20, 14.6248, -90.4982),
(6, 'Arrivillaga', 21, 14.6238, -90.4942),
(6, 'Parque Navidad', 22, 14.6218, -90.4902),
(6, 'Jardines de La Asunción', 23, 14.6198, -90.4862);

-- ----------------------------
-- Paradas Línea 2 (Purple)
-- ----------------------------
INSERT INTO paradas (ruta_id, nombre, orden, latitud, longitud) VALUES
(2, 'Hipódromo del Norte', 1, 14.6648, -90.5092),
(2, 'San José de la Montaña', 2, 14.6598, -90.5102),
(2, 'Simeón Cañas', 3, 14.6558, -90.5110),
(2, 'Jocotenango', 4, 14.6518, -90.5115),
(2, 'San Sebastián', 5, 14.6498, -90.5122),
(2, 'Parque Centenario', 6, 14.6428, -90.5138),
(2, 'Mercado Central', 7, 14.6408, -90.5118),
(2, 'Cruz Roja', 8, 14.6415, -90.5140),
(2, 'Correos', 9, 14.6400, -90.5132),
(2, 'Beatas de Belén', 10, 14.6382, -90.5120),
(2, 'Tipografía', 11, 14.6352, -90.5125),
(2, 'Paseo de las Letras', 12, 14.6295, -90.5115),
(2, 'FEGUA', 13, 14.6302, -90.5120),
(2, 'Centro Cívico', 14, 14.6345, -90.5182),
(2, 'El Calvario', 15, 14.6330, -90.5162),
(2, 'Plaza Municipal', 16, 14.6322, -90.5148),
(2, 'Plaza Barrios', 17, 14.6315, -90.5132),
(2, 'Penitenciaría/Palacio de Deportes', 18, 14.6295, -90.5142);

-- ----------------------------
-- Paradas Línea 6 (Yellow)
-- ----------------------------
INSERT INTO paradas (ruta_id, nombre, orden, latitud, longitud) VALUES
(3, 'Proyectos', 1, 14.6718, -90.4952),
(3, 'Proyectos 4-4', 2, 14.6668, -90.4962),
(3, 'Cipresales', 3, 14.6618, -90.4982),
(3, 'Quintanal', 4, 14.6558, -90.5012),
(3, 'Corpus Christi', 5, 14.6508, -90.5032),
(3, 'José Martí', 6, 14.6468, -90.5042),
(3, 'Centro Zona 6', 7, 14.6448, -90.5022),
(3, 'IGSS Zona 6', 8, 14.6428, -90.5012),
(3, 'Academia', 9, 14.6558, -90.4992),
(3, 'Parroquia', 10, 14.6388, -90.5022),
(3, 'Cerro del Carmen', 11, 14.6448, -90.5075),
(3, 'La Merced', 12, 14.6428, -90.5082),
(3, 'Santa Teresa', 13, 14.6418, -90.5098),
(3, 'Capuchinas', 14, 14.6428, -90.5098),
(3, 'Colón', 15, 14.6422, -90.5068),
(3, 'Parque Colón', 16, 14.6418, -90.5062);

-- ----------------------------
-- Paradas Línea 18 (Cyan)
-- ----------------------------
INSERT INTO paradas (ruta_id, nombre, orden, latitud, longitud) VALUES
(7, 'Paraíso', 1, 14.6748, -90.4852),
(7, 'San Rafael', 2, 14.6718, -90.4882),
(7, 'Atlántida', 3, 14.6688, -90.4912),
(7, 'Portales', 4, 14.6538, -90.4892),
(7, 'Victorias', 5, 14.6488, -90.4902),
(7, 'Av. Victoria', 6, 14.6448, -90.4932),
(7, 'San Martín', 7, 14.6428, -90.4882),
(7, 'Matamoros', 8, 14.6398, -90.5022),
(7, 'Cipreses', 9, 14.6328, -90.5005),
(7, 'Jardines de La Asunción', 10, 14.6198, -90.4862);

-- ----------------------------
-- Horarios oficiales de servicio
-- ----------------------------
INSERT INTO horarios (ruta_id, hora_inicio, hora_fin, frecuencia_minutos, dias) VALUES
-- Línea 1
(1, '05:00:00', '20:00:00', 10, 'Lunes a Viernes'),
(1, '05:00:00', '19:00:00', 12, 'Sábado'),
(1, '06:30:00', '19:00:00', 15, 'Domingo y Festivos'),
-- Línea 2
(2, '05:30:00', '20:00:00', 10, 'Lunes a Viernes'),
(2, '05:30:00', '19:00:00', 12, 'Sábado'),
(2, '06:30:00', '19:00:00', 15, 'Domingo y Festivos'),
-- Línea 6
(3, '05:00:00', '21:00:00', 8,  'Lunes a Viernes'),
(3, '05:00:00', '20:00:00', 10, 'Sábado'),
(3, '06:00:00', '20:00:00', 15, 'Domingo y Festivos'),
-- Línea 7
(4, '05:00:00', '21:00:00', 10, 'Lunes a Viernes'),
(4, '05:00:00', '20:00:00', 12, 'Sábado'),
(4, '06:00:00', '20:00:00', 15, 'Domingo y Festivos'),
-- Línea 12
(5, '04:30:00', '21:00:00', 8,  'Lunes a Viernes'),
(5, '04:30:00', '21:00:00', 10, 'Sábado'),
(5, '04:30:00', '21:00:00', 12, 'Domingo y Festivos'),
-- Línea 13
(6, '05:00:00', '21:00:00', 10, 'Lunes a Viernes'),
(6, '05:00:00', '20:00:00', 12, 'Sábado'),
(6, '05:00:00', '20:00:00', 15, 'Domingo y Festivos'),
-- Línea 18
(7, '05:00:00', '21:00:00', 10, 'Lunes a Viernes'),
(7, '05:00:00', '20:00:00', 12, 'Sábado'),
(7, '06:00:00', '20:00:00', 15, 'Domingo y Festivos'),
-- Ruta 5
(8, '05:30:00', '19:00:00', 12, 'Lunes a Viernes'),
(8, '05:30:00', '19:00:00', 12, 'Sábado'),
(8, '06:00:00', '18:00:00', 15, 'Domingo y Festivos');

-- Unidades de ejemplo
INSERT INTO unidades (numero, placa, modelo, anio, capacidad, estado) VALUES
('BRT-001', 'GTM-001', 'Volvo 7900', 2020, 80, 'en_servicio'),
('BRT-002', 'GTM-002', 'Volvo 7900', 2020, 80, 'en_servicio'),
('BRT-003', 'GTM-003', 'Mercedes Citaro', 2019, 75, 'en_mantenimiento'),
('BRT-004', 'GTM-004', 'Volvo 7900', 2021, 80, 'en_servicio'),
('BRT-005', 'GTM-005', 'Mercedes Citaro', 2019, 75, 'fuera_de_servicio'),
('BRT-006', 'GTM-006', 'Volvo 7900', 2022, 80, 'en_servicio');

-- Conductores de ejemplo
INSERT INTO conductores (nombre, apellido, dpi, licencia, telefono, email, estado) VALUES
('Carlos', 'Mendoza', '1234567890101', 'A-12345', '50212345678', 'cmendoza@transmetro.gt', 'activo'),
('María', 'García', '2345678901201', 'A-23456', '50223456789', 'mgarcia@transmetro.gt', 'activo'),
('Juan', 'López', '3456789012301', 'A-34567', '50234567890', 'jlopez@transmetro.gt', 'activo'),
('Ana', 'Martínez', '4567890123401', 'A-45678', '50245678901', 'amartinez@transmetro.gt', 'activo');
