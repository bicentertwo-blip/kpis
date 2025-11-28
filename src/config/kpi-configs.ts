/**
 * Configuración centralizada de todos los KPIs
 * Define formularios de resumen y layouts CSV para importación
 */

import type { KpiDefinition, FieldDefinition } from '@/types/kpi-definitions'

// =====================================================
// CAMPOS COMUNES REUTILIZABLES
// =====================================================

const campoAnio: FieldDefinition = {
  id: 'anio',
  label: 'Año',
  type: 'number',
  placeholder: '2025',
  required: true,
  min: 2020,
  max: 2050,
}

const campoMes: FieldDefinition = {
  id: 'mes',
  label: 'Mes',
  type: 'select',
  required: true,
  options: [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ],
}

const campoMeta: FieldDefinition = {
  id: 'meta',
  label: 'Meta',
  type: 'number',
  placeholder: '100',
  description: 'Meta establecida para este período',
  required: true,
}

const campoMetaPorcentaje: FieldDefinition = {
  id: 'meta',
  label: 'Meta (%)',
  type: 'percentage',
  placeholder: '85',
  description: 'Meta establecida en porcentaje',
  required: true,
}

const campoEntidad: FieldDefinition = {
  id: 'entidad',
  label: 'Entidad',
  type: 'text',
  placeholder: 'Ej: SOFOM Principal',
  required: true,
}

const campoPlaza: FieldDefinition = {
  id: 'plaza',
  label: 'Plaza',
  type: 'text',
  placeholder: 'Ej: CDMX Norte',
  required: true,
}

// Nota: campoRegion se usa en configuraciones que requieren región
const _campoRegion: FieldDefinition = {
  id: 'region',
  label: 'Región',
  type: 'text',
  placeholder: 'Ej: Centro',
  required: true,
}

// Exportar para uso en formularios que lo requieran
export { _campoRegion as campoRegion }

// =====================================================
// KPI 1: MARGEN FINANCIERO
// =====================================================

export const MARGEN_FINANCIERO_CONFIG: KpiDefinition = {
  id: 'margen-financiero',
  name: 'Margen Financiero',
  shortName: 'Margen Fin.',
  description: 'Monitorea la eficiencia del margen financiero y su tendencia mensual.',
  icon: 'LineChart',
  accent: 'from-sky-50/80 via-white/60 to-blue-100/60',
  summaries: [
    {
      id: 'resumen-principal',
      title: 'Resumen de Margen Financiero',
      description: 'Captura manual del margen financiero mensual',
      tableName: 'kpi_margen_financiero_resumen',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'monto_margen_financiero',
          label: 'Monto Margen Financiero',
          type: 'currency',
          placeholder: '$5,000,000',
          description: 'Margen financiero total del período',
          required: true,
        },
        campoMeta,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-operativo',
      title: 'Detalle por Entidad/Plaza/Producto',
      description: 'Importar CSV con desagregación operativa del margen',
      tableName: 'kpi_margen_financiero_detalle',
      columns: ['anio', 'mes', 'entidad', 'region', 'plaza', 'producto', 'concepto', 'valor', 'categoria', 'meta'],
    },
  ],
}

// =====================================================
// KPI 2: ÍNDICE DE RENOVACIÓN
// =====================================================

export const INDICE_RENOVACION_CONFIG: KpiDefinition = {
  id: 'indice-renovacion',
  name: 'Índice de Renovación de Créditos',
  shortName: 'Renovación',
  description: 'Seguimiento del ratio de renovación vs. cartera total.',
  icon: 'RefreshCcw',
  accent: 'from-cyan-50/80 via-white/60 to-lime-100/60',
  summaries: [
    {
      id: 'resumen-principal',
      title: 'Resumen de Renovación',
      description: 'Índice general de renovación mensual',
      tableName: 'kpi_indice_renovacion_resumen',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'indice_renovacion',
          label: 'Índice de Renovación (%)',
          type: 'percentage',
          placeholder: '32.5',
          description: 'Porcentaje de créditos renovados',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-plaza',
      title: 'Detalle por Plaza',
      description: 'Importar CSV con desagregación por plaza',
      tableName: 'kpi_indice_renovacion_detalle',
      columns: ['anio', 'mes', 'plaza', 'total', 'renovaciones', 'nuevas', 'indice_renovacion', 'meta'],
    },
  ],
}

