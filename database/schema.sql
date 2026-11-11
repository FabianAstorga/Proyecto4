-- ============================================================================
-- EPA WebGIS · modelo relacional reducido
-- Basado en el diagrama entidad-relación entregado por el cliente.
-- Entidades: SECTOR, USUARIO, VUELO, FOTOGRAFIA, INCIDENCIA,
--            EVIDENCIA, HISTORIAL e INFORME.
-- Relación M:N: INFORME — INCIDENCIA.
-- PostgreSQL 16+ / PostGIS.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

DROP SCHEMA IF EXISTS epa CASCADE;
CREATE SCHEMA epa;
SET search_path TO epa, public;

-- ----------------------------------------------------------------------------
-- SECTOR
-- ----------------------------------------------------------------------------
CREATE TABLE sector (
    id_sector bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo    varchar(30) NOT NULL UNIQUE,
    geom      geometry(MultiPolygon, 4326)
);

-- ----------------------------------------------------------------------------
-- USUARIO
-- Los campos de autenticación son técnicos, necesarios para el login.
-- ----------------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         varchar(120) NOT NULL,
    email          varchar(254) NOT NULL UNIQUE,
    rol            varchar(20)  NOT NULL,
    password_hash  varchar(255) NOT NULL,
    activo         boolean      NOT NULL DEFAULT true,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    ultimo_acceso  timestamptz
);

CREATE UNIQUE INDEX ux_usuario_email_lower ON usuario (lower(email));

-- ----------------------------------------------------------------------------
-- VUELO
-- ----------------------------------------------------------------------------
CREATE TABLE vuelo (
    id_vuelo       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_vuelo   varchar(50) NOT NULL UNIQUE,
    fecha_inicio   timestamptz NOT NULL,
    estado_carga   varchar(30) NOT NULL DEFAULT 'RECIBIDO',
    total_archivos integer     NOT NULL DEFAULT 0 CHECK (total_archivos >= 0),
    id_sector      bigint      NOT NULL REFERENCES sector(id_sector),
    id_usuario     bigint      NOT NULL REFERENCES usuario(id_usuario)
);

-- ----------------------------------------------------------------------------
-- FOTOGRAFIA
-- ----------------------------------------------------------------------------
CREATE TABLE fotografia (
    id_foto        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_archivo varchar(255) NOT NULL,
    fecha_captura  timestamptz  NOT NULL,
    id_vuelo       bigint       NOT NULL REFERENCES vuelo(id_vuelo) ON DELETE CASCADE,
    ruta_relativa  varchar(500),
    mime_type      varchar(100),
    tamano_bytes   bigint CHECK (tamano_bytes >= 0),
    ancho_px       integer CHECK (ancho_px > 0),
    alto_px        integer CHECK (alto_px > 0),
    hash_sha256    char(64),
    fecha_carga    timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- INCIDENCIA
-- ----------------------------------------------------------------------------
CREATE TABLE incidencia (
    id_incidencia     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_incidencia varchar(30) NOT NULL UNIQUE,
    categoria         varchar(60) NOT NULL,
    ubicacion         geometry(Point, 4326) NOT NULL,
    id_sector         bigint NOT NULL REFERENCES sector(id_sector),
    id_usuario        bigint NOT NULL REFERENCES usuario(id_usuario)
);

-- ----------------------------------------------------------------------------
-- EVIDENCIA
-- Entidad asociativa entre INCIDENCIA, FOTOGRAFIA y USUARIO.
-- ----------------------------------------------------------------------------
CREATE TABLE evidencia (
    id_incidencia    bigint NOT NULL REFERENCES incidencia(id_incidencia) ON DELETE CASCADE,
    id_foto          bigint NOT NULL REFERENCES fotografia(id_foto) ON DELETE RESTRICT,
    id_usuario       bigint NOT NULL REFERENCES usuario(id_usuario),
    orden            smallint NOT NULL CHECK (orden > 0),
    tipo             varchar(20) NOT NULL,
    fecha_asociacion timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id_incidencia, id_foto, orden)
);

-- ----------------------------------------------------------------------------
-- HISTORIAL
-- ----------------------------------------------------------------------------
CREATE TABLE historial (
    id_incidencia  bigint NOT NULL REFERENCES incidencia(id_incidencia) ON DELETE CASCADE,
    fecha_cambio   timestamptz NOT NULL DEFAULT now(),
    estado_anterior varchar(30),
    estado_nuevo   varchar(30) NOT NULL,
    id_usuario     bigint NOT NULL REFERENCES usuario(id_usuario),
    PRIMARY KEY (id_incidencia, fecha_cambio)
);

-- ----------------------------------------------------------------------------
-- INFORME
-- ----------------------------------------------------------------------------
CREATE TABLE informe (
    id_informe bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero     varchar(30) NOT NULL UNIQUE,
    estado     varchar(20) NOT NULL DEFAULT 'GENERANDO',
    id_usuario bigint NOT NULL REFERENCES usuario(id_usuario)
);

-- Relación M:N entre INFORME e INCIDENCIA.
CREATE TABLE informe_incidencia (
    id_informe    bigint NOT NULL REFERENCES informe(id_informe) ON DELETE CASCADE,
    id_incidencia bigint NOT NULL REFERENCES incidencia(id_incidencia) ON DELETE RESTRICT,
    PRIMARY KEY (id_informe, id_incidencia)
);
