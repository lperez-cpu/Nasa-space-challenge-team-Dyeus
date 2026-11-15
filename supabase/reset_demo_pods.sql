-- Project E.D.E.N. · Antes de grabar el video o de los jueces: deja "ready" los 4 Seed Pods del dispensador.
-- Los pods son reutilizables: en la app se recargan con "Reload pod" (función reload_pod, ver pod_reload.sql).
-- Este script hace lo mismo para los 4 de la demo de una vez. Pegar en Supabase → SQL Editor → Run.
update seed_cartridges
set status = 'ready', planted_at = null
where pod_id in ('ASH-Gen2-001', 'MEN-Gen2-001', 'LAV-Gen2-001', 'CUR-Gen2-001')
returning pod_id, status;
