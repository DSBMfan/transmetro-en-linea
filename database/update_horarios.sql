-- ============================================================
--  TRANSMETRO EN LÍNEA - Actualización de Horarios Oficiales
--  Ejecutar en MySQL Workbench sobre la base de datos existente
-- ============================================================

USE transmetro_db;

-- Desactiva el safe update mode para poder borrar sin WHERE
SET SQL_SAFE_UPDATES = 0;

-- Borra los horarios anteriores (de ejemplo)
DELETE FROM horarios WHERE id > 0;

-- Reactiva el safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Inserta los horarios oficiales de servicio
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

-- Verificar resultado
SELECT r.nombre, h.dias, h.hora_inicio, h.hora_fin, h.frecuencia_minutos
FROM horarios h
JOIN rutas r ON r.id = h.ruta_id
ORDER BY r.numero, h.dias;
