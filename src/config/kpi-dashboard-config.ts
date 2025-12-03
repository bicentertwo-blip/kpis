/**
 * Configuración del Dashboard de KPIs
 * Define cómo calcular y mostrar el progreso de cada indicador
 */

export interface KpiDashboardMetric {
  id: string
  name: string
  shortName: string
  icon: string
  tableName: string
  metricKey: string
  metaKey: string
  aggregationType: 'sum' | 'avg'
  higherIsBetter: boolean
  format: 'currency' | 'percentage' | 'number'
  route: string
}

/**
 * Configuración de cada KPI para el dashboard
 * - aggregationType: 'sum' para moneda (sumar valores), 'avg' para porcentaje (promediar)
 * - higherIsBetter: true si superar la meta es positivo, false si quedarse debajo es mejor
 */
export const KPI_DASHBOARD_METRICS: KpiDashboardMetric[] = [
  {
    id: 'margen-financiero',
    name: 'Margen Financiero',
    shortName: 'Margen Fin.',
    icon: 'LineChart',
    tableName: 'kpi_margen_financiero_resumen',
    metricKey: 'monto_margen_financiero',
    metaKey: 'meta',
    aggregationType: 'sum',
    higherIsBetter: true,
    format: 'currency',
    route: '/margen-financiero',
  },
  {
    id: 'rentabilidad-operativa',
    name: 'Rentabilidad Operativa',
    shortName: 'ROE/ROA',
    icon: 'GaugeCircle',
    tableName: 'kpi_roe_roa_resumen',
    metricKey: 'roe',
    metaKey: 'meta_roe',
    aggregationType: 'avg',
    higherIsBetter: true,
    format: 'percentage',
    route: '/rentabilidad-operativa',
  },
  {
    id: 'indice-renovacion',
    name: 'Índice de Renovación',
    shortName: 'Renovación',
    icon: 'RefreshCcw',
    tableName: 'kpi_indice_renovacion_resumen',
    metricKey: 'indice_renovacion',
    metaKey: 'meta',
    aggregationType: 'avg',
    higherIsBetter: true,
    format: 'percentage',
    route: '/indice-renovacion-creditos',
  },
  {
    id: 'colocacion',
    name: 'Colocación',
    shortName: 'Colocación',
    icon: 'Send',
    tableName: 'kpi_colocacion_resumen_1',
    metricKey: 'monto_colocacion',
    metaKey: 'meta',
    aggregationType: 'sum',
    higherIsBetter: true,
    format: 'currency',
    route: '/colocacion',
  },
  {
    id: 'rentabilidad',
    name: 'Rentabilidad',
    shortName: 'EBITDA',
    icon: 'PiggyBank',
    tableName: 'kpi_rentabilidad_resumen_1',
    metricKey: 'ebitda',
    metaKey: 'meta',
    aggregationType: 'sum',
    higherIsBetter: true,
    format: 'currency',
    route: '/rentabilidad',
  },
  {
    id: 'rotacion-personal',
    name: 'Rotación de Personal',
    shortName: 'Rotación',
    icon: 'Users2',
    tableName: 'kpi_rotacion_resumen_1',
    metricKey: 'indice_rotacion',
    metaKey: 'meta',
    aggregationType: 'avg',
    higherIsBetter: false, // Menos rotación es mejor
    format: 'percentage',
    route: '/rotacion-personal',
  },
  {
    id: 'escalabilidad',
    name: 'Escalabilidad',
    shortName: 'Escalabilidad',
    icon: 'Layers',
    tableName: 'kpi_escalabilidad_resumen_1',
    metricKey: 'procesos_digitalizados',
    metaKey: 'meta',
    aggregationType: 'avg',
    higherIsBetter: true,
    format: 'percentage',
    route: '/escalabilidad',
  },
  {
    id: 'posicionamiento-marca',
    name: 'Posicionamiento de Marca',
    shortName: 'Marca',
    icon: 'Sparkles',
    tableName: 'kpi_posicionamiento_resumen_1',
    metricKey: 'recordacion_marca',
    metaKey: 'meta',
    aggregationType: 'avg',
    higherIsBetter: true,
    format: 'percentage',
    route: '/posicionamiento-marca',
  },
  {
    id: 'innovacion',
    name: 'Innovación Incremental',
    shortName: 'Innovación',
    icon: 'FlaskRound',
    tableName: 'kpi_innovacion_resumen',
    metricKey: 'ideas_registradas',
    metaKey: 'meta_anual',
    aggregationType: 'sum',
    higherIsBetter: true,
    format: 'number',
    route: '/innovacion-incremental',
  },
  {
    id: 'satisfaccion-cliente',
    name: 'Satisfacción Cliente',
    shortName: 'NPS',
    icon: 'Smile',
    tableName: 'kpi_satisfaccion_resumen_1',
    metricKey: 'nps',
    metaKey: 'meta',
    aggregationType: 'avg',
    higherIsBetter: true,
    format: 'number',
    route: '/satisfaccion-cliente',
  },
  {
    id: 'cumplimiento-regulatorio',
    name: 'Cumplimiento Regulatorio',
    shortName: 'Cumplimiento',
    icon: 'ShieldCheck',
    tableName: 'kpi_cumplimiento_resumen_1',
    metricKey: 'reportes_a_tiempo',
    metaKey: 'meta',
    aggregationType: 'avg',
    higherIsBetter: true,
    format: 'percentage',
    route: '/cumplimiento-regulatorio',
  },
  {
    id: 'gestion-riesgos',
    name: 'Gestión de Riesgos',
    shortName: 'Riesgos',
    icon: 'Radar',
    tableName: 'kpi_gestion_riesgos_resumen',
    metricKey: 'exposicion',
    metaKey: 'meta_anual',
    aggregationType: 'avg',
    higherIsBetter: false, // Menos exposición es mejor
    format: 'percentage',
    route: '/gestion-riesgos',
  },
  {
    id: 'gobierno-corporativo',
    name: 'Gobierno Corporativo',
    shortName: 'Gobierno',
    icon: 'Gem',
    tableName: 'kpi_gobierno_corporativo_resumen',
    metricKey: 'acuerdos_cumplidos',
    metaKey: 'meta_anual',
    aggregationType: 'avg',
    higherIsBetter: true,
    format: 'percentage',
    route: '/gobierno-corporativo',
  },
]

