-- =====================================================
-- ACTUALIZACIÓN DE TABLAS DE DETALLE PARA ESCALABILIDAD
-- Fecha: 2025-12-08
-- Descripción: Actualiza las tablas de detalle para incluir
-- campos de Macro-Proceso, Proceso, Sub-Proceso y Servicio
-- =====================================================

-- =====================================================
-- PASO 1: BACKUP DE DATOS EXISTENTES (OPCIONAL)
-- =====================================================
-- Si hay datos existentes que quieras preservar, ejecuta esto primero:
-- CREATE TABLE kpi_escalabilidad_detalle_1_backup AS SELECT * FROM kpi_escalabilidad_detalle_1;
-- CREATE TABLE kpi_escalabilidad_detalle_2_backup AS SELECT * FROM kpi_escalabilidad_detalle_2;
-- CREATE TABLE kpi_escalabilidad_detalle_3_backup AS SELECT * FROM kpi_escalabilidad_detalle_3;

-- =====================================================
-- PASO 2: ELIMINAR TABLAS ANTIGUAS
-- =====================================================
DROP TABLE IF EXISTS kpi_escalabilidad_detalle_1 CASCADE;
DROP TABLE IF EXISTS kpi_escalabilidad_detalle_2 CASCADE;
DROP TABLE IF EXISTS kpi_escalabilidad_detalle_3 CASCADE;

-- =====================================================
-- PASO 3: CREAR NUEVAS TABLAS CON ESTRUCTURA ACTUALIZADA
-- =====================================================

-- Detalle 1: Procesos Digitalizados
-- Campos: Año, Mes, Plaza, Macro-Proceso, Proceso, Sub-Proceso, Procesos Digitalizados, Meta
CREATE TABLE kpi_escalabilidad_detalle_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    plaza VARCHAR(255) NOT NULL,
    macro_proceso VARCHAR(255) NOT NULL,
    proceso VARCHAR(255) NOT NULL,
    sub_proceso VARCHAR(255),
    procesos_digitalizados DECIMAL(8,4) NOT NULL,
    meta DECIMAL(8,4),
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Detalle 1
CREATE INDEX idx_escalabilidad_det1_periodo ON kpi_escalabilidad_detalle_1(owner_id, anio, mes);
CREATE INDEX idx_escalabilidad_det1_plaza ON kpi_escalabilidad_detalle_1(owner_id, plaza);
CREATE INDEX idx_escalabilidad_det1_macro_proceso ON kpi_escalabilidad_detalle_1(owner_id, macro_proceso);
CREATE INDEX idx_escalabilidad_det1_proceso ON kpi_escalabilidad_detalle_1(owner_id, proceso);
CREATE INDEX idx_escalabilidad_det1_current ON kpi_escalabilidad_detalle_1(owner_id, is_current);

-- Comentarios para Detalle 1
COMMENT ON TABLE kpi_escalabilidad_detalle_1 IS 'Detalle de procesos digitalizados por plaza, macro-proceso, proceso y sub-proceso';
COMMENT ON COLUMN kpi_escalabilidad_detalle_1.macro_proceso IS 'Categoría principal del proceso (ej: Crédito, Cobranza, Atención)';
COMMENT ON COLUMN kpi_escalabilidad_detalle_1.proceso IS 'Proceso específico dentro del macro-proceso';
COMMENT ON COLUMN kpi_escalabilidad_detalle_1.sub_proceso IS 'Sub-proceso o variante específica (opcional)';
COMMENT ON COLUMN kpi_escalabilidad_detalle_1.procesos_digitalizados IS 'Porcentaje de procesos digitalizados (0-100)';


-- Detalle 2: Transacciones Automáticas
-- Campos: Año, Mes, Plaza, Macro-Proceso, Proceso, Sub-Proceso, Transacciones Automáticas, Meta
CREATE TABLE kpi_escalabilidad_detalle_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    plaza VARCHAR(255) NOT NULL,
    macro_proceso VARCHAR(255) NOT NULL,
    proceso VARCHAR(255) NOT NULL,
    sub_proceso VARCHAR(255),
    transacciones_automaticas DECIMAL(8,4) NOT NULL,
    meta DECIMAL(8,4),
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Detalle 2
CREATE INDEX idx_escalabilidad_det2_periodo ON kpi_escalabilidad_detalle_2(owner_id, anio, mes);
CREATE INDEX idx_escalabilidad_det2_plaza ON kpi_escalabilidad_detalle_2(owner_id, plaza);
CREATE INDEX idx_escalabilidad_det2_macro_proceso ON kpi_escalabilidad_detalle_2(owner_id, macro_proceso);
CREATE INDEX idx_escalabilidad_det2_proceso ON kpi_escalabilidad_detalle_2(owner_id, proceso);
CREATE INDEX idx_escalabilidad_det2_current ON kpi_escalabilidad_detalle_2(owner_id, is_current);

