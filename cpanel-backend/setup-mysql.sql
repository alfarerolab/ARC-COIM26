-- Script de inicialización de la base de datos MySQL para ARC-COIM26
-- Ejecutar una sola vez desde phpMyAdmin o consola MySQL en cPanel

-- 1. Crear la base de datos (si no existe ya)
-- CREATE DATABASE IF NOT EXISTS arc_coim26 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE arc_coim26;

-- 2. Tabla principal de registros
CREATE TABLE IF NOT EXISTS registros (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    tipo   VARCHAR(50)  NOT NULL COMMENT 'encuesta | asistencia | caracterizacion',
    datos  JSON         NOT NULL COMMENT 'Payload completo del formulario en JSON',
    creado TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX  idx_tipo    (tipo),
    INDEX  idx_creado  (creado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Verificar la tabla
DESCRIBE registros;

-- 4. Insertar un registro de prueba
-- INSERT INTO registros (tipo, datos) VALUES ('encuesta', '{"encuestado":"Test","calif":{"0":5,"1":4},"abierta":{"mejoras":"Todo bien","mensaje":"Excelente jornada"}}');

-- 5. Consultar registros
-- SELECT id, tipo, creado, JSON_EXTRACT(datos, '$.encuestado') AS encuestado FROM registros ORDER BY creado DESC;
