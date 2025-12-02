-- =====================================================
-- SQL PARA POLÍTICAS RLS - TODOS PUEDEN VER, CREAR Y EDITAR
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Este script actualiza las políticas para que:
-- - Cualquier usuario autenticado puede VER todos los registros
-- - Cualquier usuario autenticado puede CREAR registros
-- - Cualquier usuario autenticado puede EDITAR registros
-- - NADIE puede BORRAR (solo desde Supabase directamente)

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
        -- Eliminar TODAS las políticas existentes
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_all" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert_all" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update_all" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_delete_own" ON %I', table_name, table_name);
        
        -- SELECT: Todos los usuarios autenticados pueden ver todos los registros
        EXECUTE format('
            CREATE POLICY "%s_select_all" ON %I
            FOR SELECT 
            TO authenticated
            USING (true)
        ', table_name, table_name);
        
        -- INSERT: Todos los usuarios autenticados pueden crear registros
        EXECUTE format('
            CREATE POLICY "%s_insert_all" ON %I
            FOR INSERT 
            TO authenticated
            WITH CHECK (true)
        ', table_name, table_name);
        
        -- UPDATE: Todos los usuarios autenticados pueden editar registros
        EXECUTE format('
            CREATE POLICY "%s_update_all" ON %I
            FOR UPDATE 
            TO authenticated
            USING (true)
        ', table_name, table_name);
        
        -- DELETE: NO hay política = NADIE puede borrar desde la app
        -- Solo se puede borrar desde Supabase Dashboard directamente
        
        RAISE NOTICE 'Políticas actualizadas para: %', table_name;
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