// =====================================================
// KPI 3: ROE y ROA
// =====================================================

export const ROE_ROA_CONFIG: KpiDefinition = {
  id: 'roe-roa',
  name: 'ROE y ROA',
  shortName: 'ROE/ROA',
  description: 'Evalúa el rendimiento sobre capital contable y activos.',
  icon: 'GaugeCircle',
  accent: 'from-indigo-50/80 via-white/60 to-slate-100/60',
  summaries: [
    {
      id: 'resumen-principal',
      title: 'Resumen ROE y ROA',
      description: 'Indicadores de rentabilidad sobre capital y activos',
      tableName: 'kpi_roe_roa_resumen',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'roe',
          label: 'ROE (%)',
          type: 'percentage',
          placeholder: '18.5',
          description: 'Return on Equity',
          required: true,
        },
        {
          id: 'roa',
          label: 'ROA (%)',
          type: 'percentage',
          placeholder: '2.8',
          description: 'Return on Assets',
          required: true,
        },
        {
          id: 'meta_roe',
          label: 'Meta ROE (%)',
          type: 'percentage',
          placeholder: '20',
          required: true,
        },
        {
          id: 'meta_roa',
          label: 'Meta ROA (%)',
          type: 'percentage',
          placeholder: '3',
          required: true,
        },
      ],
    },
  ],
  details: [
    {
      id: 'detalle-entidad',
      title: 'Detalle por Entidad',
      description: 'Importar CSV con datos por entidad',
      tableName: 'kpi_roe_roa_detalle',
      columns: ['anio', 'mes', 'entidad', 'capital_contable', 'utilidad_operativa_mensual', 'activo_total'],
    },
  ],
}

// =====================================================
// KPI 4: COLOCACIÓN (3 resúmenes, 3 detalles)
// =====================================================

