-- =====================================================
-- SQL PARA MODIFICAR TABLA ROE/ROA CON CAMPOS ESPECÍFICOS
-- Separa ROE/ROA Operativo y Neto con sus metas
-- =====================================================

-- =====================================================
-- PASO 1: Modificar tabla kpi_roe_roa_resumen
-- =====================================================

-- Renombrar columnas existentes a operativos (si existen)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kpi_roe_roa_resumen' AND column_name = 'roe') THEN
        ALTER TABLE kpi_roe_roa_resumen RENAME COLUMN roe TO roe_operativo;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kpi_roe_roa_resumen' AND column_name = 'roa') THEN
        ALTER TABLE kpi_roe_roa_resumen RENAME COLUMN roa TO roa_operativo;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kpi_roe_roa_resumen' AND column_name = 'meta_roe') THEN
        ALTER TABLE kpi_roe_roa_resumen RENAME COLUMN meta_roe TO meta_roe_operativo;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kpi_roe_roa_resumen' AND column_name = 'meta_roa') THEN
        ALTER TABLE kpi_roe_roa_resumen RENAME COLUMN meta_roa TO meta_roa_operativo;
    END IF;
END $$;

-- Agregar columnas operativas si no existen (por si es tabla nueva)
ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS roe_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS roa_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_roe_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_roa_operativo DECIMAL(8,4);

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

-- Renombrar meta_anual si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kpi_roe_roa_resumen' AND column_name = 'meta_anual') THEN
        ALTER TABLE kpi_roe_roa_resumen RENAME COLUMN meta_anual TO meta_anual_roe_operativo;
    END IF;
END $$;

-- Agregar metas anuales
ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roe_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roa_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roa_neto DECIMAL(8,4);

-- =====================================================
-- PASO 2: Modificar tabla kpi_roe_roa_detalle
-- =====================================================

-- Agregar columna utilidad_neta
ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS utilidad_neta DECIMAL(18,2);

-- Renombrar columna existente si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kpi_roe_roa_detalle' AND column_name = 'utilidad_operativa_mensual') THEN
        ALTER TABLE kpi_roe_roa_detalle RENAME COLUMN utilidad_operativa_mensual TO utilidad_operativa;
    END IF;
END $$;

-- Asegurar que utilidad_operativa existe
ALTER TABLE kpi_roe_roa_detalle
ADD COLUMN IF NOT EXISTS utilidad_operativa DECIMAL(18,2);

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
