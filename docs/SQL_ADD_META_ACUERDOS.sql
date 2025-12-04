-- =====================================================
-- SQL: Agregar campo meta_acuerdos a Gobierno Corporativo
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-12-04
-- =====================================================

-- 1. Agregar columna meta_acuerdos a la tabla de resumen
ALTER TABLE kpi_gobierno_corporativo_resumen
ADD COLUMN IF NOT EXISTS meta_acuerdos NUMERIC(5,2);

-- 2. Agregar comentario descriptivo
COMMENT ON COLUMN kpi_gobierno_corporativo_resumen.meta_acuerdos IS 'Meta de porcentaje de acuerdos cumplidos (%)';

-- 3. Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kpi_gobierno_corporativo_resumen'
ORDER BY ordinal_position;