export const COLOCACION_CONFIG: KpiDefinition = {
  id: 'colocacion',
  name: 'Colocación',
  shortName: 'Colocación',
  description: 'Mide la originación de créditos, IMOR y crecimiento de cartera.',
  icon: 'Send',
  accent: 'from-rose-50/80 via-white/60 to-amber-100/60',
  summaries: [
    {
      id: 'resumen-colocacion',
      title: '1. Monto de Colocación',
      description: 'Colocación por entidad',
      tableName: 'kpi_colocacion_resumen_1',
      fields: [
        campoAnio,
        campoMes,
        campoEntidad,
        {
          id: 'monto_colocacion',
          label: 'Monto Colocación',
          type: 'currency',
          placeholder: '$15,000,000',
          required: true,
        },
        campoMeta,
      ],
    },
    {
      id: 'resumen-imor',
      title: '2. IMOR por Plaza',
      description: 'Índice de morosidad por plaza',
      tableName: 'kpi_colocacion_resumen_2',
      fields: [
        campoAnio,
        campoMes,
        campoEntidad,
        campoPlaza,
        {
          id: 'imor',
          label: 'IMOR (%)',
          type: 'percentage',
          placeholder: '3.5',
          description: 'Índice de Morosidad',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-crecimiento',
      title: '3. Crecimiento de Cartera',
      description: 'Evolución de cartera por entidad',
      tableName: 'kpi_colocacion_resumen_3',
      fields: [
        campoAnio,
        campoMes,
        campoEntidad,
        {
          id: 'cartera_inicial',
          label: 'Cartera Inicial',
          type: 'currency',
          placeholder: '$50,000,000',
          required: true,
        },
        {
          id: 'cartera_final',
          label: 'Cartera Final',
          type: 'currency',
          placeholder: '$55,000,000',
          required: true,
        },
        {
          id: 'crecimiento',
          label: 'Crecimiento (%)',
          type: 'percentage',
          placeholder: '10',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-colocacion',
      title: '1. Detalle Colocación',
      description: 'CSV con monto colocado por plaza/producto',
      tableName: 'kpi_colocacion_detalle_1',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'producto', 'monto_colocacion', 'meta'],
    },
    {
      id: 'detalle-imor',
      title: '2. Detalle IMOR',
      description: 'CSV con morosidad por plaza/producto',
      tableName: 'kpi_colocacion_detalle_2',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'producto', 'cartera_total', 'cartera_vencida', 'imor', 'meta'],
    },
    {
      id: 'detalle-crecimiento',
      title: '3. Detalle Crecimiento',
      description: 'CSV con crecimiento por plaza/producto',
      tableName: 'kpi_colocacion_detalle_3',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'producto', 'cartera_inicial', 'cartera_final', 'crecimiento', 'meta'],
    },
  ],
}

// =====================================================
// KPI 5: RENTABILIDAD (4 resúmenes, 4 detalles)
// =====================================================

export const RENTABILIDAD_CONFIG: KpiDefinition = {
  id: 'rentabilidad',
  name: 'Rentabilidad',
  shortName: 'Rentabilidad',
  description: 'EBITDA, flujo libre, flujo operativo y gasto por crédito.',
  icon: 'PiggyBank',
  accent: 'from-emerald-50/80 via-white/60 to-green-100/60',
  summaries: [
    {
      id: 'resumen-ebitda',
      title: '1. EBITDA',
      description: 'EBITDA por entidad',
      tableName: 'kpi_rentabilidad_resumen_1',
      fields: [
        campoAnio,
        campoMes,
        campoEntidad,
        {
          id: 'ebitda',
          label: 'EBITDA',
          type: 'currency',
          placeholder: '$8,500,000',
          required: true,
        },
        campoMeta,
      ],
    },
    {
      id: 'resumen-flujo-libre',
      title: '2. Flujo Libre',
      description: 'Flujo de caja libre por entidad',
      tableName: 'kpi_rentabilidad_resumen_2',
      fields: [
        campoAnio,
        campoMes,
        campoEntidad,
        {
          id: 'flujo_libre',
          label: 'Flujo Libre',
          type: 'currency',
          placeholder: '$3,200,000',
          required: true,
        },
        campoMeta,
      ],
    },
    {
      id: 'resumen-flujo-operativo',
      title: '3. Flujo Operativo',
      description: 'Flujo operativo por entidad',
      tableName: 'kpi_rentabilidad_resumen_3',
      fields: [
        campoAnio,
        campoMes,
        campoEntidad,
        {
          id: 'flujo_operativo',
          label: 'Flujo Operativo',
          type: 'currency',
          placeholder: '$5,800,000',
          required: true,
        },
        campoMeta,
      ],
    },
    {
      id: 'resumen-gasto-credito',
      title: '4. Gasto por Crédito',
      description: 'Costo operativo por crédito',
      tableName: 'kpi_rentabilidad_resumen_4',
      fields: [
        campoAnio,
        campoMes,
        campoEntidad,
        {
          id: 'gasto_por_credito',
          label: 'Gasto por Crédito',
          type: 'currency',
          placeholder: '$1,250',
          required: true,
        },
        campoMeta,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-ebitda',
      title: '1. Detalle EBITDA',
      description: 'CSV con EBITDA por plaza',
      tableName: 'kpi_rentabilidad_detalle_1',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'ebitda', 'meta'],
    },
    {
      id: 'detalle-flujo-libre',
      title: '2. Detalle Flujo Libre',
      description: 'CSV con flujo libre por plaza',
      tableName: 'kpi_rentabilidad_detalle_2',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'flujo_libre', 'meta'],
    },
    {
      id: 'detalle-flujo-operativo',
      title: '3. Detalle Flujo Operativo',
      description: 'CSV con flujo operativo por plaza',
      tableName: 'kpi_rentabilidad_detalle_3',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'flujo_operativo', 'meta'],
    },
    {
      id: 'detalle-gasto-credito',
      title: '4. Detalle Gasto por Crédito',
      description: 'CSV con gastos por plaza/producto/concepto',
      tableName: 'kpi_rentabilidad_detalle_4',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'producto', 'concepto', 'monto', 'meta'],
    },
  ],
}

