-- =====================================================
-- SQL PARA MODIFICAR TABLA ROE/ROA CON CAMPOS ESPECÍFICOS
-- Separa ROE/ROA Operativo y Neto con sus metas
-- =====================================================

-- =====================================================
-- PASO 1: Modificar tabla kpi_roe_roa_resumen
-- =====================================================

-- Renombrar columnas existentes a operativos
ALTER TABLE kpi_roe_roa_resumen 
RENAME COLUMN roe TO roe_operativo;

ALTER TABLE kpi_roe_roa_resumen 
RENAME COLUMN roa TO roa_operativo;

ALTER TABLE kpi_roe_roa_resumen 
RENAME COLUMN meta_roe TO meta_roe_operativo;

ALTER TABLE kpi_roe_roa_resumen 
RENAME COLUMN meta_roa TO meta_roa_operativo;

-- Agregar columnas para ROE/ROA Neto
ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS roa_neto DECIMAL(8,4);

-- Agregar metas mensuales para netos
ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_roa_neto DECIMAL(8,4);

-- Renombrar meta_anual existente a meta_anual_roe_operativo
ALTER TABLE kpi_roe_roa_resumen 
RENAME COLUMN meta_anual TO meta_anual_roe_operativo;

-- Agregar metas anuales faltantes
ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roa_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roa_neto DECIMAL(8,4);

-- =====================================================
-- PASO 2: Modificar tabla kpi_roe_roa_detalle
-- =====================================================

-- Agregar columnas de ROE/ROA operativo y neto
ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS utilidad_neta DECIMAL(18,2);

-- Renombrar columna existente
ALTER TABLE kpi_roe_roa_detalle
RENAME COLUMN utilidad_operativa_mensual TO utilidad_operativa;

-- Agregar columnas calculadas/reportadas
ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS roe_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS roa_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS roa_neto DECIMAL(8,4);

-- Agregar metas por detalle
ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS meta_roe_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS meta_roa_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS meta_roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS meta_roa_neto DECIMAL(8,4);

-- =====================================================
-- PASO 3: Comentarios actualizados
-- =====================================================

COMMENT ON COLUMN kpi_roe_roa_resumen.roe_operativo IS 'ROE Operativo: Utilidad Operativa / Capital Contable (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.roa_operativo IS 'ROA Operativo: Utilidad Operativa / Activo Total (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.roe_neto IS 'ROE Neto: Utilidad Neta / Capital Contable (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.roa_neto IS 'ROA Neto: Utilidad Neta / Activo Total (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_roe_operativo IS 'Meta mensual de ROE Operativo (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_roa_operativo IS 'Meta mensual de ROA Operativo (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_roe_neto IS 'Meta mensual de ROE Neto (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_roa_neto IS 'Meta mensual de ROA Neto (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_anual_roe_operativo IS 'Meta anual de ROE Operativo (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_anual_roe_neto IS 'Meta anual de ROE Neto (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_anual_roa_operativo IS 'Meta anual de ROA Operativo (%)';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_anual_roa_neto IS 'Meta anual de ROA Neto (%)';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver estructura de tabla resumen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'kpi_roe_roa_resumen'
ORDER BY ordinal_position;

-- Ver estructura de tabla detalle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'kpi_roe_roa_detalle'
ORDER BY ordinal_position;
