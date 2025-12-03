-- =====================================================
-- SQL PARA AGREGAR META ANUAL A TODAS LAS TABLAS RESUMEN
-- Ejecutar en Supabase SQL Editor
-- =====================================================
-- Este script agrega la columna meta_anual a todas las tablas de resumen
-- para poder capturar la meta del año completo y calcular el progreso
-- =====================================================

-- KPI 1: Margen Financiero
ALTER TABLE kpi_margen_financiero_resumen 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_margen_financiero_resumen.meta_anual IS 'Meta anual del indicador';

-- KPI 2: Índice de Renovación
ALTER TABLE kpi_indice_renovacion_resumen 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_indice_renovacion_resumen.meta_anual IS 'Meta anual del indicador (porcentaje)';

-- KPI 3: ROE y ROA
ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roe DECIMAL(8,4);
ALTER TABLE kpi_roe_roa_resumen 
ADD COLUMN IF NOT EXISTS meta_anual_roa DECIMAL(8,4);
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_anual_roe IS 'Meta anual ROE';
COMMENT ON COLUMN kpi_roe_roa_resumen.meta_anual_roa IS 'Meta anual ROA';

-- KPI 4: Colocación (3 resúmenes)
ALTER TABLE kpi_colocacion_resumen_1 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_colocacion_resumen_1.meta_anual IS 'Meta anual de colocación';

ALTER TABLE kpi_colocacion_resumen_2 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_colocacion_resumen_2.meta_anual IS 'Meta anual IMOR';

ALTER TABLE kpi_colocacion_resumen_3 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_colocacion_resumen_3.meta_anual IS 'Meta anual crecimiento cartera';

-- KPI 5: Rentabilidad (4 resúmenes)
ALTER TABLE kpi_rentabilidad_resumen_1 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_rentabilidad_resumen_1.meta_anual IS 'Meta anual EBITDA';

ALTER TABLE kpi_rentabilidad_resumen_2 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_rentabilidad_resumen_2.meta_anual IS 'Meta anual Flujo Libre';

ALTER TABLE kpi_rentabilidad_resumen_3 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_rentabilidad_resumen_3.meta_anual IS 'Meta anual Flujo Operativo';

ALTER TABLE kpi_rentabilidad_resumen_4 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_rentabilidad_resumen_4.meta_anual IS 'Meta anual Gasto por Crédito';

-- KPI 6: Rotación de Personal (4 resúmenes)
ALTER TABLE kpi_rotacion_resumen_1 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_rotacion_resumen_1.meta_anual IS 'Meta anual índice rotación';

ALTER TABLE kpi_rotacion_resumen_2 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,2);
COMMENT ON COLUMN kpi_rotacion_resumen_2.meta_anual IS 'Meta anual días sin cubrir';

ALTER TABLE kpi_rotacion_resumen_3 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_rotacion_resumen_3.meta_anual IS 'Meta anual ausentismo';

ALTER TABLE kpi_rotacion_resumen_4 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_rotacion_resumen_4.meta_anual IS 'Meta anual permanencia';

-- KPI 7: Escalabilidad (3 resúmenes)
ALTER TABLE kpi_escalabilidad_resumen_1 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_escalabilidad_resumen_1.meta_anual IS 'Meta anual digitalización';

ALTER TABLE kpi_escalabilidad_resumen_2 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_escalabilidad_resumen_2.meta_anual IS 'Meta anual automatización';

ALTER TABLE kpi_escalabilidad_resumen_3 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_escalabilidad_resumen_3.meta_anual IS 'Meta anual capacidad operativa';

-- KPI 8: Posicionamiento de Marca (3 resúmenes)
ALTER TABLE kpi_posicionamiento_resumen_1 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_posicionamiento_resumen_1.meta_anual IS 'Meta anual recordación marca';

ALTER TABLE kpi_posicionamiento_resumen_2 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(18,2);
COMMENT ON COLUMN kpi_posicionamiento_resumen_2.meta_anual IS 'Meta anual alcance campañas';

ALTER TABLE kpi_posicionamiento_resumen_3 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_posicionamiento_resumen_3.meta_anual IS 'Meta anual engagement';

-- KPI 9: Innovación
ALTER TABLE kpi_innovacion_resumen 
ADD COLUMN IF NOT EXISTS meta_anual INTEGER;
COMMENT ON COLUMN kpi_innovacion_resumen.meta_anual IS 'Meta anual ideas/proyectos';

-- KPI 10: Satisfacción Cliente (3 resúmenes)
ALTER TABLE kpi_satisfaccion_resumen_1 
ADD COLUMN IF NOT EXISTS meta_anual INTEGER;
COMMENT ON COLUMN kpi_satisfaccion_resumen_1.meta_anual IS 'Meta anual NPS';

ALTER TABLE kpi_satisfaccion_resumen_2 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_satisfaccion_resumen_2.meta_anual IS 'Meta anual quejas 72h';

ALTER TABLE kpi_satisfaccion_resumen_3 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_satisfaccion_resumen_3.meta_anual IS 'Meta anual clima laboral';

-- KPI 11: Cumplimiento Regulatorio (2 resúmenes)
ALTER TABLE kpi_cumplimiento_resumen_1 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_cumplimiento_resumen_1.meta_anual IS 'Meta anual reportes a tiempo';

ALTER TABLE kpi_cumplimiento_resumen_2 
ADD COLUMN IF NOT EXISTS meta_anual INTEGER;
COMMENT ON COLUMN kpi_cumplimiento_resumen_2.meta_anual IS 'Meta anual observaciones';

-- KPI 12: Gestión de Riesgos
ALTER TABLE kpi_gestion_riesgos_resumen 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_gestion_riesgos_resumen.meta_anual IS 'Meta anual exposición al riesgo';

-- KPI 13: Gobierno Corporativo
ALTER TABLE kpi_gobierno_corporativo_resumen 
ADD COLUMN IF NOT EXISTS meta_anual DECIMAL(8,4);
COMMENT ON COLUMN kpi_gobierno_corporativo_resumen.meta_anual IS 'Meta anual acuerdos cumplidos';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que se agregaron las columnas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name LIKE 'meta_anual%'
  AND table_name LIKE 'kpi_%_resumen%'
ORDER BY table_name;
