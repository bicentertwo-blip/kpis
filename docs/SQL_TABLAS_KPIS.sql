-- =====================================================
-- SQL PARA CREAR TABLAS DE KPIs EN SUPABASE
-- Arquitectura: Resumen (formularios) + Detalle (CSV)
-- =====================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- KPI 1: MARGEN FINANCIERO
-- =====================================================

-- Tabla de Resumen
CREATE TABLE IF NOT EXISTS kpi_margen_financiero_resumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    monto_margen_financiero DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Tabla de Detalle
CREATE TABLE IF NOT EXISTS kpi_margen_financiero_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    region VARCHAR(255),
    plaza VARCHAR(255),
    producto VARCHAR(255),
    concepto VARCHAR(255),
    valor DECIMAL(18,2),
    categoria VARCHAR(255),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_margen_fin_detalle_periodo ON kpi_margen_financiero_detalle(owner_id, anio, mes);

-- =====================================================
-- KPI 2: ÍNDICE DE RENOVACIÓN
-- =====================================================

-- Tabla de Resumen
CREATE TABLE IF NOT EXISTS kpi_indice_renovacion_resumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    indice_renovacion DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Tabla de Detalle
CREATE TABLE IF NOT EXISTS kpi_indice_renovacion_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    plaza VARCHAR(255),
    total INTEGER,
    renovaciones INTEGER,
    nuevas INTEGER,
    indice_renovacion DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_renovacion_detalle_periodo ON kpi_indice_renovacion_detalle(owner_id, anio, mes);

-- =====================================================
-- KPI 3: ROE y ROA
-- =====================================================

-- Tabla de Resumen
CREATE TABLE IF NOT EXISTS kpi_roe_roa_resumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    roe DECIMAL(8,4),
    roa DECIMAL(8,4),
    meta_roe DECIMAL(8,4),
    meta_roa DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Tabla de Detalle
CREATE TABLE IF NOT EXISTS kpi_roe_roa_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    capital_contable DECIMAL(18,2),
    utilidad_operativa_mensual DECIMAL(18,2),
    activo_total DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_roe_roa_detalle_periodo ON kpi_roe_roa_detalle(owner_id, anio, mes);

-- =====================================================
-- KPI 4: COLOCACIÓN (3 resúmenes, 3 detalles)
-- =====================================================

-- Resumen 1: Monto de Colocación
CREATE TABLE IF NOT EXISTS kpi_colocacion_resumen_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    monto_colocacion DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, entidad)
);

-- Resumen 2: IMOR por Plaza
CREATE TABLE IF NOT EXISTS kpi_colocacion_resumen_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    imor DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, entidad, plaza)
);

-- Resumen 3: Crecimiento de Cartera
CREATE TABLE IF NOT EXISTS kpi_colocacion_resumen_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    cartera_inicial DECIMAL(18,2),
    cartera_final DECIMAL(18,2),
    crecimiento DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, entidad)
);

-- Detalle 1: Colocación por plaza/producto
CREATE TABLE IF NOT EXISTS kpi_colocacion_detalle_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    producto VARCHAR(255),
    monto_colocacion DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_colocacion_det1_periodo ON kpi_colocacion_detalle_1(owner_id, anio, mes);

-- Detalle 2: IMOR por plaza/producto
CREATE TABLE IF NOT EXISTS kpi_colocacion_detalle_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    producto VARCHAR(255),
    cartera_total DECIMAL(18,2),
    cartera_vencida DECIMAL(18,2),
    imor DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_colocacion_det2_periodo ON kpi_colocacion_detalle_2(owner_id, anio, mes);

-- Detalle 3: Crecimiento por plaza/producto
CREATE TABLE IF NOT EXISTS kpi_colocacion_detalle_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    producto VARCHAR(255),
    cartera_inicial DECIMAL(18,2),
    cartera_final DECIMAL(18,2),
    crecimiento DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_colocacion_det3_periodo ON kpi_colocacion_detalle_3(owner_id, anio, mes);

-- =====================================================
-- KPI 5: RENTABILIDAD (4 resúmenes, 4 detalles)
-- =====================================================

-- Resumen 1: EBITDA
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_resumen_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    ebitda DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, entidad)
);

-- Resumen 2: Flujo Libre
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_resumen_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    flujo_libre DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, entidad)
);

-- Resumen 3: Flujo Operativo
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_resumen_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    flujo_operativo DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, entidad)
);