// =====================================================
// KPI 6: ROTACIÓN DE PERSONAL (4 resúmenes, 4 detalles)
// =====================================================

export const ROTACION_PERSONAL_CONFIG: KpiDefinition = {
  id: 'rotacion-personal',
  name: 'Rotación de Personal',
  shortName: 'Rotación',
  description: 'Índice de rotación, días sin cubrir, ausentismo y permanencia.',
  icon: 'Users2',
  accent: 'from-purple-50/80 via-white/60 to-fuchsia-100/60',
  summaries: [
    {
      id: 'resumen-rotacion',
      title: '1. Índice de Rotación',
      description: 'Rotación por puesto',
      tableName: 'kpi_rotacion_resumen_1',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'puesto',
          label: 'Puesto',
          type: 'text',
          placeholder: 'Ej: Asesor de Crédito',
          required: true,
        },
        {
          id: 'indice_rotacion',
          label: 'Índice de Rotación (%)',
          type: 'percentage',
          placeholder: '4.5',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-dias-sin-cubrir',
      title: '2. Días sin Cubrir',
      description: 'Días promedio de vacantes',
      tableName: 'kpi_rotacion_resumen_2',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'dias_sin_cubrir',
          label: 'Días sin Cubrir',
          type: 'number',
          placeholder: '15',
          description: 'Días promedio para cubrir vacantes',
          required: true,
        },
        campoMeta,
      ],
    },
    {
      id: 'resumen-ausentismo',
      title: '3. Ausentismo',
      description: 'Tasa de ausentismo',
      tableName: 'kpi_rotacion_resumen_3',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'ausentismo',
          label: 'Ausentismo (%)',
          type: 'percentage',
          placeholder: '2.3',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-permanencia',
      title: '4. Permanencia 12 Meses',
      description: 'Tasa de permanencia al año',
      tableName: 'kpi_rotacion_resumen_4',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'permanencia_12m',
          label: 'Permanencia 12M (%)',
          type: 'percentage',
          placeholder: '85',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-rotacion',
      title: '1. Detalle Rotación',
      description: 'CSV con rotación por región/plaza/puesto',
      tableName: 'kpi_rotacion_detalle_1',
      columns: ['anio', 'mes', 'region', 'plaza', 'puesto', 'hc', 'ingresos', 'bajas', 'indice_rotacion', 'meta'],
    },
    {
      id: 'detalle-dias-sin-cubrir',
      title: '2. Detalle Días sin Cubrir',
      description: 'CSV con días por región/plaza',
      tableName: 'kpi_rotacion_detalle_2',
      columns: ['anio', 'mes', 'region', 'plaza', 'dias_sin_cubrir', 'meta'],
    },
    {
      id: 'detalle-ausentismo',
      title: '3. Detalle Ausentismo',
      description: 'CSV con ausentismo por región/plaza',
      tableName: 'kpi_rotacion_detalle_3',
      columns: ['anio', 'mes', 'region', 'plaza', 'ausentismo', 'meta'],
    },
    {
      id: 'detalle-permanencia',
      title: '4. Detalle Permanencia',
      description: 'CSV con permanencia por región/plaza',
      tableName: 'kpi_rotacion_detalle_4',
      columns: ['anio', 'mes', 'region', 'plaza', 'permanencia_12m', 'meta'],
    },
  ],
}

// =====================================================
// KPI 7: ESCALABILIDAD (3 resúmenes, 3 detalles)
// =====================================================

