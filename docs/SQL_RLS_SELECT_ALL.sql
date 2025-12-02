-- =====================================================
-- SQL PARA PERMITIR QUE TODOS LOS USUARIOS VEAN TODOS LOS DATOS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Este script actualiza las políticas de SELECT para que
-- cualquier usuario autenticado pueda ver TODOS los registros
-- Las políticas de INSERT, UPDATE y DELETE siguen siendo solo para el owner

DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'kpi_margen_financiero_resumen', 'kpi_margen_financiero_detalle',
        'kpi_indice_renovacion_resumen', 'kpi_indice_renovacion_detalle',
        'kpi_roe_roa_resumen', 'kpi_roe_roa_detalle',
        'kpi_colocacion_resumen_1', 'kpi_colocacion_resumen_2', 'kpi_colocacion_resumen_3',
        'kpi_colocacion_detalle_1', 'kpi_colocacion_detalle_2', 'kpi_colocacion_detalle_3',
        'kpi_rentabilidad_resumen_1', 'kpi_rentabilidad_resumen_2', 'kpi_rentabilidad_resumen_3', 'kpi_rentabilidad_resumen_4',
        'kpi_rentabilidad_detalle_1', 'kpi_rentabilidad_detalle_2', 'kpi_rentabilidad_detalle_3', 'kpi_rentabilidad_detalle_4',
        'kpi_rotacion_resumen_1', 'kpi_rotacion_resumen_2', 'kpi_rotacion_resumen_3', 'kpi_rotacion_resumen_4',
        'kpi_rotacion_detalle_1', 'kpi_rotacion_detalle_2', 'kpi_rotacion_detalle_3', 'kpi_rotacion_detalle_4',
        'kpi_escalabilidad_resumen_1', 'kpi_escalabilidad_resumen_2', 'kpi_escalabilidad_resumen_3',
        'kpi_escalabilidad_detalle_1', 'kpi_escalabilidad_detalle_2', 'kpi_escalabilidad_detalle_3',
        'kpi_posicionamiento_resumen_1', 'kpi_posicionamiento_resumen_2', 'kpi_posicionamiento_resumen_3',
        'kpi_posicionamiento_detalle_1', 'kpi_posicionamiento_detalle_2', 'kpi_posicionamiento_detalle_3',
        'kpi_innovacion_resumen', 'kpi_innovacion_detalle',
        'kpi_satisfaccion_resumen_1', 'kpi_satisfaccion_resumen_2', 'kpi_satisfaccion_resumen_3',
        'kpi_satisfaccion_detalle_1', 'kpi_satisfaccion_detalle_2', 'kpi_satisfaccion_detalle_3',
        'kpi_cumplimiento_resumen_1', 'kpi_cumplimiento_resumen_2',
        'kpi_gestion_riesgos_resumen', 'kpi_gestion_riesgos_detalle',
        'kpi_gobierno_corporativo_resumen', 'kpi_gobierno_corporativo_detalle'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Eliminar política SELECT existente
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_all" ON %I', table_name, table_name);
        
        -- Nueva política SELECT: TODOS los usuarios autenticados pueden ver TODOS los registros
        EXECUTE format('
            CREATE POLICY "%s_select_all" ON %I
            FOR SELECT 
            TO authenticated
            USING (true)
        ', table_name, table_name);
        
        RAISE NOTICE 'Política SELECT actualizada para: %', table_name;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Después de ejecutar, puedes verificar las políticas con:
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename LIKE 'kpi_%'
-- ORDER BY tablename, cmd;