-- Resumen 4: Gasto por Crédito
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_resumen_4 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    gasto_por_credito DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, entidad)
);

-- Detalle 1: EBITDA por plaza
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_detalle_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    ebitda DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rentabilidad_det1_periodo ON kpi_rentabilidad_detalle_1(owner_id, anio, mes);

-- Detalle 2: Flujo Libre por plaza
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_detalle_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    flujo_libre DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rentabilidad_det2_periodo ON kpi_rentabilidad_detalle_2(owner_id, anio, mes);

-- Detalle 3: Flujo Operativo por plaza
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_detalle_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    flujo_operativo DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rentabilidad_det3_periodo ON kpi_rentabilidad_detalle_3(owner_id, anio, mes);

-- Detalle 4: Gasto por Crédito detallado
CREATE TABLE IF NOT EXISTS kpi_rentabilidad_detalle_4 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    producto VARCHAR(255),
    concepto VARCHAR(255),
    monto DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rentabilidad_det4_periodo ON kpi_rentabilidad_detalle_4(owner_id, anio, mes);

-- =====================================================
-- KPI 6: ROTACIÓN DE PERSONAL (4 resúmenes, 4 detalles)
-- =====================================================

-- Resumen 1: Índice de Rotación
CREATE TABLE IF NOT EXISTS kpi_rotacion_resumen_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    puesto VARCHAR(255),
    indice_rotacion DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, puesto)
);

-- Resumen 2: Días sin Cubrir
CREATE TABLE IF NOT EXISTS kpi_rotacion_resumen_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    dias_sin_cubrir INTEGER,
    meta INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 3: Ausentismo
CREATE TABLE IF NOT EXISTS kpi_rotacion_resumen_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ausentismo DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 4: Permanencia 12 Meses
CREATE TABLE IF NOT EXISTS kpi_rotacion_resumen_4 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    permanencia_12m DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Detalle 1: Rotación por región/plaza/puesto
CREATE TABLE IF NOT EXISTS kpi_rotacion_detalle_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    puesto VARCHAR(255),
    hc INTEGER,
    ingresos INTEGER,
    bajas INTEGER,
    indice_rotacion DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rotacion_det1_periodo ON kpi_rotacion_detalle_1(owner_id, anio, mes);

-- Detalle 2: Días sin Cubrir por región/plaza
CREATE TABLE IF NOT EXISTS kpi_rotacion_detalle_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    dias_sin_cubrir INTEGER,
    meta INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rotacion_det2_periodo ON kpi_rotacion_detalle_2(owner_id, anio, mes);

-- Detalle 3: Ausentismo por región/plaza
CREATE TABLE IF NOT EXISTS kpi_rotacion_detalle_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    ausentismo DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rotacion_det3_periodo ON kpi_rotacion_detalle_3(owner_id, anio, mes);

-- Detalle 4: Permanencia por región/plaza
CREATE TABLE IF NOT EXISTS kpi_rotacion_detalle_4 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    permanencia_12m DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rotacion_det4_periodo ON kpi_rotacion_detalle_4(owner_id, anio, mes);

-- =====================================================
-- KPI 7: ESCALABILIDAD (3 resúmenes, 3 detalles)
-- =====================================================

-- Resumen 1: Procesos Digitalizados
CREATE TABLE IF NOT EXISTS kpi_escalabilidad_resumen_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    procesos_digitalizados DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 2: Transacciones Automáticas
CREATE TABLE IF NOT EXISTS kpi_escalabilidad_resumen_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    transacciones_automaticas DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 3: Cost to Serve
CREATE TABLE IF NOT EXISTS kpi_escalabilidad_resumen_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    cost_to_serve DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Detalle 1: Procesos por entidad/plaza
CREATE TABLE IF NOT EXISTS kpi_escalabilidad_detalle_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    procesos_digitalizados DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalabilidad_det1_periodo ON kpi_escalabilidad_detalle_1(owner_id, anio, mes);

-- Detalle 2: Transacciones por entidad/plaza
CREATE TABLE IF NOT EXISTS kpi_escalabilidad_detalle_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    transacciones_automaticas DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalabilidad_det2_periodo ON kpi_escalabilidad_detalle_2(owner_id, anio, mes);

-- Detalle 3: Cost to Serve por entidad/plaza
CREATE TABLE IF NOT EXISTS kpi_escalabilidad_detalle_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    entidad VARCHAR(255),
    plaza VARCHAR(255),
    cost_to_serve DECIMAL(18,2),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalabilidad_det3_periodo ON kpi_escalabilidad_detalle_3(owner_id, anio, mes);

