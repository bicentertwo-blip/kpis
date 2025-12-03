-- =====================================================
-- SQL PARA ELIMINAR CONSTRAINTS UNIQUE DE TABLAS RESUMEN
-- Ejecutar en Supabase SQL Editor
-- =====================================================
-- IMPORTANTE: Este script elimina los constraints UNIQUE para permitir
-- múltiples registros por owner_id/anio/mes (versionamiento con trazabilidad)
-- El campo is_current marca cuál es la versión vigente
-- =====================================================

-- Primero vamos a listar todos los constraints UNIQUE existentes
-- SELECT conname, conrelid::regclass
-- FROM pg_constraint
-- WHERE contype = 'u' AND conrelid::regclass::text LIKE 'kpi_%_resumen%';

-- =====================================================
-- ELIMINAR CONSTRAINTS UNIQUE DE TODAS LAS TABLAS DE RESUMEN
-- =====================================================

-- kpi_margen_financiero_resumen
ALTER TABLE kpi_margen_financiero_resumen 
DROP CONSTRAINT IF EXISTS kpi_margen_financiero_resumen_owner_id_anio_mes_key;

-- kpi_indice_renovacion_resumen
ALTER TABLE kpi_indice_renovacion_resumen 
DROP CONSTRAINT IF EXISTS kpi_indice_renovacion_resumen_owner_id_anio_mes_key;

-- kpi_roe_roa_resumen
ALTER TABLE kpi_roe_roa_resumen 
DROP CONSTRAINT IF EXISTS kpi_roe_roa_resumen_owner_id_anio_mes_key;

-- kpi_colocacion_resumen_1
ALTER TABLE kpi_colocacion_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_1_owner_id_anio_mes_key;
ALTER TABLE kpi_colocacion_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_1_unique;

-- kpi_colocacion_resumen_2
ALTER TABLE kpi_colocacion_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_2_owner_id_anio_mes_key;
ALTER TABLE kpi_colocacion_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_2_unique;

-- kpi_colocacion_resumen_3
ALTER TABLE kpi_colocacion_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_3_owner_id_anio_mes_key;
ALTER TABLE kpi_colocacion_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_3_unique;

-- kpi_rentabilidad_resumen_1
ALTER TABLE kpi_rentabilidad_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_1_owner_id_anio_mes_key;
ALTER TABLE kpi_rentabilidad_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_1_unique;

-- kpi_rentabilidad_resumen_2
ALTER TABLE kpi_rentabilidad_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_2_owner_id_anio_mes_key;
ALTER TABLE kpi_rentabilidad_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_2_unique;

-- kpi_rentabilidad_resumen_3
ALTER TABLE kpi_rentabilidad_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_3_owner_id_anio_mes_key;
ALTER TABLE kpi_rentabilidad_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_3_unique;

-- kpi_rentabilidad_resumen_4
ALTER TABLE kpi_rentabilidad_resumen_4 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_4_owner_id_anio_mes_key;
ALTER TABLE kpi_rentabilidad_resumen_4 
DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_4_unique;

-- kpi_rotacion_resumen_1
ALTER TABLE kpi_rotacion_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_rotacion_resumen_1_owner_id_anio_mes_key;
ALTER TABLE kpi_rotacion_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_rotacion_resumen_1_unique;

-- kpi_rotacion_resumen_2
ALTER TABLE kpi_rotacion_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_rotacion_resumen_2_owner_id_anio_mes_key;

-- kpi_rotacion_resumen_3
ALTER TABLE kpi_rotacion_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_rotacion_resumen_3_owner_id_anio_mes_key;

-- kpi_rotacion_resumen_4
ALTER TABLE kpi_rotacion_resumen_4 
DROP CONSTRAINT IF EXISTS kpi_rotacion_resumen_4_owner_id_anio_mes_key;

-- kpi_escalabilidad_resumen_1
ALTER TABLE kpi_escalabilidad_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_escalabilidad_resumen_1_owner_id_anio_mes_key;

-- kpi_escalabilidad_resumen_2
ALTER TABLE kpi_escalabilidad_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_escalabilidad_resumen_2_owner_id_anio_mes_key;

-- kpi_escalabilidad_resumen_3
ALTER TABLE kpi_escalabilidad_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_escalabilidad_resumen_3_owner_id_anio_mes_key;

-- kpi_posicionamiento_resumen_1
ALTER TABLE kpi_posicionamiento_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_posicionamiento_resumen_1_owner_id_anio_mes_key;

-- kpi_posicionamiento_resumen_2
ALTER TABLE kpi_posicionamiento_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_posicionamiento_resumen_2_owner_id_anio_mes_key;

-- kpi_posicionamiento_resumen_3
ALTER TABLE kpi_posicionamiento_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_posicionamiento_resumen_3_owner_id_anio_mes_key;

-- kpi_innovacion_resumen
ALTER TABLE kpi_innovacion_resumen 
DROP CONSTRAINT IF EXISTS kpi_innovacion_resumen_owner_id_anio_mes_key;

-- kpi_satisfaccion_resumen_1
ALTER TABLE kpi_satisfaccion_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_satisfaccion_resumen_1_owner_id_anio_mes_key;
ALTER TABLE kpi_satisfaccion_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_satisfaccion_resumen_1_unique;

-- kpi_satisfaccion_resumen_2
ALTER TABLE kpi_satisfaccion_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_satisfaccion_resumen_2_owner_id_anio_mes_key;

-- kpi_satisfaccion_resumen_3
ALTER TABLE kpi_satisfaccion_resumen_3 
DROP CONSTRAINT IF EXISTS kpi_satisfaccion_resumen_3_owner_id_anio_mes_key;

-- kpi_cumplimiento_resumen_1
ALTER TABLE kpi_cumplimiento_resumen_1 
DROP CONSTRAINT IF EXISTS kpi_cumplimiento_resumen_1_owner_id_anio_mes_key;

-- kpi_cumplimiento_resumen_2
ALTER TABLE kpi_cumplimiento_resumen_2 
DROP CONSTRAINT IF EXISTS kpi_cumplimiento_resumen_2_owner_id_anio_mes_key;

-- kpi_gestion_riesgos_resumen
ALTER TABLE kpi_gestion_riesgos_resumen 
DROP CONSTRAINT IF EXISTS kpi_gestion_riesgos_resumen_owner_id_anio_mes_key;

-- kpi_gobierno_corporativo_resumen
ALTER TABLE kpi_gobierno_corporativo_resumen 
DROP CONSTRAINT IF EXISTS kpi_gobierno_corporativo_resumen_owner_id_anio_mes_key;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ejecutar esto para verificar que NO quedan constraints UNIQUE:
SELECT conname, conrelid::regclass as tabla
FROM pg_constraint
WHERE contype = 'u' 
  AND conrelid::regclass::text LIKE 'kpi_%_resumen%'
ORDER BY conrelid::regclass::text;

-- Si la consulta devuelve resultados vacíos, los constraints fueron eliminados.
-- Si aún hay constraints, ejecutar manualmente:
-- ALTER TABLE [nombre_tabla] DROP CONSTRAINT [nombre_constraint];

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Después de ejecutar este script, el sistema permitirá múltiples
--    registros para el mismo owner_id/anio/mes
-- 2. El campo is_current = true marca la versión vigente
-- 3. El trigger set_is_current_resumen() marca automáticamente:
--    - El nuevo registro como is_current = true
--    - Los anteriores del mismo año/mes como is_current = false
-- 4. Para consultar solo datos actuales:
--    SELECT * FROM kpi_xxx_resumen WHERE is_current = true;