export const ESCALABILIDAD_CONFIG: KpiDefinition = {
  id: 'escalabilidad',
  name: 'Escalabilidad',
  shortName: 'Escalabilidad',
  description: 'Procesos digitalizados, transacciones automáticas y cost-to-serve.',
  icon: 'Layers',
  accent: 'from-slate-50/80 via-white/60 to-slate-200/60',
  summaries: [
    {
      id: 'resumen-procesos',
      title: '1. Procesos Digitalizados',
      description: 'Porcentaje de procesos digitalizados',
      tableName: 'kpi_escalabilidad_resumen_1',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'procesos_digitalizados',
          label: 'Procesos Digitalizados (%)',
          type: 'percentage',
          placeholder: '68',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-transacciones',
      title: '2. Transacciones Automáticas',
      description: 'Porcentaje de transacciones automatizadas',
      tableName: 'kpi_escalabilidad_resumen_2',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'transacciones_automaticas',
          label: 'Transacciones Automáticas (%)',
          type: 'percentage',
          placeholder: '75',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-cost-to-serve',
      title: '3. Cost to Serve',
      description: 'Costo por cliente atendido',
      tableName: 'kpi_escalabilidad_resumen_3',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'cost_to_serve',
          label: 'Cost to Serve',
          type: 'currency',
          placeholder: '$125',
          required: true,
        },
        campoMeta,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-procesos',
      title: '1. Detalle Procesos',
      description: 'CSV con procesos por entidad/plaza',
      tableName: 'kpi_escalabilidad_detalle_1',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'procesos_digitalizados', 'meta'],
    },
    {
      id: 'detalle-transacciones',
      title: '2. Detalle Transacciones',
      description: 'CSV con transacciones por entidad/plaza',
      tableName: 'kpi_escalabilidad_detalle_2',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'transacciones_automaticas', 'meta'],
    },
    {
      id: 'detalle-cost-to-serve',
      title: '3. Detalle Cost to Serve',
      description: 'CSV con costos por entidad/plaza',
      tableName: 'kpi_escalabilidad_detalle_3',
      columns: ['anio', 'mes', 'entidad', 'plaza', 'cost_to_serve', 'meta'],
    },
  ],
}

// =====================================================
// KPI 8: POSICIONAMIENTO DE MARCA (3 resúmenes, 3 detalles)
// =====================================================

export const POSICIONAMIENTO_MARCA_CONFIG: KpiDefinition = {
  id: 'posicionamiento-marca',
  name: 'Posicionamiento de Marca',
  shortName: 'Marca',
  description: 'Recordación de marca, alcance de campañas y NPS.',
  icon: 'Sparkles',
  accent: 'from-yellow-50/80 via-white/60 to-orange-100/60',
  summaries: [
    {
      id: 'resumen-recordacion',
      title: '1. Recordación de Marca',
      description: 'Top of mind y awareness',
      tableName: 'kpi_posicionamiento_resumen_1',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'recordacion_marca',
          label: 'Recordación de Marca (%)',
          type: 'percentage',
          placeholder: '18',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-alcance',
      title: '2. Alcance de Campañas',
      description: 'Reach total de campañas',
      tableName: 'kpi_posicionamiento_resumen_2',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'alcance_campanas',
          label: 'Alcance Campañas',
          type: 'number',
          placeholder: '500000',
          description: 'Personas alcanzadas',
          required: true,
        },
        campoMeta,
      ],
    },
    {
      id: 'resumen-nps',
      title: '3. NPS de Marca',
      description: 'Net Promoter Score',
      tableName: 'kpi_posicionamiento_resumen_3',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'nps',
          label: 'NPS',
          type: 'number',
          placeholder: '45',
          description: 'Score de -100 a 100',
          required: true,
          min: -100,
          max: 100,
        },
        campoMeta,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-recordacion',
      title: '1. Detalle Recordación',
      description: 'CSV con recordación por región/plaza',
      tableName: 'kpi_posicionamiento_detalle_1',
      columns: ['anio', 'mes', 'region', 'plaza', 'recordacion_marca', 'meta'],
    },
    {
      id: 'detalle-alcance',
      title: '2. Detalle Alcance',
      description: 'CSV con alcance por región/plaza',
      tableName: 'kpi_posicionamiento_detalle_2',
      columns: ['anio', 'mes', 'region', 'plaza', 'alcance_campanas', 'meta'],
    },
    {
      id: 'detalle-nps',
      title: '3. Detalle NPS',
      description: 'CSV con NPS por región/plaza',
      tableName: 'kpi_posicionamiento_detalle_3',
      columns: ['anio', 'mes', 'region', 'plaza', 'nps', 'meta'],
    },
  ],
}