-- =====================================================
-- KPI 8: POSICIONAMIENTO DE MARCA (3 resúmenes, 3 detalles)
-- =====================================================

-- Resumen 1: Recordación de Marca
CREATE TABLE IF NOT EXISTS kpi_posicionamiento_resumen_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    recordacion_marca DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 2: Alcance de Campañas
CREATE TABLE IF NOT EXISTS kpi_posicionamiento_resumen_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    alcance_campanas BIGINT,
    meta BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 3: NPS de Marca
CREATE TABLE IF NOT EXISTS kpi_posicionamiento_resumen_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    nps INTEGER CHECK (nps >= -100 AND nps <= 100),
    meta INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Detalle 1: Recordación por región/plaza
CREATE TABLE IF NOT EXISTS kpi_posicionamiento_detalle_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    recordacion_marca DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posicionamiento_det1_periodo ON kpi_posicionamiento_detalle_1(owner_id, anio, mes);

-- Detalle 2: Alcance por región/plaza
CREATE TABLE IF NOT EXISTS kpi_posicionamiento_detalle_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    alcance_campanas BIGINT,
    meta BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posicionamiento_det2_periodo ON kpi_posicionamiento_detalle_2(owner_id, anio, mes);

-- Detalle 3: NPS por región/plaza
CREATE TABLE IF NOT EXISTS kpi_posicionamiento_detalle_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    nps INTEGER,
    meta INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posicionamiento_det3_periodo ON kpi_posicionamiento_detalle_3(owner_id, anio, mes);

-- =====================================================
-- KPI 9: INNOVACIÓN INCREMENTAL (1 resumen, 1 detalle)
-- =====================================================

-- Resumen
CREATE TABLE IF NOT EXISTS kpi_innovacion_resumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ideas_registradas INTEGER,
    proyectos_activos INTEGER,
    impacto_esperado TEXT,
    aprendizajes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Detalle
CREATE TABLE IF NOT EXISTS kpi_innovacion_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    proyecto VARCHAR(255),
    etapa VARCHAR(100),
    indicador_implementacion DECIMAL(8,4),
    riesgo VARCHAR(50),
    estimacion_ahorro DECIMAL(18,2),
    responsable VARCHAR(255),
    meta DECIMAL(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_innovacion_detalle_periodo ON kpi_innovacion_detalle(owner_id, anio, mes);

-- =====================================================
-- KPI 10: SATISFACCIÓN CLIENTE (3 resúmenes, 3 detalles)
-- =====================================================

-- Resumen 1: NPS por Categoría
CREATE TABLE IF NOT EXISTS kpi_satisfaccion_resumen_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    categoria VARCHAR(100),
    nps INTEGER,
    meta INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes, categoria)
);

-- Resumen 2: Quejas Resueltas 72h
CREATE TABLE IF NOT EXISTS kpi_satisfaccion_resumen_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    quejas_72h DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 3: Clima Laboral
CREATE TABLE IF NOT EXISTS kpi_satisfaccion_resumen_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    clima_laboral DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Detalle 1: NPS por región/plaza/categoría
CREATE TABLE IF NOT EXISTS kpi_satisfaccion_detalle_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    categoria VARCHAR(100),
    nps INTEGER,
    meta INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_satisfaccion_det1_periodo ON kpi_satisfaccion_detalle_1(owner_id, anio, mes);

-- Detalle 2: Quejas por región/plaza
CREATE TABLE IF NOT EXISTS kpi_satisfaccion_detalle_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    quejas_72h DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_satisfaccion_det2_periodo ON kpi_satisfaccion_detalle_2(owner_id, anio, mes);

-- Detalle 3: Clima por región/plaza
CREATE TABLE IF NOT EXISTS kpi_satisfaccion_detalle_3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    region VARCHAR(255),
    plaza VARCHAR(255),
    clima_laboral DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_satisfaccion_det3_periodo ON kpi_satisfaccion_detalle_3(owner_id, anio, mes);

-- =====================================================
-- KPI 11: CUMPLIMIENTO REGULATORIO (2 resúmenes, sin detalle)
-- =====================================================

-- Resumen 1: Reportes a Tiempo
CREATE TABLE IF NOT EXISTS kpi_cumplimiento_resumen_1 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    reportes_a_tiempo DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Resumen 2: Observaciones CNBV/CONDUSEF
CREATE TABLE IF NOT EXISTS kpi_cumplimiento_resumen_2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    observaciones_cnbv_condusef INTEGER,
    meta INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- =====================================================
