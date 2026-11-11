-- ============================================================================
-- Migración: almacenamiento físico y metadatos de fotografías
-- Se ejecuta sobre una base existente sin borrar datos.
-- ============================================================================

SET search_path TO epa, public;

ALTER TABLE fotografia
    ADD COLUMN IF NOT EXISTS ruta_relativa varchar(500),
    ADD COLUMN IF NOT EXISTS mime_type varchar(100),
    ADD COLUMN IF NOT EXISTS tamano_bytes bigint,
    ADD COLUMN IF NOT EXISTS ancho_px integer,
    ADD COLUMN IF NOT EXISTS alto_px integer,
    ADD COLUMN IF NOT EXISTS hash_sha256 char(64),
    ADD COLUMN IF NOT EXISTS fecha_carga timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS ix_fotografia_vuelo ON fotografia (id_vuelo);
