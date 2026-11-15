-- Project E.D.E.N. · Antes de grabar el video: devuelve a "ready" los pods extraídos en ensayos.
-- Cada extracción en la app marca el pod como "growing" (ver pod_status_update.sql).
-- Pegar en Supabase → SQL Editor → Run.
update seed_cartridges
set status = 'ready', planted_at = null
where pod_id in ('ASH-Gen2-001', 'MEN-Gen2-001')
returning pod_id, status;