// =====================================================
// KPI 9: INNOVACIÓN INCREMENTAL (1 resumen, 1 detalle)
// =====================================================

export const INNOVACION_CONFIG: KpiDefinition = {
  id: 'innovacion-incremental',
  name: 'Innovación Incremental',
  shortName: 'Innovación',
  description: 'Pipeline de ideas, proyectos activos y aprendizajes.',
  icon: 'FlaskRound',
  accent: 'from-cyan-50/80 via-white/60 to-cyan-100/60',
  summaries: [
    {
      id: 'resumen-principal',
      title: 'Resumen de Innovación',
      description: 'Métricas generales de innovación',
      tableName: 'kpi_innovacion_resumen',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'ideas_registradas',
          label: 'Ideas Registradas',
          type: 'number',
          placeholder: '25',
          required: true,
        },
        {
          id: 'proyectos_activos',
          label: 'Proyectos Activos',
          type: 'number',
          placeholder: '8',
          required: true,
        },
        {
          id: 'impacto_esperado',
          label: 'Impacto Esperado',
          type: 'text',
          placeholder: 'Ej: Ahorro 15% OPEX',
          required: true,
        },
        {
          id: 'aprendizajes',
          label: 'Aprendizajes',
          type: 'long-text',
          placeholder: 'Principales aprendizajes del período...',
        },
      ],
    },
  ],
  details: [
    {
      id: 'detalle-proyectos',
      title: 'Detalle de Proyectos',
      description: 'CSV con detalle por proyecto',
      tableName: 'kpi_innovacion_detalle',
      columns: ['anio', 'mes', 'proyecto', 'etapa', 'indicador_implementacion', 'riesgo', 'estimacion_ahorro', 'responsable', 'meta'],
    },
  ],
}

// =====================================================
// KPI 10: SATISFACCIÓN CLIENTE (3 resúmenes, 3 detalles)
// =====================================================

export const SATISFACCION_CONFIG: KpiDefinition = {
  id: 'satisfaccion-cliente',
  name: 'Satisfacción Cliente',
  shortName: 'Satisfacción',
  description: 'NPS por categoría, quejas y clima laboral.',
  icon: 'Smiley',
  accent: 'from-pink-50/80 via-white/60 to-red-100/60',
  summaries: [
    {
      id: 'resumen-nps',
      title: '1. NPS por Categoría',
      description: 'NPS segmentado',
      tableName: 'kpi_satisfaccion_resumen_1',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'categoria',
          label: 'Categoría',
          type: 'select',
          required: true,
          options: [
            { value: 'producto', label: 'Producto' },
            { value: 'servicio', label: 'Servicio' },
            { value: 'atencion', label: 'Atención' },
            { value: 'digital', label: 'Digital' },
            { value: 'general', label: 'General' },
          ],
        },
        {
          id: 'nps',
          label: 'NPS',
          type: 'number',
          placeholder: '65',
          min: -100,
          max: 100,
          required: true,
        },
        campoMeta,
      ],
    },
    {
      id: 'resumen-quejas',
      title: '2. Quejas Resueltas 72h',
      description: 'Porcentaje de quejas resueltas en 72 horas',
      tableName: 'kpi_satisfaccion_resumen_2',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'quejas_72h',
          label: 'Quejas Resueltas 72h (%)',
          type: 'percentage',
          placeholder: '92',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-clima',
      title: '3. Clima Laboral',
      description: 'Índice de clima laboral',
      tableName: 'kpi_satisfaccion_resumen_3',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'clima_laboral',
          label: 'Clima Laboral (%)',
          type: 'percentage',
          placeholder: '78',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
  ],
  details: [
    {
      id: 'detalle-nps',
      title: '1. Detalle NPS',
      description: 'CSV con NPS por región/plaza/categoría',
      tableName: 'kpi_satisfaccion_detalle_1',
      columns: ['anio', 'mes', 'region', 'plaza', 'categoria', 'nps', 'meta'],
    },
    {
      id: 'detalle-quejas',
      title: '2. Detalle Quejas',
      description: 'CSV con quejas por región/plaza',
      tableName: 'kpi_satisfaccion_detalle_2',
      columns: ['anio', 'mes', 'region', 'plaza', 'quejas_72h', 'meta'],
    },
    {
      id: 'detalle-clima',
      title: '3. Detalle Clima',
      description: 'CSV con clima por región/plaza',
      tableName: 'kpi_satisfaccion_detalle_3',
      columns: ['anio', 'mes', 'region', 'plaza', 'clima_laboral', 'meta'],
    },
  ],
}

