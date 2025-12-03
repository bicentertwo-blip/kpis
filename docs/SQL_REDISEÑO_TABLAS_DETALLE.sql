-- =====================================================
-- SQL PARA REDISEÑAR TABLAS DE DETALLE
-- Ejecutar en Supabase SQL Editor
-- =====================================================
-- IMPORTANTE: Este script modifica la estructura de 4 tablas de detalle:
-- 1. kpi_margen_financiero_detalle
-- 2. kpi_roe_roa_detalle (Rentabilidad Operativa)
-- 3. kpi_rentabilidad_detalle_4 (Gasto por Crédito)
-- 4. kpi_gobierno_corporativo_detalle
-- =====================================================

-- =====================================================
-- 1. MARGEN FINANCIERO DETALLE
-- =====================================================
-- Campos nuevos: Ingresos, Costo Financiero, Margen Financiero
-- Campos a eliminar: concepto, valor, categoria

-- Agregar nuevas columnas
ALTER TABLE kpi_margen_financiero_detalle 
ADD COLUMN IF NOT EXISTS ingresos DECIMAL(18,2);

ALTER TABLE kpi_margen_financiero_detalle 
ADD COLUMN IF NOT EXISTS costo_financiero DECIMAL(18,2);

ALTER TABLE kpi_margen_financiero_detalle 
ADD COLUMN IF NOT EXISTS margen_financiero DECIMAL(18,2);

-- Comentarios para las nuevas columnas
COMMENT ON COLUMN kpi_margen_financiero_detalle.ingresos IS 'Ingresos del período';
COMMENT ON COLUMN kpi_margen_financiero_detalle.costo_financiero IS 'Costo financiero del período';
COMMENT ON COLUMN kpi_margen_financiero_detalle.margen_financiero IS 'Margen financiero calculado (Ingresos - Costo)';

-- Eliminar columnas obsoletas (después de migrar datos si es necesario)
ALTER TABLE kpi_margen_financiero_detalle 
DROP COLUMN IF EXISTS concepto;

ALTER TABLE kpi_margen_financiero_detalle 
DROP COLUMN IF EXISTS valor;

ALTER TABLE kpi_margen_financiero_detalle 
DROP COLUMN IF EXISTS categoria;

-- =====================================================
-- 2. RENTABILIDAD OPERATIVA (kpi_roe_roa_detalle)
-- =====================================================
-- Campos actuales: entidad, capital_contable, utilidad_operativa, activo_total
-- Campos nuevos: utilidad_neta, roe_operativo, roa_operativo, roe_neto, roa_neto,
--                meta_roe_operativo, meta_roa_operativo, meta_roe_neto, meta_roa_neto

-- Agregar utilidad_operativa (si no existe - en caso de que la columna original era diferente)
ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS utilidad_operativa DECIMAL(18,2);

-- Agregar utilidad_neta (si no existe)
ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS utilidad_neta DECIMAL(18,2);

-- Agregar indicadores calculados
ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS roe_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS roa_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS roa_neto DECIMAL(8,4);

-- Agregar metas
ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS meta_roe_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS meta_roa_operativo DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS meta_roe_neto DECIMAL(8,4);

ALTER TABLE kpi_roe_roa_detalle 
ADD COLUMN IF NOT EXISTS meta_roa_neto DECIMAL(8,4);

-- Comentarios
COMMENT ON COLUMN kpi_roe_roa_detalle.utilidad_operativa IS 'Utilidad Operativa del período';
COMMENT ON COLUMN kpi_roe_roa_detalle.utilidad_neta IS 'Utilidad Neta del período';
COMMENT ON COLUMN kpi_roe_roa_detalle.roe_operativo IS 'ROE Operativo = Utilidad Operativa / Capital Contable';
COMMENT ON COLUMN kpi_roe_roa_detalle.roa_operativo IS 'ROA Operativo = Utilidad Operativa / Activo Total';
COMMENT ON COLUMN kpi_roe_roa_detalle.roe_neto IS 'ROE Neto = Utilidad Neta / Capital Contable';
COMMENT ON COLUMN kpi_roe_roa_detalle.roa_neto IS 'ROA Neto = Utilidad Neta / Activo Total';
COMMENT ON COLUMN kpi_roe_roa_detalle.meta_roe_operativo IS 'Meta ROE Operativo';
COMMENT ON COLUMN kpi_roe_roa_detalle.meta_roa_operativo IS 'Meta ROA Operativo';
COMMENT ON COLUMN kpi_roe_roa_detalle.meta_roe_neto IS 'Meta ROE Neto';
COMMENT ON COLUMN kpi_roe_roa_detalle.meta_roa_neto IS 'Meta ROA Neto';

