-- Datos de demostración para el modelo reducido de EPA WebGIS.

SET search_path TO epa, public;

INSERT INTO sector (codigo) VALUES
    ('ZEAP-C'),
    ('PATIO-NORTE'),
    ('PATIO-SUR'),
    ('MUELLE-1'),
    ('ACCESO-VIAL');

INSERT INTO usuario (nombre, email, rol, password_hash) VALUES
    ('Fabián Astorga Castillo', 'operador@epa.cl', 'Operador',
     '$2a$11$ejemploHashDeDemostracionNoUsarEnProduccion'),
    ('Jorge Bernal Navarrete', 'jefatura@epa.cl', 'Directivo',
     '$2a$11$ejemploHashDeDemostracionNoUsarEnProduccion'),
    ('Administrador del sistema', 'admin@epa.cl', 'Admin',
     '$2a$11$ejemploHashDeDemostracionNoUsarEnProduccion');

INSERT INTO vuelo
    (codigo_vuelo, fecha_inicio, estado_carga, total_archivos, id_sector, id_usuario)
SELECT
    'VUELO-ZEAP-20260614',
    '2026-06-14 10:30:00-04',
    'COMPLETADO',
    148,
    s.id_sector,
    u.id_usuario
FROM sector s, usuario u
WHERE s.codigo = 'ZEAP-C' AND u.email = 'operador@epa.cl';

INSERT INTO vuelo
    (codigo_vuelo, fecha_inicio, estado_carga, total_archivos, id_sector, id_usuario)
SELECT
    'VUELO-ZEAP-20260914',
    '2026-09-14 10:30:00-03',
    'COMPLETADO_CON_ERRORES',
    162,
    s.id_sector,
    u.id_usuario
FROM sector s, usuario u
WHERE s.codigo = 'ZEAP-C' AND u.email = 'operador@epa.cl';

INSERT INTO fotografia (nombre_archivo, fecha_captura, id_vuelo)
SELECT 'DJI_0042.JPG', '2026-06-14 10:37:54-04', id_vuelo
FROM vuelo WHERE codigo_vuelo = 'VUELO-ZEAP-20260614';

INSERT INTO fotografia (nombre_archivo, fecha_captura, id_vuelo)
SELECT 'DJI_0043.JPG', '2026-06-14 10:39:12-04', id_vuelo
FROM vuelo WHERE codigo_vuelo = 'VUELO-ZEAP-20260614';

INSERT INTO fotografia (nombre_archivo, fecha_captura, id_vuelo)
SELECT 'DJI_0098.JPG', '2026-09-14 10:37:54-03', id_vuelo
FROM vuelo WHERE codigo_vuelo = 'VUELO-ZEAP-20260914';

INSERT INTO fotografia (nombre_archivo, fecha_captura, id_vuelo)
SELECT 'DJI_0099.JPG', '2026-09-14 10:39:12-03', id_vuelo
FROM vuelo WHERE codigo_vuelo = 'VUELO-ZEAP-20260914';

INSERT INTO incidencia
    (codigo_incidencia, categoria, ubicacion, id_sector, id_usuario)
SELECT
    'INC-2026-014',
    'Congestión',
    ST_SetSRID(ST_MakePoint(-70.29812, -18.48741), 4326),
    s.id_sector,
    u.id_usuario
FROM sector s, usuario u
WHERE s.codigo = 'ZEAP-C' AND u.email = 'operador@epa.cl';

INSERT INTO incidencia
    (codigo_incidencia, categoria, ubicacion, id_sector, id_usuario)
SELECT
    'INC-2026-015',
    'Daño de pavimento',
    ST_SetSRID(ST_MakePoint(-70.30571, -18.48095), 4326),
    s.id_sector,
    u.id_usuario
FROM sector s, usuario u
WHERE s.codigo = 'ACCESO-VIAL' AND u.email = 'operador@epa.cl';

INSERT INTO incidencia
    (codigo_incidencia, categoria, ubicacion, id_sector, id_usuario)
SELECT
    'INC-2026-016',
    'Residuos',
    ST_SetSRID(ST_MakePoint(-70.30933, -18.47828), 4326),
    s.id_sector,
    u.id_usuario
FROM sector s, usuario u
WHERE s.codigo = 'PATIO-SUR' AND u.email = 'operador@epa.cl';

INSERT INTO evidencia (id_incidencia, id_foto, id_usuario, orden, tipo)
SELECT i.id_incidencia, f.id_foto, u.id_usuario, 1, 'ANTES'
FROM incidencia i, fotografia f, usuario u
WHERE i.codigo_incidencia = 'INC-2026-014'
  AND f.nombre_archivo = 'DJI_0042.JPG'
  AND u.email = 'operador@epa.cl';

INSERT INTO evidencia (id_incidencia, id_foto, id_usuario, orden, tipo)
SELECT i.id_incidencia, f.id_foto, u.id_usuario, 2, 'DESPUES'
FROM incidencia i, fotografia f, usuario u
WHERE i.codigo_incidencia = 'INC-2026-014'
  AND f.nombre_archivo = 'DJI_0098.JPG'
  AND u.email = 'operador@epa.cl';

INSERT INTO evidencia (id_incidencia, id_foto, id_usuario, orden, tipo)
SELECT i.id_incidencia, f.id_foto, u.id_usuario, 1, 'DETALLE'
FROM incidencia i, fotografia f, usuario u
WHERE i.codigo_incidencia = 'INC-2026-016'
  AND f.nombre_archivo = 'DJI_0099.JPG'
  AND u.email = 'operador@epa.cl';

INSERT INTO historial
    (id_incidencia, fecha_cambio, estado_anterior, estado_nuevo, id_usuario)
SELECT i.id_incidencia, '2026-06-14 11:00:00-04', NULL, 'Pendiente', u.id_usuario
FROM incidencia i, usuario u
WHERE i.codigo_incidencia = 'INC-2026-014' AND u.email = 'operador@epa.cl';

INSERT INTO historial
    (id_incidencia, fecha_cambio, estado_anterior, estado_nuevo, id_usuario)
SELECT i.id_incidencia, '2026-09-14 11:30:00-03', 'Pendiente', 'En Gestión', u.id_usuario
FROM incidencia i, usuario u
WHERE i.codigo_incidencia = 'INC-2026-014' AND u.email = 'jefatura@epa.cl';

INSERT INTO informe (numero, estado, id_usuario)
SELECT 'INF-2026-0001', 'LISTO', u.id_usuario
FROM usuario u WHERE u.email = 'jefatura@epa.cl';

INSERT INTO informe_incidencia (id_informe, id_incidencia)
SELECT inf.id_informe, i.id_incidencia
FROM informe inf, incidencia i
WHERE inf.numero = 'INF-2026-0001'
  AND i.codigo_incidencia IN ('INC-2026-014', 'INC-2026-016');
