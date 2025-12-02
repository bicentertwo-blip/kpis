-- =====================================================
-- SQL PARA ELIMINAR CAMPOS DE TABLAS DE RESUMEN
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Este script elimina los campos:
-- - entidad
-- - plaza  
-- - puesto
-- - categoria
-- de las tablas de RESUMEN (no afecta las de detalle)

-- =====================================================
-- PASO 1: ELIMINAR CONSTRAINTS UNIQUE QUE USAN ESTOS CAMPOS
-- =====================================================

-- Primero hay que eliminar los constraints UNIQUE que incluyen estos campos
-- porque no podemos eliminar columnas que son parte de un constraint

-- kpi_colocacion_resumen_1: UNIQUE(owner_id, anio, mes, entidad)
ALTER TABLE kpi_colocacion_resumen_1 DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_1_owner_id_anio_mes_entidad_key;

-- kpi_colocacion_resumen_2: UNIQUE(owner_id, anio, mes, entidad, plaza)
ALTER TABLE kpi_colocacion_resumen_2 DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_2_owner_id_anio_mes_entidad_plaza_key;

-- kpi_colocacion_resumen_3: UNIQUE(owner_id, anio, mes, entidad)
ALTER TABLE kpi_colocacion_resumen_3 DROP CONSTRAINT IF EXISTS kpi_colocacion_resumen_3_owner_id_anio_mes_entidad_key;

-- kpi_rentabilidad_resumen_1: UNIQUE(owner_id, anio, mes, entidad)
ALTER TABLE kpi_rentabilidad_resumen_1 DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_1_owner_id_anio_mes_entidad_key;

-- kpi_rentabilidad_resumen_2: UNIQUE(owner_id, anio, mes, entidad)
ALTER TABLE kpi_rentabilidad_resumen_2 DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_2_owner_id_anio_mes_entidad_key;

-- kpi_rentabilidad_resumen_3: UNIQUE(owner_id, anio, mes, entidad)
ALTER TABLE kpi_rentabilidad_resumen_3 DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_3_owner_id_anio_mes_entidad_key;

-- kpi_rentabilidad_resumen_4: UNIQUE(owner_id, anio, mes, entidad)
ALTER TABLE kpi_rentabilidad_resumen_4 DROP CONSTRAINT IF EXISTS kpi_rentabilidad_resumen_4_owner_id_anio_mes_entidad_key;

-- kpi_rotacion_resumen_1: UNIQUE(owner_id, anio, mes, puesto)
ALTER TABLE kpi_rotacion_resumen_1 DROP CONSTRAINT IF EXISTS kpi_rotacion_resumen_1_owner_id_anio_mes_puesto_key;

-- kpi_satisfaccion_resumen_1: UNIQUE(owner_id, anio, mes, categoria)
ALTER TABLE kpi_satisfaccion_resumen_1 DROP CONSTRAINT IF EXISTS kpi_satisfaccion_resumen_1_owner_id_anio_mes_categoria_key;

-- =====================================================
-- PASO 2: ELIMINAR COLUMNAS
-- =====================================================

-- kpi_colocacion_resumen_1: eliminar entidad
ALTER TABLE kpi_colocacion_resumen_1 DROP COLUMN IF EXISTS entidad;

-- kpi_colocacion_resumen_2: eliminar entidad, plaza
ALTER TABLE kpi_colocacion_resumen_2 DROP COLUMN IF EXISTS entidad;
ALTER TABLE kpi_colocacion_resumen_2 DROP COLUMN IF EXISTS plaza;

-- kpi_colocacion_resumen_3: eliminar entidad
ALTER TABLE kpi_colocacion_resumen_3 DROP COLUMN IF EXISTS entidad;

-- kpi_rentabilidad_resumen_1: eliminar entidad
ALTER TABLE kpi_rentabilidad_resumen_1 DROP COLUMN IF EXISTS entidad;

-- kpi_rentabilidad_resumen_2: eliminar entidad
ALTER TABLE kpi_rentabilidad_resumen_2 DROP COLUMN IF EXISTS entidad;