-- =====================================================
-- 3. DETALLE GASTO POR CRÉDITO (kpi_rentabilidad_detalle_4)
-- =====================================================
-- Campos actuales: entidad, plaza, producto, concepto, monto, meta
-- Campos nuevos: gasto_por_credito (reemplaza monto)
-- Campos a eliminar: concepto, monto

-- Agregar gasto_por_credito
ALTER TABLE kpi_rentabilidad_detalle_4 
ADD COLUMN IF NOT EXISTS gasto_por_credito DECIMAL(18,2);

-- Migrar datos de monto a gasto_por_credito (si hay datos existentes)
UPDATE kpi_rentabilidad_detalle_4 
SET gasto_por_credito = monto 
WHERE gasto_por_credito IS NULL AND monto IS NOT NULL;

-- Eliminar columnas obsoletas
ALTER TABLE kpi_rentabilidad_detalle_4 
DROP COLUMN IF EXISTS concepto;

ALTER TABLE kpi_rentabilidad_detalle_4 
DROP COLUMN IF EXISTS monto;

-- Comentario
COMMENT ON COLUMN kpi_rentabilidad_detalle_4.gasto_por_credito IS 'Gasto por crédito del período';

-- =====================================================
-- 4. GOBIERNO CORPORATIVO DETALLE
-- =====================================================
-- Campos actuales: comite, sesiones, acuerdos_por_area, kpis_reportados, seguimiento_politicas, meta
-- Campo nuevo: acuerdos_cumplidos

-- Agregar acuerdos_cumplidos
ALTER TABLE kpi_gobierno_corporativo_detalle 
ADD COLUMN IF NOT EXISTS acuerdos_cumplidos INTEGER;

-- Comentario
COMMENT ON COLUMN kpi_gobierno_corporativo_detalle.acuerdos_cumplidos IS 'Número de acuerdos cumplidos en el período';

-- =====================================================
-- VERIFICACIÓN DE ESTRUCTURA
-- =====================================================

-- Verificar estructura de kpi_margen_financiero_detalle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kpi_margen_financiero_detalle'
ORDER BY ordinal_position;

-- Verificar estructura de kpi_roe_roa_detalle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kpi_roe_roa_detalle'
ORDER BY ordinal_position;

-- Verificar estructura de kpi_rentabilidad_detalle_4
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kpi_rentabilidad_detalle_4'
ORDER BY ordinal_position;

-- Verificar estructura de kpi_gobierno_corporativo_detalle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kpi_gobierno_corporativo_detalle'
ORDER BY ordinal_position;

-- =====================================================
-- ESTRUCTURA FINAL ESPERADA
-- =====================================================

-- kpi_margen_financiero_detalle:
-- id, owner_id, anio, mes, entidad, region, plaza, producto, ingresos, costo_financiero, margen_financiero, meta, created_at

-- kpi_roe_roa_detalle:
-- id, owner_id, anio, mes, entidad, capital_contable, utilidad_operativa, utilidad_neta, activo_total, 
-- roe_operativo, roa_operativo, roe_neto, roa_neto, meta_roe_operativo, meta_roa_operativo, meta_roe_neto, meta_roa_neto, created_at

-- kpi_rentabilidad_detalle_4:
-- id, owner_id, anio, mes, entidad, plaza, producto, gasto_por_credito, meta, created_at

-- kpi_gobierno_corporativo_detalle:
-- id, owner_id, anio, mes, comite, sesiones, acuerdos_por_area, kpis_reportados, seguimiento_politicas, acuerdos_cumplidos, meta, created_at