-- KPI 12: GESTIÓN DE RIESGOS (1 resumen, 1 detalle)
-- =====================================================

-- Resumen
CREATE TABLE IF NOT EXISTS kpi_gestion_riesgos_resumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    riesgos_activos INTEGER,
    riesgos_mitigados INTEGER,
    exposicion DECIMAL(8,4),
    acciones_clave TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Detalle
CREATE TABLE IF NOT EXISTS kpi_gestion_riesgos_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    tipo VARCHAR(100),
    descripcion TEXT,
    incidentes_criticos INTEGER,
    riesgos_nuevos INTEGER,
    riesgos_mitigados INTEGER,
    cumplimiento_planes DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gestion_riesgos_detalle_periodo ON kpi_gestion_riesgos_detalle(owner_id, anio, mes);

-- =====================================================
-- KPI 13: GOBIERNO CORPORATIVO (1 resumen, 1 detalle)
-- =====================================================

-- Resumen
CREATE TABLE IF NOT EXISTS kpi_gobierno_corporativo_resumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    reuniones_consejo INTEGER,
    acuerdos_cumplidos DECIMAL(8,4),
    actualizaciones_politica INTEGER,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, anio, mes)
);

-- Detalle
CREATE TABLE IF NOT EXISTS kpi_gobierno_corporativo_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    comite VARCHAR(255),
    sesiones INTEGER,
    acuerdos_por_area INTEGER,
    kpis_reportados INTEGER,
    seguimiento_politicas DECIMAL(8,4),
    meta DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gobierno_corporativo_detalle_periodo ON kpi_gobierno_corporativo_detalle(owner_id, anio, mes);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE kpi_margen_financiero_resumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_margen_financiero_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_indice_renovacion_resumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_indice_renovacion_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_roe_roa_resumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_roe_roa_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_colocacion_resumen_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_colocacion_resumen_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_colocacion_resumen_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_colocacion_detalle_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_colocacion_detalle_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_colocacion_detalle_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_resumen_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_resumen_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_resumen_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_resumen_4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_detalle_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_detalle_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_detalle_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rentabilidad_detalle_4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_resumen_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_resumen_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_resumen_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_resumen_4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_detalle_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_detalle_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_detalle_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_rotacion_detalle_4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_resumen_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_resumen_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_resumen_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_detalle_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_detalle_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_escalabilidad_detalle_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_posicionamiento_resumen_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_posicionamiento_resumen_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_posicionamiento_resumen_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_posicionamiento_detalle_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_posicionamiento_detalle_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_posicionamiento_detalle_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_innovacion_resumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_innovacion_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_satisfaccion_resumen_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_satisfaccion_resumen_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_satisfaccion_resumen_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_satisfaccion_detalle_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_satisfaccion_detalle_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_satisfaccion_detalle_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_cumplimiento_resumen_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_cumplimiento_resumen_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_gestion_riesgos_resumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_gestion_riesgos_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_gobierno_corporativo_resumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_gobierno_corporativo_detalle ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIÓN PARA CREAR POLÍTICAS RLS AUTOMÁTICAMENTE
-- =====================================================

