-- =====================================================
-- SQL: Agregar campo descripcion_observaciones a Cumplimiento Regulatorio
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-12-04
-- =====================================================

-- 1. Agregar columna descripcion_observaciones a la tabla de resumen de observaciones
ALTER TABLE kpi_cumplimiento_resumen_2
ADD COLUMN IF NOT EXISTS descripcion_observaciones TEXT;

-- 2. Agregar comentario descriptivo
COMMENT ON COLUMN kpi_cumplimiento_resumen_2.descripcion_observaciones IS 'Descripción detallada de las observaciones CNBV/CONDUSEF';

-- 3. Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kpi_cumplimiento_resumen_2'
ORDER BY ordinal_position;