// =====================================================
// KPI 11: CUMPLIMIENTO REGULATORIO (2 resúmenes, sin detalle)
// =====================================================

export const CUMPLIMIENTO_CONFIG: KpiDefinition = {
  id: 'cumplimiento-regulatorio',
  name: 'Cumplimiento Regulatorio',
  shortName: 'Cumplimiento',
  description: 'Reportes a tiempo y observaciones CNBV/CONDUSEF.',
  icon: 'ShieldCheck',
  accent: 'from-teal-50/80 via-white/60 to-blue-100/60',
  summaries: [
    {
      id: 'resumen-reportes',
      title: '1. Reportes a Tiempo',
      description: 'Porcentaje de reportes entregados a tiempo',
      tableName: 'kpi_cumplimiento_resumen_1',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'reportes_a_tiempo',
          label: 'Reportes a Tiempo (%)',
          type: 'percentage',
          placeholder: '98',
          required: true,
        },
        campoMetaPorcentaje,
      ],
    },
    {
      id: 'resumen-observaciones',
      title: '2. Observaciones CNBV/CONDUSEF',
      description: 'Cantidad de observaciones regulatorias',
      tableName: 'kpi_cumplimiento_resumen_2',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'observaciones_cnbv_condusef',
          label: 'Observaciones',
          type: 'number',
          placeholder: '0',
          description: 'Número de observaciones del período',
          required: true,
        },
        campoMeta,
      ],
    },
  ],
  details: [], // Sin detalle CSV especificado
}

// =====================================================
// KPI 12: GESTIÓN DE RIESGOS (1 resumen, 1 detalle)
// =====================================================

export const GESTION_RIESGOS_CONFIG: KpiDefinition = {
  id: 'gestion-riesgos',
  name: 'Gestión de Riesgos',
  shortName: 'Riesgos',
  description: 'Mapa de riesgos activos, mitigados y exposición.',
  icon: 'Radar',
  accent: 'from-slate-50/80 via-white/60 to-slate-200/60',
  summaries: [
    {
      id: 'resumen-principal',
      title: 'Resumen de Riesgos',
      description: 'Estado general del mapa de riesgos',
      tableName: 'kpi_gestion_riesgos_resumen',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'riesgos_activos',
          label: 'Riesgos Activos',
          type: 'number',
          placeholder: '12',
          required: true,
        },
        {
          id: 'riesgos_mitigados',
          label: 'Riesgos Mitigados',
          type: 'number',
          placeholder: '8',
          required: true,
        },
        {
          id: 'exposicion',
          label: 'Exposición (%)',
          type: 'percentage',
          placeholder: '15',
          description: 'Nivel de exposición al riesgo',
          required: true,
        },
        {
          id: 'acciones_clave',
          label: 'Acciones Clave',
          type: 'long-text',
          placeholder: 'Principales acciones de mitigación...',
        },
      ],
    },
  ],
  details: [
    {
      id: 'detalle-riesgos',
      title: 'Detalle de Riesgos',
      description: 'CSV con detalle por tipo de riesgo',
      tableName: 'kpi_gestion_riesgos_detalle',
      columns: ['anio', 'mes', 'tipo', 'descripcion', 'incidentes_criticos', 'riesgos_nuevos', 'riesgos_mitigados', 'cumplimiento_planes', 'meta'],
    },
  ],
}