-- Política: SELECT para TODOS los usuarios autenticados (pueden ver todos los datos)
-- Políticas: INSERT, UPDATE, DELETE solo para el owner

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
        -- Eliminar políticas existentes si existen
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_all" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_delete_own" ON %I', table_name, table_name);
        
        -- Política SELECT: TODOS los usuarios autenticados pueden ver TODOS los registros
        EXECUTE format('
            CREATE POLICY "%s_select_all" ON %I
            FOR SELECT 
            TO authenticated
            USING (true)
        ', table_name, table_name);
        
        -- Política INSERT: usuario puede insertar con su ID
        EXECUTE format('
            CREATE POLICY "%s_insert_own" ON %I
            FOR INSERT WITH CHECK (auth.uid() = owner_id)
        ', table_name, table_name);
        
        -- Política UPDATE: usuario puede actualizar sus propios registros
        EXECUTE format('
            CREATE POLICY "%s_update_own" ON %I
            FOR UPDATE USING (auth.uid() = owner_id)
        ', table_name, table_name);
        
        -- Política DELETE: usuario puede eliminar sus propios registros
        EXECUTE format('
            CREATE POLICY "%s_delete_own" ON %I
            FOR DELETE USING (auth.uid() = owner_id)
        ', table_name, table_name);
    END LOOP;
END $$;

-- =====================================================
-- TRIGGERS PARA updated_at AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para tablas de resumen (que tienen updated_at)
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
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %I;
            CREATE TRIGGER update_%s_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE kpi_margen_financiero_resumen IS 'KPI 1: Resumen mensual de margen financiero';
COMMENT ON TABLE kpi_margen_financiero_detalle IS 'KPI 1: Detalle de margen por entidad/plaza/producto';
COMMENT ON TABLE kpi_indice_renovacion_resumen IS 'KPI 2: Índice de renovación de créditos mensual';
COMMENT ON TABLE kpi_indice_renovacion_detalle IS 'KPI 2: Detalle de renovación por plaza';
COMMENT ON TABLE kpi_roe_roa_resumen IS 'KPI 3: ROE y ROA mensual';
COMMENT ON TABLE kpi_roe_roa_detalle IS 'KPI 3: Detalle de componentes por entidad';
COMMENT ON TABLE kpi_colocacion_resumen_1 IS 'KPI 4: Monto de colocación por entidad';
COMMENT ON TABLE kpi_colocacion_resumen_2 IS 'KPI 4: IMOR por entidad/plaza';
COMMENT ON TABLE kpi_colocacion_resumen_3 IS 'KPI 4: Crecimiento de cartera por entidad';
COMMENT ON TABLE kpi_rentabilidad_resumen_1 IS 'KPI 5: EBITDA por entidad';
COMMENT ON TABLE kpi_rentabilidad_resumen_2 IS 'KPI 5: Flujo libre por entidad';
COMMENT ON TABLE kpi_rentabilidad_resumen_3 IS 'KPI 5: Flujo operativo por entidad';
COMMENT ON TABLE kpi_rentabilidad_resumen_4 IS 'KPI 5: Gasto por crédito por entidad';
COMMENT ON TABLE kpi_rotacion_resumen_1 IS 'KPI 6: Índice de rotación por puesto';
COMMENT ON TABLE kpi_rotacion_resumen_2 IS 'KPI 6: Días sin cubrir vacantes';
COMMENT ON TABLE kpi_rotacion_resumen_3 IS 'KPI 6: Tasa de ausentismo';
COMMENT ON TABLE kpi_rotacion_resumen_4 IS 'KPI 6: Permanencia a 12 meses';
COMMENT ON TABLE kpi_escalabilidad_resumen_1 IS 'KPI 7: Procesos digitalizados';
COMMENT ON TABLE kpi_escalabilidad_resumen_2 IS 'KPI 7: Transacciones automáticas';
COMMENT ON TABLE kpi_escalabilidad_resumen_3 IS 'KPI 7: Cost to serve';
COMMENT ON TABLE kpi_posicionamiento_resumen_1 IS 'KPI 8: Recordación de marca';
COMMENT ON TABLE kpi_posicionamiento_resumen_2 IS 'KPI 8: Alcance de campañas';
COMMENT ON TABLE kpi_posicionamiento_resumen_3 IS 'KPI 8: NPS de marca';
COMMENT ON TABLE kpi_innovacion_resumen IS 'KPI 9: Métricas de innovación incremental';
COMMENT ON TABLE kpi_innovacion_detalle IS 'KPI 9: Detalle de proyectos de innovación';
COMMENT ON TABLE kpi_satisfaccion_resumen_1 IS 'KPI 10: NPS por categoría';
COMMENT ON TABLE kpi_satisfaccion_resumen_2 IS 'KPI 10: Quejas resueltas en 72h';
COMMENT ON TABLE kpi_satisfaccion_resumen_3 IS 'KPI 10: Clima laboral';
COMMENT ON TABLE kpi_cumplimiento_resumen_1 IS 'KPI 11: Reportes regulatorios a tiempo';
COMMENT ON TABLE kpi_cumplimiento_resumen_2 IS 'KPI 11: Observaciones CNBV/CONDUSEF';
COMMENT ON TABLE kpi_gestion_riesgos_resumen IS 'KPI 12: Resumen de gestión de riesgos';
COMMENT ON TABLE kpi_gestion_riesgos_detalle IS 'KPI 12: Detalle por tipo de riesgo';
COMMENT ON TABLE kpi_gobierno_corporativo_resumen IS 'KPI 13: Métricas de gobierno corporativo';
COMMENT ON TABLE kpi_gobierno_corporativo_detalle IS 'KPI 13: Detalle por comité';