/**
 * Colores del semáforo según estado
 */
export const STATUS_COLORS = {
  green: {
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    textLight: 'text-emerald-600',
    glow: 'shadow-emerald-500/25',
    dot: 'bg-emerald-500',
    progress: 'from-emerald-400 to-green-500',
  },
  yellow: {
    bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    textLight: 'text-amber-600',
    glow: 'shadow-amber-500/25',
    dot: 'bg-amber-500',
    progress: 'from-amber-400 to-yellow-500',
  },
  red: {
    bg: 'bg-gradient-to-r from-red-500 to-rose-500',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    textLight: 'text-red-600',
    glow: 'shadow-red-500/25',
    dot: 'bg-red-500',
    progress: 'from-red-400 to-rose-500',
  },
  gray: {
    bg: 'bg-gradient-to-r from-slate-400 to-slate-500',
    bgLight: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    textLight: 'text-slate-500',
    glow: 'shadow-slate-500/15',
    dot: 'bg-slate-400',
    progress: 'from-slate-300 to-slate-400',
  },
} as const

export type StatusColor = keyof typeof STATUS_COLORS

/**
 * Calcula el color del semáforo basado en el progreso
 */
export function getStatusColor(
  actual: number | null,
  meta: number | null,
  higherIsBetter: boolean
): StatusColor {
  if (actual === null || meta === null || meta === 0) {
    return 'gray'
  }

  const ratio = actual / meta

  if (higherIsBetter) {
    // Superar la meta es positivo
    if (ratio >= 1.0) return 'green'      // ≥100% de la meta
    if (ratio >= 0.85) return 'yellow'    // 85-99% de la meta
    return 'red'                          // <85% de la meta
  } else {
    // Quedarse debajo de la meta es positivo
    if (ratio <= 1.0) return 'green'      // ≤100% de la meta
    if (ratio <= 1.15) return 'yellow'    // 100-115% de la meta
    return 'red'                          // >115% de la meta
  }
}

/**
 * Formatea un valor según su tipo
 */
export function formatMetricValue(
  value: number | null,
  format: 'currency' | 'percentage' | 'number'
): string {
  if (value === null || value === undefined) return '-'
  
  switch (format) {
    case 'currency':
      // Formato compacto para millones/miles
      if (Math.abs(value) >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`
      }
      if (Math.abs(value) >= 1_000) {
        return `$${(value / 1_000).toFixed(0)}K`
      }
      return `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
    
    case 'percentage':
      return `${value.toFixed(1)}%`
    
    case 'number':
      return value.toLocaleString('es-MX', { maximumFractionDigits: 0 })
    
    default:
      return String(value)
  }
}