// =====================================================
// KPI 13: GOBIERNO CORPORATIVO (1 resumen, 1 detalle)
// =====================================================

export const GOBIERNO_CORPORATIVO_CONFIG: KpiDefinition = {
  id: 'gobierno-corporativo',
  name: 'Gobierno Corporativo',
  shortName: 'Gobierno',
  description: 'Sesiones de consejo, acuerdos cumplidos y políticas.',
  icon: 'Gem',
  accent: 'from-white/80 via-slate-50/60 to-slate-200/60',
  summaries: [
    {
      id: 'resumen-principal',
      title: 'Resumen de Gobierno',
      description: 'Métricas de gobierno corporativo',
      tableName: 'kpi_gobierno_corporativo_resumen',
      fields: [
        campoAnio,
        campoMes,
        {
          id: 'reuniones_consejo',
          label: 'Reuniones de Consejo',
          type: 'number',
          placeholder: '2',
          required: true,
        },
        {
          id: 'acuerdos_cumplidos',
          label: 'Acuerdos Cumplidos (%)',
          type: 'percentage',
          placeholder: '95',
          required: true,
        },
        {
          id: 'actualizaciones_politica',
          label: 'Actualizaciones de Política',
          type: 'number',
          placeholder: '3',
          required: true,
        },
        {
          id: 'observaciones',
          label: 'Observaciones',
          type: 'long-text',
          placeholder: 'Notas relevantes del período...',
        },
      ],
    },
  ],
  details: [
    {
      id: 'detalle-comites',
      title: 'Detalle por Comité',
      description: 'CSV con detalle por comité',
      tableName: 'kpi_gobierno_corporativo_detalle',
      columns: ['anio', 'mes', 'comite', 'sesiones', 'acuerdos_por_area', 'kpis_reportados', 'seguimiento_politicas', 'meta'],
    },
  ],
}

// =====================================================
// MAPA COMPLETO DE CONFIGURACIONES
// =====================================================

export const KPI_CONFIGS: Record<string, KpiDefinition> = {
  'margen-financiero': MARGEN_FINANCIERO_CONFIG,
  'indice-renovacion': INDICE_RENOVACION_CONFIG,
  'indice-renovacion-creditos': INDICE_RENOVACION_CONFIG, // Alias para compatibilidad
  'roe-roa': ROE_ROA_CONFIG,
  'rentabilidad-operativa': ROE_ROA_CONFIG, // Alias para compatibilidad
  'colocacion': COLOCACION_CONFIG,
  'rentabilidad': RENTABILIDAD_CONFIG,
  'rotacion-personal': ROTACION_PERSONAL_CONFIG,
  'escalabilidad': ESCALABILIDAD_CONFIG,
  'posicionamiento-marca': POSICIONAMIENTO_MARCA_CONFIG,
  'innovacion-incremental': INNOVACION_CONFIG,
  'satisfaccion-cliente': SATISFACCION_CONFIG,
  'cumplimiento-regulatorio': CUMPLIMIENTO_CONFIG,
  'gestion-riesgos': GESTION_RIESGOS_CONFIG,
  'gobierno-corporativo': GOBIERNO_CORPORATIVO_CONFIG,
}

export const getKpiConfig = (kpiId: string): KpiDefinition | undefined => {
  return KPI_CONFIGS[kpiId]
}

export const getAllKpiConfigs = (): KpiDefinition[] => {
  return Object.values(KPI_CONFIGS).filter((config, index, self) => 
    self.findIndex(c => c.id === config.id) === index
  )
}
