-- ============================================
-- AGREGAR COLUMNA utilidad_neta A kpi_roe_roa_detalle
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Agregar la columna utilidad_neta
ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS utilidad_neta NUMERIC;

-- Agregar comentario descriptivo
COMMENT ON COLUMN kpi_roe_roa_detalle.utilidad_neta IS 'Utilidad Neta del período';

-- Verificar la estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kpi_roe_roa_detalle'
ORDER BY ordinal_position;