-- Comentarios para Detalle 2
COMMENT ON TABLE kpi_escalabilidad_detalle_2 IS 'Detalle de transacciones automáticas por plaza, macro-proceso, proceso y sub-proceso';
COMMENT ON COLUMN kpi_escalabilidad_detalle_2.transacciones_automaticas IS 'Porcentaje de transacciones automatizadas (0-100)';


-- Detalle 3: Cost to Serve
-- Campos: Año, Mes, Plaza, Servicio, Cost to Serve, Meta
CREATE TABLE kpi_escalabilidad_detalle_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    plaza VARCHAR(255) NOT NULL,
    servicio VARCHAR(255) NOT NULL,
    cost_to_serve DECIMAL(18,2) NOT NULL,
    meta DECIMAL(18,2),
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Detalle 3
CREATE INDEX idx_escalabilidad_det3_periodo ON kpi_escalabilidad_detalle_3(owner_id, anio, mes);
CREATE INDEX idx_escalabilidad_det3_plaza ON kpi_escalabilidad_detalle_3(owner_id, plaza);
CREATE INDEX idx_escalabilidad_det3_servicio ON kpi_escalabilidad_detalle_3(owner_id, servicio);
CREATE INDEX idx_escalabilidad_det3_current ON kpi_escalabilidad_detalle_3(owner_id, is_current);

-- Comentarios para Detalle 3
COMMENT ON TABLE kpi_escalabilidad_detalle_3 IS 'Detalle de Cost to Serve por plaza y servicio';
COMMENT ON COLUMN kpi_escalabilidad_detalle_3.servicio IS 'Tipo de servicio (ej: Crédito Personal, Crédito Hipotecario, Ahorro)';
COMMENT ON COLUMN kpi_escalabilidad_detalle_3.cost_to_serve IS 'Costo por cliente atendido en MXN';


-- =====================================================
-- PASO 4: HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE kpi_escalabilidad_detalle_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_detalle_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_detalle_3 ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- PASO 5: CREAR POLÍTICAS RLS
-- =====================================================

-- Políticas para Detalle 1: Procesos Digitalizados
CREATE POLICY "Users can view all escalabilidad_detalle_1"
    ON kpi_escalabilidad_detalle_1 FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own escalabilidad_detalle_1"
    ON kpi_escalabilidad_detalle_1 FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own escalabilidad_detalle_1"
    ON kpi_escalabilidad_detalle_1 FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own escalabilidad_detalle_1"
    ON kpi_escalabilidad_detalle_1 FOR DELETE
    USING (auth.uid() = owner_id);


-- Políticas para Detalle 2: Transacciones Automáticas
CREATE POLICY "Users can view all escalabilidad_detalle_2"
    ON kpi_escalabilidad_detalle_2 FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own escalabilidad_detalle_2"
    ON kpi_escalabilidad_detalle_2 FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own escalabilidad_detalle_2"
    ON kpi_escalabilidad_detalle_2 FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own escalabilidad_detalle_2"
    ON kpi_escalabilidad_detalle_2 FOR DELETE
    USING (auth.uid() = owner_id);


-- Políticas para Detalle 3: Cost to Serve
CREATE POLICY "Users can view all escalabilidad_detalle_3"
    ON kpi_escalabilidad_detalle_3 FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own escalabilidad_detalle_3"
    ON kpi_escalabilidad_detalle_3 FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own escalabilidad_detalle_3"
    ON kpi_escalabilidad_detalle_3 FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own escalabilidad_detalle_3"
    ON kpi_escalabilidad_detalle_3 FOR DELETE
    USING (auth.uid() = owner_id);


-- =====================================================
-- PASO 6: CREAR FUNCIÓN DE ACTUALIZACIÓN DE TIMESTAMP
-- =====================================================
-- Esta función ya debería existir, pero la creamos si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_escalabilidad_detalle_1_updated_at ON kpi_escalabilidad_detalle_1;
CREATE TRIGGER update_escalabilidad_detalle_1_updated_at
    BEFORE UPDATE ON kpi_escalabilidad_detalle_1
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_escalabilidad_detalle_2_updated_at ON kpi_escalabilidad_detalle_2;
CREATE TRIGGER update_escalabilidad_detalle_2_updated_at
    BEFORE UPDATE ON kpi_escalabilidad_detalle_2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_escalabilidad_detalle_3_updated_at ON kpi_escalabilidad_detalle_3;
CREATE TRIGGER update_escalabilidad_detalle_3_updated_at
    BEFORE UPDATE ON kpi_escalabilidad_detalle_3
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- VERIFICACIÓN: Mostrar estructura de las tablas creadas
-- =====================================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name IN ('kpi_escalabilidad_detalle_1', 'kpi_escalabilidad_detalle_2', 'kpi_escalabilidad_detalle_3')
-- ORDER BY table_name, ordinal_position;