-- kpi_rentabilidad_resumen_3: eliminar entidad
ALTER TABLE kpi_rentabilidad_resumen_3 DROP COLUMN IF EXISTS entidad;

-- kpi_rentabilidad_resumen_4: eliminar entidad
ALTER TABLE kpi_rentabilidad_resumen_4 DROP COLUMN IF EXISTS entidad;

-- kpi_rotacion_resumen_1: eliminar puesto
ALTER TABLE kpi_rotacion_resumen_1 DROP COLUMN IF EXISTS puesto;

-- kpi_satisfaccion_resumen_1: eliminar categoria
ALTER TABLE kpi_satisfaccion_resumen_1 DROP COLUMN IF EXISTS categoria;

-- =====================================================
-- PASO 3: ELIMINAR DUPLICADOS (mantener solo el más reciente)
-- =====================================================

-- Eliminar duplicados en kpi_colocacion_resumen_1
DELETE FROM kpi_colocacion_resumen_1 a
USING kpi_colocacion_resumen_1 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_colocacion_resumen_2
DELETE FROM kpi_colocacion_resumen_2 a
USING kpi_colocacion_resumen_2 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_colocacion_resumen_3
DELETE FROM kpi_colocacion_resumen_3 a
USING kpi_colocacion_resumen_3 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_rentabilidad_resumen_1
DELETE FROM kpi_rentabilidad_resumen_1 a
USING kpi_rentabilidad_resumen_1 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_rentabilidad_resumen_2
DELETE FROM kpi_rentabilidad_resumen_2 a
USING kpi_rentabilidad_resumen_2 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_rentabilidad_resumen_3
DELETE FROM kpi_rentabilidad_resumen_3 a
USING kpi_rentabilidad_resumen_3 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_rentabilidad_resumen_4
DELETE FROM kpi_rentabilidad_resumen_4 a
USING kpi_rentabilidad_resumen_4 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_rotacion_resumen_1
DELETE FROM kpi_rotacion_resumen_1 a
USING kpi_rotacion_resumen_1 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- Eliminar duplicados en kpi_satisfaccion_resumen_1
DELETE FROM kpi_satisfaccion_resumen_1 a
USING kpi_satisfaccion_resumen_1 b
WHERE a.owner_id = b.owner_id 
  AND a.anio = b.anio 
  AND a.mes = b.mes
  AND a.id < b.id;

-- =====================================================
-- PASO 4: CREAR NUEVOS CONSTRAINTS UNIQUE (solo anio, mes)
-- =====================================================

-- Ahora el unique es solo por owner_id, anio, mes
-- Esto significa: un registro por usuario por mes

ALTER TABLE kpi_colocacion_resumen_1 
ADD CONSTRAINT kpi_colocacion_resumen_1_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_colocacion_resumen_2 
ADD CONSTRAINT kpi_colocacion_resumen_2_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_colocacion_resumen_3 
ADD CONSTRAINT kpi_colocacion_resumen_3_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_rentabilidad_resumen_1 
ADD CONSTRAINT kpi_rentabilidad_resumen_1_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_rentabilidad_resumen_2 
ADD CONSTRAINT kpi_rentabilidad_resumen_2_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_rentabilidad_resumen_3 
ADD CONSTRAINT kpi_rentabilidad_resumen_3_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_rentabilidad_resumen_4 
ADD CONSTRAINT kpi_rentabilidad_resumen_4_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_rotacion_resumen_1 
ADD CONSTRAINT kpi_rotacion_resumen_1_unique UNIQUE (owner_id, anio, mes);

ALTER TABLE kpi_satisfaccion_resumen_1 
ADD CONSTRAINT kpi_satisfaccion_resumen_1_unique UNIQUE (owner_id, anio, mes);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ejecutar esto para verificar que las columnas fueron eliminadas:

SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name LIKE 'kpi_%_resumen%'
    AND column_name IN ('entidad', 'plaza', 'puesto', 'categoria')
ORDER BY table_name, column_name;

-- Si la consulta NO devuelve resultados, las columnas fueron eliminadas correctamente.
