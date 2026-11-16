-- ============================================================================
-- VotaTuPelícula — Soporte opcional de columnas dedicadas para traducciones y
-- tráilers por idioma (ES / VA / EN). Nota: los datos también se persisten en
-- `movies.palette` (JSONB) para compatibilidad retroactiva sin migración previa.
-- ============================================================================

ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS trailers JSONB NOT NULL DEFAULT '{}'::jsonb;
