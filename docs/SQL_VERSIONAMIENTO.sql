-- =====================================================
-- SQL PARA MARCAR Y LIMPIAR DATOS DUPLICADOS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Este script:
-- 1. Agrega campo is_current para identificar la versión vigente
-- 2. Marca automáticamente los registros más recientes como actuales
-- 3. Crea función para eliminar los duplicados obsoletos

-- =====================================================
-- PASO 1: AGREGAR CAMPO is_current A TODAS LAS TABLAS
-- =====================================================

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
        -- Agregar campo is_current
        EXECUTE format('
            ALTER TABLE %I 
            ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true
        ', table_name);
        
        -- Crear índice para consultas rápidas
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_current 
            ON %I (is_current) 
            WHERE is_current = true
        ', table_name, table_name);
        
        RAISE NOTICE 'Campo is_current agregado a: %', table_name;
    END LOOP;
END $$;

-- =====================================================
-- PASO 2: MARCAR VERSIÓN ACTUAL EN TABLAS DE RESUMEN
-- (El más reciente por año/mes es el actual)
-- =====================================================

DO $$
DECLARE
    table_name TEXT;
    resumen_tables TEXT[] := ARRAY[
        'kpi_margen_financiero_resumen',
        'kpi_indice_renovacion_resumen',
        'kpi_roe_roa_resumen',
        'kpi_colocacion_resumen_1', 'kpi_colocacion_resumen_2', 'kpi_colocacion_resumen_3',
        'kpi_rentabilidad_resumen_1', 'kpi_rentabilidad_resumen_2', 'kpi_rentabilidad_resumen_3', 'kpi_rentabilidad_resumen_4',
        'kpi_rotacion_resumen_1', 'kpi_rotacion_resumen_2', 'kpi_rotacion_resumen_3', 'kpi_rotacion_resumen_4',
        'kpi_escalabilidad_resumen_1', 'kpi_escalabilidad_resumen_2', 'kpi_escalabilidad_resumen_3',
        'kpi_posicionamiento_resumen_1', 'kpi_posicionamiento_resumen_2', 'kpi_posicionamiento_resumen_3',
        'kpi_innovacion_resumen',
        'kpi_satisfaccion_resumen_1', 'kpi_satisfaccion_resumen_2', 'kpi_satisfaccion_resumen_3',
        'kpi_cumplimiento_resumen_1', 'kpi_cumplimiento_resumen_2',
        'kpi_gestion_riesgos_resumen',
        'kpi_gobierno_corporativo_resumen'
    ];
BEGIN
    FOREACH table_name IN ARRAY resumen_tables
    LOOP
        -- Marcar todos como NO actuales
        EXECUTE format('UPDATE %I SET is_current = false', table_name);
        
        -- Marcar solo el más reciente por año/mes como actual
        EXECUTE format('
            UPDATE %I t
            SET is_current = true
            FROM (
                SELECT DISTINCT ON (anio, mes) id
                FROM %I
                ORDER BY anio, mes, COALESCE(updated_at, created_at) DESC
            ) latest
            WHERE t.id = latest.id
        ', table_name, table_name);
        
        RAISE NOTICE 'Versión actual marcada en: %', table_name;
    END LOOP;
END $$;

-- =====================================================
-- PASO 3: MARCAR VERSIÓN ACTUAL EN TABLAS DE DETALLE
-- (La última carga completa es la actual)
-- =====================================================

DO $$
DECLARE
    table_name TEXT;
    detalle_tables TEXT[] := ARRAY[
        'kpi_margen_financiero_detalle',
        'kpi_indice_renovacion_detalle',
        'kpi_roe_roa_detalle',
        'kpi_colocacion_detalle_1', 'kpi_colocacion_detalle_2', 'kpi_colocacion_detalle_3',
        'kpi_rentabilidad_detalle_1', 'kpi_rentabilidad_detalle_2', 'kpi_rentabilidad_detalle_3', 'kpi_rentabilidad_detalle_4',
        'kpi_rotacion_detalle_1', 'kpi_rotacion_detalle_2', 'kpi_rotacion_detalle_3', 'kpi_rotacion_detalle_4',
        'kpi_escalabilidad_detalle_1', 'kpi_escalabilidad_detalle_2', 'kpi_escalabilidad_detalle_3',
        'kpi_posicionamiento_detalle_1', 'kpi_posicionamiento_detalle_2', 'kpi_posicionamiento_detalle_3',
        'kpi_innovacion_detalle',
        'kpi_satisfaccion_detalle_1', 'kpi_satisfaccion_detalle_2', 'kpi_satisfaccion_detalle_3',
        'kpi_gestion_riesgos_detalle',
        'kpi_gobierno_corporativo_detalle'
    ];
BEGIN
    FOREACH table_name IN ARRAY detalle_tables
    LOOP
        -- Marcar todos como NO actuales
        EXECUTE format('UPDATE %I SET is_current = false', table_name);
        
        -- La última carga por año (registros del último minuto de carga)
        EXECUTE format('
            WITH latest_upload AS (
                SELECT anio, MAX(created_at) as last_upload
                FROM %I
                GROUP BY anio
            )
            UPDATE %I t
            SET is_current = true
            FROM latest_upload lu
            WHERE t.anio = lu.anio 
            AND t.created_at >= lu.last_upload - INTERVAL ''1 minute''
        ', table_name, table_name);
        
        RAISE NOTICE 'Versión actual marcada en: %', table_name;
    END LOOP;
END $$;

-- =====================================================
-- PASO 4: FUNCIÓN PARA VER RESUMEN DE DUPLICADOS
-- =====================================================

CREATE OR REPLACE FUNCTION get_duplicates_summary()
RETURNS TABLE (
    tabla TEXT,
    total BIGINT,
    actuales BIGINT,
    obsoletos BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tbl TEXT;
    total_count BIGINT;
    current_count BIGINT;
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
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', tbl) INTO total_count;
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE is_current = true', tbl) INTO current_count;
        
        IF total_count > 0 THEN
            tabla := tbl;
            total := total_count;
            actuales := current_count;
            obsoletos := total_count - current_count;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- =====================================================
-- PASO 5: FUNCIÓN PARA ELIMINAR DUPLICADOS OBSOLETOS
-- =====================================================

CREATE OR REPLACE FUNCTION delete_obsolete_records(
    p_dry_run BOOLEAN DEFAULT true  -- true = solo muestra, false = borra
)
RETURNS TABLE (
    tabla TEXT,
    registros_eliminados BIGINT,
    accion TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tbl TEXT;
    delete_count BIGINT;
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
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE is_current = false', tbl) INTO delete_count;
        
        IF delete_count > 0 THEN
            IF p_dry_run THEN
                tabla := tbl;
                registros_eliminados := delete_count;
                accion := '⚠️ SE ELIMINARÍAN (dry run)';
                RETURN NEXT;
            ELSE
                EXECUTE format('DELETE FROM %I WHERE is_current = false', tbl);
                tabla := tbl;
                registros_eliminados := delete_count;
                accion := '✅ ELIMINADOS';
                RETURN NEXT;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- =====================================================
-- CÓMO USAR
-- =====================================================

-- 1. Ver cuántos duplicados hay:
--    SELECT * FROM get_duplicates_summary();

-- 2. Previsualizar qué se borraría (SEGURO - no borra nada):
--    SELECT * FROM delete_obsolete_records(true);

-- 3. BORRAR los duplicados obsoletos (¡CUIDADO! Es permanente):
--    SELECT * FROM delete_obsolete_records(false);

-- 4. Consultar solo datos actuales de cualquier tabla:
--    SELECT * FROM kpi_margen_financiero_resumen WHERE is_current = true;

-- =====================================================
-- PASO 6: TRIGGER AUTOMÁTICO PARA TABLAS DE RESUMEN
-- (Marca automáticamente is_current cuando hay insert/update)
-- =====================================================

-- Función que se ejecuta ANTES de insertar en tablas de resumen
-- Usa updated_at para determinar cuál es más reciente
CREATE OR REPLACE FUNCTION set_is_current_resumen()
RETURNS TRIGGER AS $$
BEGIN
    -- El nuevo registro siempre será el actual
    NEW.is_current := true;
    
    -- Marcar registros anteriores del mismo año/mes como NO actuales
    -- Solo si su updated_at es anterior al momento actual
    EXECUTE format('
        UPDATE %I 
        SET is_current = false 
        WHERE anio = $1 
          AND mes = $2 
          AND is_current = true
          AND id != COALESCE($3, uuid_nil())
    ', TG_TABLE_NAME)
    USING NEW.anio, NEW.mes, NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para todas las tablas de resumen
DO $$
DECLARE
    table_name TEXT;
    resumen_tables TEXT[] := ARRAY[
        'kpi_margen_financiero_resumen',
        'kpi_indice_renovacion_resumen',
        'kpi_roe_roa_resumen',
        'kpi_colocacion_resumen_1', 'kpi_colocacion_resumen_2', 'kpi_colocacion_resumen_3',
        'kpi_rentabilidad_resumen_1', 'kpi_rentabilidad_resumen_2', 'kpi_rentabilidad_resumen_3', 'kpi_rentabilidad_resumen_4',
        'kpi_rotacion_resumen_1', 'kpi_rotacion_resumen_2', 'kpi_rotacion_resumen_3', 'kpi_rotacion_resumen_4',
        'kpi_escalabilidad_resumen_1', 'kpi_escalabilidad_resumen_2', 'kpi_escalabilidad_resumen_3',
        'kpi_posicionamiento_resumen_1', 'kpi_posicionamiento_resumen_2', 'kpi_posicionamiento_resumen_3',
        'kpi_innovacion_resumen',
        'kpi_satisfaccion_resumen_1', 'kpi_satisfaccion_resumen_2', 'kpi_satisfaccion_resumen_3',
        'kpi_cumplimiento_resumen_1', 'kpi_cumplimiento_resumen_2',
        'kpi_gestion_riesgos_resumen',
        'kpi_gobierno_corporativo_resumen'
    ];
BEGIN
    FOREACH table_name IN ARRAY resumen_tables
    LOOP
        -- Eliminar trigger si existe
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_is_current ON %I', table_name);
        
        -- Crear nuevo trigger para INSERT
        EXECUTE format('
            CREATE TRIGGER trg_set_is_current
            BEFORE INSERT ON %I
            FOR EACH ROW
            EXECUTE FUNCTION set_is_current_resumen()
        ', table_name);
        
        -- También trigger para UPDATE (cuando editan, actualizar is_current)
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_is_current_update ON %I', table_name);
        EXECUTE format('
            CREATE TRIGGER trg_set_is_current_update
            BEFORE UPDATE ON %I
            FOR EACH ROW
            WHEN (OLD.anio IS DISTINCT FROM NEW.anio OR OLD.mes IS DISTINCT FROM NEW.mes)
            EXECUTE FUNCTION set_is_current_resumen()
        ', table_name);
        
        RAISE NOTICE 'Trigger creado para: %', table_name;
    END LOOP;
END $$;

-- =====================================================
-- PASO 7: TRIGGER AUTOMÁTICO PARA TABLAS DE DETALLE
-- (Marca automáticamente is_current cuando hay insert)
-- Usa created_at - la última carga es la actual
-- =====================================================

-- Función que se ejecuta ANTES de insertar en tablas de detalle
CREATE OR REPLACE FUNCTION set_is_current_detalle()
RETURNS TRIGGER AS $$
DECLARE
    last_created TIMESTAMP WITH TIME ZONE;
BEGIN
    -- El nuevo registro siempre será el actual
    NEW.is_current := true;
    
    -- Obtener el timestamp de la última carga para este año
    EXECUTE format('
        SELECT MAX(created_at) FROM %I WHERE anio = $1
    ', TG_TABLE_NAME)
    INTO last_created
    USING NEW.anio;
    
    -- Si hay registros anteriores y la última carga fue hace más de 30 segundos,
    -- marcar los anteriores como NO actuales (nueva carga)
    IF last_created IS NOT NULL AND last_created < NOW() - INTERVAL '30 seconds' THEN
        EXECUTE format('
            UPDATE %I 
            SET is_current = false 
            WHERE anio = $1 AND is_current = true
        ', TG_TABLE_NAME)
        USING NEW.anio;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para todas las tablas de detalle
DO $$
DECLARE
    table_name TEXT;
    detalle_tables TEXT[] := ARRAY[
        'kpi_margen_financiero_detalle',
        'kpi_indice_renovacion_detalle',
        'kpi_roe_roa_detalle',
        'kpi_colocacion_detalle_1', 'kpi_colocacion_detalle_2', 'kpi_colocacion_detalle_3',
        'kpi_rentabilidad_detalle_1', 'kpi_rentabilidad_detalle_2', 'kpi_rentabilidad_detalle_3', 'kpi_rentabilidad_detalle_4',
        'kpi_rotacion_detalle_1', 'kpi_rotacion_detalle_2', 'kpi_rotacion_detalle_3', 'kpi_rotacion_detalle_4',
        'kpi_escalabilidad_detalle_1', 'kpi_escalabilidad_detalle_2', 'kpi_escalabilidad_detalle_3',
        'kpi_posicionamiento_detalle_1', 'kpi_posicionamiento_detalle_2', 'kpi_posicionamiento_detalle_3',
        'kpi_innovacion_detalle',
        'kpi_satisfaccion_detalle_1', 'kpi_satisfaccion_detalle_2', 'kpi_satisfaccion_detalle_3',
        'kpi_gestion_riesgos_detalle',
        'kpi_gobierno_corporativo_detalle'
    ];
BEGIN
    FOREACH table_name IN ARRAY detalle_tables
    LOOP
        -- Eliminar trigger si existe
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_is_current ON %I', table_name);
        
        -- Crear nuevo trigger
        EXECUTE format('
            CREATE TRIGGER trg_set_is_current
            BEFORE INSERT ON %I
            FOR EACH ROW
            EXECUTE FUNCTION set_is_current_detalle()
        ', table_name);
        
        RAISE NOTICE 'Trigger creado para: %', table_name;
    END LOOP;
END $$;
