import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/base/GlassCard'
import { KPI_ICON_MAP } from '@/components/kpi/iconMap'
import { 
  Calendar, 
  Database, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText, 
  Upload,
  ArrowUpRight,
  TrendingUp,
  CalendarDays
} from 'lucide-react'
import { cn } from '@/utils/ui'

// Configuración de KPIs con sus tablas
const KPI_CONFIG: Record<string, { 
  name: string
  shortName: string
  icon: string
  summaryTables: string[]
  detailTables: string[]
}> = {
  'colocacion': {
    name: 'Colocación',
    shortName: 'Colocación',
    icon: 'Send',
    summaryTables: ['kpi_colocacion_resumen_1', 'kpi_colocacion_resumen_2', 'kpi_colocacion_resumen_3'],
    detailTables: ['kpi_colocacion_detalle_1', 'kpi_colocacion_detalle_2', 'kpi_colocacion_detalle_3'],
  },
  'indice-renovacion-creditos': {
    name: 'Índice de Renovación',
    shortName: 'Renovación',
    icon: 'RefreshCcw',
    summaryTables: ['kpi_indice_renovacion_resumen'],
    detailTables: ['kpi_indice_renovacion_detalle'],
  },
  'margen-financiero': {
    name: 'Margen Financiero',
    shortName: 'Margen Fin.',
    icon: 'LineChart',
    summaryTables: ['kpi_margen_financiero_resumen'],
    detailTables: ['kpi_margen_financiero_detalle'],
  },
  'posicionamiento-marca': {
    name: 'Posicionamiento de Marca',
    shortName: 'Marca',
    icon: 'Sparkles',
    summaryTables: ['kpi_posicionamiento_resumen_1', 'kpi_posicionamiento_resumen_2', 'kpi_posicionamiento_resumen_3'],
    detailTables: ['kpi_posicionamiento_detalle_1', 'kpi_posicionamiento_detalle_2', 'kpi_posicionamiento_detalle_3'],
  },
  'rotacion-personal': {
    name: 'Rotación de Personal',
    shortName: 'Rotación',
    icon: 'Users2',
    summaryTables: ['kpi_rotacion_resumen_1', 'kpi_rotacion_resumen_2', 'kpi_rotacion_resumen_3', 'kpi_rotacion_resumen_4'],
    detailTables: ['kpi_rotacion_detalle_1', 'kpi_rotacion_detalle_2', 'kpi_rotacion_detalle_3', 'kpi_rotacion_detalle_4'],
  },
  'satisfaccion-cliente': {
    name: 'Satisfacción Cliente',
    shortName: 'Satisfacción',
    icon: 'Smile',
    summaryTables: ['kpi_satisfaccion_resumen_1', 'kpi_satisfaccion_resumen_2', 'kpi_satisfaccion_resumen_3'],
    detailTables: ['kpi_satisfaccion_detalle_1', 'kpi_satisfaccion_detalle_2', 'kpi_satisfaccion_detalle_3'],
  },
  'escalabilidad': {
    name: 'Escalabilidad',
    shortName: 'Escalabilidad',
    icon: 'Layers',
    summaryTables: ['kpi_escalabilidad_resumen_1', 'kpi_escalabilidad_resumen_2', 'kpi_escalabilidad_resumen_3'],
    detailTables: ['kpi_escalabilidad_detalle_1', 'kpi_escalabilidad_detalle_2', 'kpi_escalabilidad_detalle_3'],
  },
  'rentabilidad-operativa': {
    name: 'ROE y ROA',
    shortName: 'ROE/ROA',
    icon: 'GaugeCircle',
    summaryTables: ['kpi_roe_roa_resumen'],
    detailTables: ['kpi_roe_roa_detalle'],
  },
  'rentabilidad': {
    name: 'Rentabilidad',
    shortName: 'Rentabilidad',
    icon: 'PiggyBank',
    summaryTables: ['kpi_rentabilidad_resumen_1', 'kpi_rentabilidad_resumen_2', 'kpi_rentabilidad_resumen_3', 'kpi_rentabilidad_resumen_4'],
    detailTables: ['kpi_rentabilidad_detalle_1', 'kpi_rentabilidad_detalle_2', 'kpi_rentabilidad_detalle_3', 'kpi_rentabilidad_detalle_4'],
  },
  'innovacion-incremental': {
    name: 'Innovación Incremental',
    shortName: 'Innovación',
    icon: 'FlaskRound',
    summaryTables: ['kpi_innovacion_resumen'],
    detailTables: ['kpi_innovacion_detalle'],
  },
  'gestion-riesgos': {
    name: 'Gestión de Riesgos',
    shortName: 'Riesgos',
    icon: 'Radar',
    summaryTables: ['kpi_gestion_riesgos_resumen'],
    detailTables: ['kpi_gestion_riesgos_detalle'],
  },
  'cumplimiento-regulatorio': {
    name: 'Cumplimiento Regulatorio',
    shortName: 'Cumplimiento',
    icon: 'ShieldCheck',
    summaryTables: ['kpi_cumplimiento_resumen_1', 'kpi_cumplimiento_resumen_2'],
    detailTables: [],
  },
  'gobierno-corporativo': {
    name: 'Gobierno Corporativo',
    shortName: 'Gobierno',
    icon: 'Gem',
    summaryTables: ['kpi_gobierno_corporativo_resumen'],
    detailTables: ['kpi_gobierno_corporativo_detalle'],
  },
}

// Orden específico de KPIs (igual que Dashboard y Sidebar)
const KPI_ORDER = [
  'colocacion',
  'indice-renovacion-creditos',
  'margen-financiero',
  'posicionamiento-marca',
  'rotacion-personal',
  'satisfaccion-cliente',
  'escalabilidad',
  'rentabilidad-operativa',
  'rentabilidad',
  'innovacion-incremental',
  'gestion-riesgos',
  'cumplimiento-regulatorio',
  'gobierno-corporativo',
]

const KPI_LIST = KPI_ORDER.filter(id => id in KPI_CONFIG)

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface PeriodData {
  anio: number
  mes: number
  summaryCount: number
  detailCount: number
  lastUpdate: string | null
}

interface KpiData {
  id: string
  name: string
  shortName: string
  icon: string
  periods: PeriodData[]
  totalSummaries: number
  totalDetails: number
  latestPeriod: { anio: number; mes: number } | null
  lastUpdate: string | null
  hasCurrentMonth: boolean
}

interface GlobalStats {
  totalKpis: number
  kpisWithData: number
  kpisCurrentMonth: number
  totalSummaries: number
  totalDetails: number
}

export const SupervisionPage = () => {
  const [kpis, setKpis] = useState<KpiData[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalKpis: KPI_LIST.length,
    kpisWithData: 0,
    kpisCurrentMonth: 0,
    totalSummaries: 0,
    totalDetails: 0,
  })
  const [loading, setLoading] = useState(true)
  const [expandedKpis, setExpandedKpis] = useState<Set<string>>(new Set())

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      const kpisData: KpiData[] = await Promise.all(
        KPI_LIST.map(async (kpiId) => {
          const config = KPI_CONFIG[kpiId]
          const periodsMap = new Map<string, PeriodData>()
          let totalSummaries = 0
          let totalDetails = 0
          let lastUpdate: string | null = null

          // Obtener datos de tablas de resumen
          for (const table of config.summaryTables) {
            try {
              const { data } = await supabase
                .from(table)
                .select('anio, mes, updated_at')
                .order('updated_at', { ascending: false })

              if (data) {
                for (const row of data) {
                  const key = `${row.anio}-${row.mes}`
                  const existing = periodsMap.get(key) || {
                    anio: row.anio,
                    mes: row.mes,
                    summaryCount: 0,
                    detailCount: 0,
                    lastUpdate: null,
                  }
                  existing.summaryCount++
                  if (row.updated_at && (!existing.lastUpdate || row.updated_at > existing.lastUpdate)) {
                    existing.lastUpdate = row.updated_at
                  }
                  periodsMap.set(key, existing)
                  totalSummaries++
                  
                  if (row.updated_at && (!lastUpdate || row.updated_at > lastUpdate)) {
                    lastUpdate = row.updated_at
                  }
                }
              }
            } catch {
              // Tabla no existe
            }
          }

          // Obtener datos de tablas de detalle
          for (const table of config.detailTables) {
            try {
              const { data } = await supabase
                .from(table)
                .select('anio, mes, created_at')

              if (data) {
                for (const row of data) {
                  const key = `${row.anio}-${row.mes}`
                  const existing = periodsMap.get(key) || {
                    anio: row.anio,
                    mes: row.mes,
                    summaryCount: 0,
                    detailCount: 0,
                    lastUpdate: null,
                  }
                  existing.detailCount++
                  if (row.created_at && (!existing.lastUpdate || row.created_at > existing.lastUpdate)) {
                    existing.lastUpdate = row.created_at
                  }
                  periodsMap.set(key, existing)
                  totalDetails++
                  
                  if (row.created_at && (!lastUpdate || row.created_at > lastUpdate)) {
                    lastUpdate = row.created_at
                  }
                }
              }
            } catch {
              // Tabla no existe
            }
          }

          // Convertir mapa a array ordenado por fecha (más reciente primero)
          const periods = Array.from(periodsMap.values()).sort((a, b) => {
            if (a.anio !== b.anio) return b.anio - a.anio
            return b.mes - a.mes
          })

          const latestPeriod = periods.length > 0 ? { anio: periods[0].anio, mes: periods[0].mes } : null
          const hasCurrentMonth = periods.some(p => p.anio === currentYear && p.mes === currentMonth)

          return {
            id: kpiId,
            name: config.name,
            shortName: config.shortName,
            icon: config.icon,
            periods,
            totalSummaries,
            totalDetails,
            latestPeriod,
            lastUpdate,
            hasCurrentMonth,
          }
        })
      )

      // Calcular estadísticas globales
      const stats: GlobalStats = {
        totalKpis: KPI_LIST.length,
        kpisWithData: kpisData.filter(k => k.totalSummaries > 0 || k.totalDetails > 0).length,
        kpisCurrentMonth: kpisData.filter(k => k.hasCurrentMonth).length,
        totalSummaries: kpisData.reduce((acc, k) => acc + k.totalSummaries, 0),
        totalDetails: kpisData.reduce((acc, k) => acc + k.totalDetails, 0),
      }

      setKpis(kpisData)
      setGlobalStats(stats)
      setLoading(false)
    }

    void loadData()
  }, [currentYear, currentMonth])

  const toggleKpiExpand = (kpiId: string) => {
    setExpandedKpis((prev) => {
      const next = new Set(prev)
      if (next.has(kpiId)) {
        next.delete(kpiId)
      } else {
        next.add(kpiId)
      }
      return next
    })
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPeriod = (anio: number, mes: number) => {
    return `${MONTHS[mes - 1]} ${anio}`
  }

  const getStatusInfo = (kpi: KpiData) => {
    if (kpi.hasCurrentMonth) {
      return {
        label: 'Al día',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
      }
    }
    if (kpi.totalSummaries > 0 || kpi.totalDetails > 0) {
      return {
        label: 'Pendiente',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
        iconColor: 'text-amber-500',
      }
    }
    return {
      label: 'Sin datos',
      color: 'bg-gray-100 text-gray-500 border-gray-200',
      icon: AlertCircle,
      iconColor: 'text-gray-400',
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-soft-slate">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Database className="size-5" />
          </motion.div>
          <span>Cargando estado de indicadores...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con período actual */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-vision-ink">Estado de Indicadores</h2>
          <p className="text-sm text-soft-slate">Monitoreo de captura por KPI y período</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/60 border border-white/60">
          <CalendarDays className="size-4 text-plasma-blue" />
          <span className="text-sm font-medium text-vision-ink">
            {MONTHS[currentMonth - 1]} {currentYear}
          </span>
        </div>
      </div>

      {/* Estadísticas globales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4" animate={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-plasma-blue/10">
              <TrendingUp className="size-5 text-plasma-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-vision-ink">{globalStats.totalKpis}</p>
              <p className="text-xs text-soft-slate">Total indicadores</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4" animate={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-vision-ink">{globalStats.kpisCurrentMonth}</p>
              <p className="text-xs text-soft-slate">Con datos este mes</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4" animate={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100">
              <FileText className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-vision-ink">{globalStats.totalSummaries}</p>
              <p className="text-xs text-soft-slate">Resúmenes totales</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4" animate={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Upload className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-vision-ink">{globalStats.totalDetails}</p>
              <p className="text-xs text-soft-slate">Registros detalle</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Lista de KPIs */}
      <div className="space-y-3">
        {kpis.map((kpi, index) => {
          const isExpanded = expandedKpis.has(kpi.id)
          const status = getStatusInfo(kpi)
          const StatusIcon = status.icon
          const KpiIcon = KPI_ICON_MAP[kpi.icon]

          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard className="overflow-hidden" animate={false}>
                {/* Header del KPI */}
                <div className="p-4 flex items-center gap-4">
                  {/* Icono del KPI */}
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                    kpi.hasCurrentMonth 
                      ? 'bg-gradient-to-br from-plasma-blue/20 to-plasma-indigo/20 text-plasma-blue'
                      : kpi.totalSummaries > 0 
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-400'
                  )}>
                    {KpiIcon && <KpiIcon className="size-6" />}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-vision-ink">{kpi.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-soft-slate">
                          <span className="flex items-center gap-1">
                            <FileText className="size-3" />
                            {kpi.totalSummaries} resúmenes
                          </span>
                          <span className="flex items-center gap-1">
                            <Upload className="size-3" />
                            {kpi.totalDetails} detalles
                          </span>
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-1.5 flex-shrink-0',
                        status.color
                      )}>
                        <StatusIcon className="size-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Período más reciente y acciones */}
                  <div className="hidden sm:flex items-center gap-4">
                    {kpi.latestPeriod && (
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-soft-slate">Último período</p>
                        <p className="text-sm font-medium text-vision-ink">
                          {formatPeriod(kpi.latestPeriod.anio, kpi.latestPeriod.mes)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/${kpi.id}`}
                        className="p-2 rounded-xl bg-plasma-blue/10 text-plasma-blue hover:bg-plasma-blue/20 transition-colors"
                        title="Ir al indicador"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                      
                      <button
                        onClick={() => toggleKpiExpand(kpi.id)}
                        className="p-2 rounded-xl bg-white/60 text-soft-slate hover:bg-white/80 hover:text-vision-ink transition-colors"
                        title={isExpanded ? 'Ocultar historial' : 'Ver historial'}
                      >
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Botón expandir en mobile */}
                  <button
                    onClick={() => toggleKpiExpand(kpi.id)}
                    className="sm:hidden p-2 rounded-xl bg-white/60 text-soft-slate"
                  >
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>

                {/* Detalle expandido - Historial de períodos */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/40 overflow-hidden"
                    >
                      <div className="p-4">
                        {kpi.periods.length === 0 ? (
                          <div className="text-center py-6 text-soft-slate">
                            <Calendar className="size-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No hay datos capturados para este indicador</p>
                            <Link 
                              to={`/${kpi.id}`}
                              className="inline-flex items-center gap-1 mt-2 text-sm text-plasma-blue hover:text-plasma-indigo"
                            >
                              Comenzar captura <ArrowUpRight className="size-3" />
                            </Link>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-medium text-soft-slate uppercase tracking-wider mb-3">
                              Historial de períodos ({kpi.periods.length})
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {kpi.periods.map((period) => {
                                const isCurrentPeriod = period.anio === currentYear && period.mes === currentMonth
                                return (
                                  <div
                                    key={`${period.anio}-${period.mes}`}
                                    className={cn(
                                      'rounded-xl border p-3 transition-all',
                                      isCurrentPeriod
                                        ? 'bg-plasma-blue/5 border-plasma-blue/30'
                                        : 'bg-white/40 border-white/60'
                                    )}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={cn(
                                        'font-semibold',
                                        isCurrentPeriod ? 'text-plasma-blue' : 'text-vision-ink'
                                      )}>
                                        {formatPeriod(period.anio, period.mes)}
                                      </span>
                                      {isCurrentPeriod && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-plasma-blue/10 text-plasma-blue">
                                          Actual
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="flex items-center gap-1 text-soft-slate">
                                        <FileText className="size-3 text-violet-500" />
                                        {period.summaryCount}
                                      </span>
                                      <span className="flex items-center gap-1 text-soft-slate">
                                        <Upload className="size-3 text-amber-500" />
                                        {period.detailCount}
                                      </span>
                                    </div>
                                    {period.lastUpdate && (
                                      <div className="mt-2 pt-2 border-t border-gray-100/50 flex items-center gap-1 text-[10px] text-soft-slate">
                                        <Clock className="size-3" />
                                        {formatDate(period.lastUpdate)}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {kpis.length === 0 && (
        <GlassCard className="p-8 text-center">
          <Database className="size-12 text-soft-slate/30 mx-auto mb-3" />
          <p className="text-soft-slate">No hay indicadores configurados</p>
        </GlassCard>
      )}
    </div>
  )
}
