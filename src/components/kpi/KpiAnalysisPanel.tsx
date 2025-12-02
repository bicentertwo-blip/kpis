/**
 * Panel de Análisis para KPIs
 * Visualización de datos históricos con gráficas interactivas
 * Optimizado para móviles (iPhone-first)
 * Soporta múltiples secciones de resumen y detalle
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  LineChartIcon,
  Layers,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { KpiDefinition } from '@/types/kpi-definitions'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/utils/ui'

interface KpiAnalysisPanelProps {
  config: KpiDefinition
  filters?: {
    anio: number
    mes: number
  }
}

type AnalysisView = 'resumen' | 'detalle'
type ChartType = 'area' | 'bar' | 'line'

interface DataPoint {
  periodo: string
  mes: number
  anio: number
  [key: string]: string | number
}

interface SectionData {
  id: string
  title: string
  tableName: string
  data: DataPoint[]
  lastUploadInfo?: { date: string; count: number } | null
}

// Colores para gráficas
const PIE_COLORS = ['#4F46E5', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6366F1']

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Campos que deben mostrarse como porcentaje (coincidencia exacta)
const PERCENTAGE_FIELDS = new Set([
  'roe', 'roa', 'meta_roe', 'meta_roa',
  'indice_renovacion',
  'imor', 'crecimiento',
  'indice_rotacion', 'ausentismo', 'permanencia_12m',
  'procesos_digitalizados', 'transacciones_automaticas',
  'recordacion_marca',
  'quejas_72h', 'clima_laboral',
  'reportes_a_tiempo',
  'exposicion',
  'acuerdos_cumplidos'
])

// Campos que deben mostrarse como números simples (días, conteos, scores, etc.)
const SIMPLE_NUMBER_FIELDS = new Set([
  // Días
  'dias_sin_cubrir', 'meta_dias', 'dias',
  // Conteos de personal
  'vacantes', 'contrataciones', 'bajas',
  'empleados', 'total_empleados', 'hc', 'ingresos',
  'count', 'cantidad',
  // NPS y scores
  'nps',
  // Innovación
  'ideas_registradas', 'proyectos_activos',
  // Riesgos
  'riesgos_activos', 'riesgos_mitigados', 'incidentes_criticos', 'riesgos_nuevos',
  // Gobierno corporativo
  'reuniones_consejo', 'actualizaciones_politica', 'sesiones',
  // Cumplimiento
  'observaciones_cnbv_condusef', 'observaciones',
  // Alcance (números grandes pero no moneda)
  'alcance_campanas'
])

// Tipos de formato de campo
type FieldFormatType = 'percentage' | 'number' | 'currency'

// Función para detectar el tipo de formato de un campo
const getFieldFormatType = (fieldName: string): FieldFormatType => {
  const lowerField = fieldName.toLowerCase()
  
  // Porcentajes
  if (PERCENTAGE_FIELDS.has(lowerField)) return 'percentage'
  if (lowerField.endsWith('_pct')) return 'percentage'
  if (lowerField.endsWith('_%')) return 'percentage'
  
  // Números simples (días, conteos)
  if (SIMPLE_NUMBER_FIELDS.has(lowerField)) return 'number'
  if (lowerField.includes('dias')) return 'number'
  if (lowerField.includes('count')) return 'number'
  
  // Por defecto, moneda
  return 'currency'
}

export const KpiAnalysisPanel = ({ config, filters }: KpiAnalysisPanelProps) => {
  const [activeView, setActiveView] = useState<AnalysisView>('resumen')
  const [chartType, setChartType] = useState<ChartType>('area')
  const [loading, setLoading] = useState(true)
  const [resumenSections, setResumenSections] = useState<SectionData[]>([])
  const [detalleSections, setDetalleSections] = useState<SectionData[]>([])
  const [activeResumenIndex, setActiveResumenIndex] = useState(0)
  const [activeDetalleIndex, setActiveDetalleIndex] = useState(0)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(filters?.anio || 'all')
  const [showYearFilter, setShowYearFilter] = useState(false)
  
  const userId = useAuthStore((state) => state.session?.user.id)

  // Obtener la sección activa según la vista
  const activeSections = activeView === 'resumen' ? resumenSections : detalleSections
  const activeIndex = activeView === 'resumen' ? activeResumenIndex : activeDetalleIndex
  const setActiveIndex = activeView === 'resumen' ? setActiveResumenIndex : setActiveDetalleIndex
  const currentSection = activeSections[activeIndex]

  // Navegar entre secciones
  const goToNextSection = useCallback(() => {
    if (activeIndex < activeSections.length - 1) {
      setActiveIndex(activeIndex + 1)
    }
  }, [activeIndex, activeSections.length, setActiveIndex])

  const goToPrevSection = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1)
    }
  }, [activeIndex, setActiveIndex])

  // Cargar datos de todas las secciones
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      setLoading(true)

      try {
        // Cargar datos de TODAS las tablas de resumen
        const resumenPromises = config.summaries.map(async (summary) => {
          let query = supabase
            .from(summary.tableName)
            .select('*')
          
          // Filtrar por año solo si no es "all"
          if (selectedYear !== 'all') {
            query = query.eq('anio', selectedYear)
          }
          
          const { data: resumen } = await query
            .order('anio', { ascending: true })
            .order('mes', { ascending: true })
            .order('updated_at', { ascending: false })

          let processedData: DataPoint[] = []

          if (resumen && resumen.length > 0) {
            // Filtrar para quedarnos solo con el más reciente por año/mes
            const latestByPeriod = (resumen as Record<string, unknown>[]).reduce((acc: Record<string, Record<string, unknown>>, curr) => {
              const key = `${curr.anio}-${curr.mes}`
              if (!acc[key] || new Date(curr.updated_at as string) > new Date(acc[key].updated_at as string)) {
                acc[key] = curr
              }
              return acc
            }, {})

            processedData = Object.values(latestByPeriod)
              .sort((a, b) => {
                const yearDiff = (a.anio as number) - (b.anio as number)
                if (yearDiff !== 0) return yearDiff
                return (a.mes as number) - (b.mes as number)
              })
              .map((r) => ({
                ...r,
                periodo: `${MONTHS_SHORT[(r.mes as number) - 1]} ${r.anio}`,
              })) as DataPoint[]
          }

          return {
            id: summary.id,
            title: summary.title,
            tableName: summary.tableName,
            data: processedData,
          }
        })

        // Cargar datos de TODAS las tablas de detalle
        const detallePromises = config.details.map(async (detail) => {
          // Primero obtener la fecha de la última carga
          let lastRecordQuery = supabase
            .from(detail.tableName)
            .select('created_at')
          
          if (selectedYear !== 'all') {
            lastRecordQuery = lastRecordQuery.eq('anio', selectedYear)
          }
          
          const { data: lastRecord } = await lastRecordQuery
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          let processedData: DataPoint[] = []
          let lastUploadInfo: { date: string; count: number } | null = null

          if (lastRecord) {
            const lastUploadDate = new Date(lastRecord.created_at as string)
            const startTime = new Date(lastUploadDate.getTime() - 60000).toISOString()
            const endTime = new Date(lastUploadDate.getTime() + 60000).toISOString()

            let detalleQuery = supabase
              .from(detail.tableName)
              .select('*')
            
            if (selectedYear !== 'all') {
              detalleQuery = detalleQuery.eq('anio', selectedYear)
            }
            
            const { data: detalle } = await detalleQuery
              .gte('created_at', startTime)
              .lte('created_at', endTime)
              .order('anio', { ascending: true })
              .order('mes', { ascending: true })

            if (detalle && detalle.length > 0) {
              lastUploadInfo = {
                date: lastUploadDate.toLocaleDateString('es-MX', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                count: detalle.length
              }

              // Agrupar por año/mes
              const grouped = (detalle as Record<string, unknown>[]).reduce((acc: Record<string, DataPoint>, curr) => {
                const key = `${curr.anio}-${curr.mes}`
                const mes = curr.mes as number
                const anio = curr.anio as number
                if (!acc[key]) {
                  acc[key] = {
                    periodo: `${MONTHS_SHORT[mes - 1]} ${anio}`,
                    mes,
                    anio,
                    count: 0,
                  }
                }
                acc[key].count = (acc[key].count as number) + 1
                Object.keys(curr).forEach((k) => {
                  if (typeof curr[k] === 'number' && !['mes', 'anio'].includes(k)) {
                    acc[key][k] = ((acc[key][k] as number) || 0) + (curr[k] as number)
                  }
                })
                return acc
              }, {})
              processedData = Object.values(grouped).sort((a, b) => {
                const yearDiff = a.anio - b.anio
                if (yearDiff !== 0) return yearDiff
                return a.mes - b.mes
              })
            }
          }

          return {
            id: detail.id,
            title: detail.title,
            tableName: detail.tableName,
            data: processedData,
            lastUploadInfo,
          }
        })

        const [resumenResults, detalleResults] = await Promise.all([
          Promise.all(resumenPromises),
          Promise.all(detallePromises)
        ])

        setResumenSections(resumenResults)
        setDetalleSections(detalleResults)

        // Reset index si excede el nuevo número de secciones
        if (activeResumenIndex >= resumenResults.length) {
          setActiveResumenIndex(0)
        }
        if (activeDetalleIndex >= detalleResults.length) {
          setActiveDetalleIndex(0)
        }

      } catch (error) {
        console.error('Error cargando datos de análisis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, config.summaries, config.details, selectedYear, activeResumenIndex, activeDetalleIndex])

  // Datos actuales para la gráfica
  const chartData = currentSection?.data || []

  // Calcular métricas
  const metrics = useMemo(() => {
    if (!currentSection || currentSection.data.length === 0) return null

    const data = currentSection.data
    const numericFields = Object.keys(data[0] || {}).filter(
      (k) => typeof data[0][k] === 'number' && !['mes', 'anio', 'count'].includes(k)
    )
    const mainField = numericFields[0]
    if (!mainField) return null

    const values = data.map((d) => d[mainField] as number).filter((v) => !isNaN(v))
    const current = values[values.length - 1] || 0
    const previous = values[values.length - 2] || 0
    const change = previous ? ((current - previous) / previous) * 100 : 0
    const total = values.reduce((a, b) => a + b, 0)
    const average = values.length ? total / values.length : 0
    const max = Math.max(...values)
    const min = Math.min(...values)

    return {
      field: mainField,
      current,
      previous,
      change,
      total,
      average,
      max,
      min,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    }
  }, [currentSection])

  // Obtener keys para gráficas
  const dataKeys = useMemo(() => {
    if (chartData.length === 0) return []
    return Object.keys(chartData[0] || {}).filter(
      (k) => typeof chartData[0][k] === 'number' && !['mes', 'anio'].includes(k)
    ).slice(0, 3)
  }, [chartData])

  // Detectar el tipo de formato del campo principal
  const mainFieldFormatType = useMemo(() => {
    if (!metrics?.field) return 'currency' as FieldFormatType
    return getFieldFormatType(metrics.field)
  }, [metrics?.field])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatSimpleNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toLocaleString('es-MX', { maximumFractionDigits: 1 })
  }

  // Formato de números para el eje Y (usa el campo principal)
  const formatNumber = (value: number) => {
    switch (mainFieldFormatType) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'number':
        return formatSimpleNumber(value)
      case 'currency':
      default:
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
        return value.toFixed(0)
    }
  }

  // Formato inteligente basado en el tipo de campo específico
  const formatValue = (value: number, fieldName?: string) => {
    const formatType = fieldName ? getFieldFormatType(fieldName) : mainFieldFormatType
    switch (formatType) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'number':
        return formatSimpleNumber(value)
      case 'currency':
      default:
        return formatCurrency(value)
    }
  }

  // Tooltip personalizado - formatea cada campo según su tipo
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null

    return (
      <div className="glass-panel rounded-xl p-3 shadow-lg border border-white/60">
        <p className="text-xs font-semibold text-vision-ink mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-soft-slate capitalize">{entry.dataKey.replace(/_/g, ' ')}:</span>
            <span className="font-semibold text-vision-ink">{formatValue(entry.value, entry.dataKey)}</span>
          </div>
        ))}
      </div>
    )
  }

  // Renderizar gráfica
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-plasma-blue/10 to-plasma-indigo/10 flex items-center justify-center mb-4">
            <BarChart3 className="size-8 text-plasma-blue/50" />
          </div>
          <p className="text-soft-slate text-sm">Sin datos {selectedYear === 'all' ? 'disponibles' : `para ${selectedYear}`}</p>
          <p className="text-soft-slate/60 text-xs mt-1">Captura información en Resumen o importa datos</p>
        </div>
      )
    }

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: -20, bottom: 0 },
    }

    const xAxisProps = {
      dataKey: 'periodo',
      tick: { fontSize: 10, fill: '#64748B' },
      tickLine: false,
      axisLine: false,
    }

    const yAxisProps = {
      tick: { fontSize: 10, fill: '#64748B' },
      tickLine: false,
      axisLine: false,
      tickFormatter: formatNumber,
    }

    const gridProps = {
      strokeDasharray: '3 3',
      stroke: '#E2E8F0',
      vertical: false,
    }

    return (
      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'area' ? (
          <AreaChart {...commonProps}>
            <defs>
              {dataKeys.map((key, i) => (
                <linearGradient key={key} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PIE_COLORS[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={PIE_COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={PIE_COLORS[i]}
                strokeWidth={2}
                fill={`url(#gradient-${i})`}
              />
            ))}
          </AreaChart>
        ) : chartType === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={PIE_COLORS[i]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={PIE_COLORS[i]}
                strokeWidth={2}
                dot={{ fill: PIE_COLORS[i], strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    )
  }

  // Años disponibles
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  // Opciones de año incluyendo "Todos"
  type YearOption = { value: number | 'all'; label: string }
  const yearOptions: YearOption[] = useMemo(() => [
    { value: 'all', label: 'Todos los años' },
    ...years.map(y => ({ value: y, label: String(y) }))
  ], [years])

  return (
    <div className="space-y-4">
      {/* Header con toggle Resumen/Detalle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Toggle de vista */}
        <div className="flex items-center p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 flex-1 sm:flex-none">
          <button
            onClick={() => setActiveView('resumen')}
            className={cn(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
              'text-sm font-medium transition-all duration-300',
              activeView === 'resumen'
                ? 'bg-gradient-to-r from-plasma-blue to-plasma-indigo text-white shadow-lg shadow-plasma-blue/25'
                : 'text-soft-slate hover:text-vision-ink'
            )}
          >
            <Sparkles className="size-4" />
            <span>Resumido</span>
            {resumenSections.length > 1 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20">
                {resumenSections.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('detalle')}
            className={cn(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
              'text-sm font-medium transition-all duration-300',
              activeView === 'detalle'
                ? 'bg-gradient-to-r from-plasma-blue to-plasma-indigo text-white shadow-lg shadow-plasma-blue/25'
                : 'text-soft-slate hover:text-vision-ink'
            )}
          >
            <Layers className="size-4" />
            <span>Detallado</span>
            {detalleSections.length > 1 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20">
                {detalleSections.length}
              </span>
            )}
          </button>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Selector de año */}
          <div className="relative">
            <button
              onClick={() => setShowYearFilter(!showYearFilter)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/60 text-sm font-medium text-vision-ink hover:bg-white/70 transition-all"
            >
              <Calendar className="size-4 text-plasma-blue" />
              <span>{selectedYear === 'all' ? 'Todos' : selectedYear}</span>
              <ChevronDown className={cn('size-4 transition-transform', showYearFilter && 'rotate-180')} />
            </button>
            
            <AnimatePresence>
              {showYearFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 z-20 glass-panel rounded-xl border border-white/60 shadow-xl overflow-hidden min-w-[140px]"
                >
                  {yearOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedYear(option.value)
                        setShowYearFilter(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left transition-all',
                        option.value === selectedYear
                          ? 'bg-plasma-blue/10 text-plasma-blue font-semibold'
                          : 'text-vision-ink hover:bg-white/50'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tipo de gráfica */}
          <div className="flex items-center p-1 bg-white/50 rounded-xl border border-white/60">
            {[
              { type: 'area' as ChartType, icon: BarChart3 },
              { type: 'bar' as ChartType, icon: BarChart3 },
              { type: 'line' as ChartType, icon: LineChartIcon },
            ].map(({ type, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  chartType === type
                    ? 'bg-plasma-blue text-white shadow-sm'
                    : 'text-soft-slate hover:text-vision-ink'
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegador de Secciones (solo si hay más de 1) */}
      {activeSections.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-3 border border-plasma-blue/20 bg-gradient-to-r from-plasma-blue/5 via-transparent to-plasma-indigo/5"
        >
          <div className="flex items-center justify-between">
            {/* Botón anterior */}
            <button
              onClick={goToPrevSection}
              disabled={activeIndex === 0}
              className={cn(
                'p-2 rounded-xl transition-all',
                activeIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/50 text-plasma-blue'
              )}
            >
              <ChevronLeft className="size-5" />
            </button>

            {/* Indicadores de sección */}
            <div className="flex-1 mx-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {activeSections.map((section, idx) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all duration-300',
                      idx === activeIndex
                        ? 'bg-gradient-to-r from-plasma-blue to-plasma-indigo scale-125'
                        : 'bg-soft-slate/30 hover:bg-soft-slate/50'
                    )}
                    aria-label={`Ir a ${section.title}`}
                  />
                ))}
              </div>
              <p className="text-center text-sm font-semibold text-vision-ink truncate">
                {currentSection?.title || 'Cargando...'}
              </p>
              <p className="text-center text-xs text-soft-slate mt-0.5">
                Sección {activeIndex + 1} de {activeSections.length}
              </p>
            </div>

            {/* Botón siguiente */}
            <button
              onClick={goToNextSection}
              disabled={activeIndex === activeSections.length - 1}
              className={cn(
                'p-2 rounded-xl transition-all',
                activeIndex === activeSections.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/50 text-plasma-blue'
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Métricas rápidas */}
      <AnimatePresence mode="wait">
        {metrics && (
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {/* Valor actual */}
            <div className="glass-panel rounded-2xl p-4 border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center',
                  metrics.trend === 'up' ? 'bg-emerald-100 text-emerald-600' :
                  metrics.trend === 'down' ? 'bg-red-100 text-red-600' :
                  'bg-slate-100 text-slate-600'
                )}>
                  {metrics.trend === 'up' ? <TrendingUp className="size-4" /> :
                   metrics.trend === 'down' ? <TrendingDown className="size-4" /> :
                   <Minus className="size-4" />}
                </div>
                <span className="text-xs text-soft-slate">Último período</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-vision-ink truncate">
                {formatValue(metrics.current, metrics.field)}
              </p>
              <div className={cn(
                'flex items-center gap-1 mt-1 text-xs font-medium',
                metrics.trend === 'up' ? 'text-emerald-600' :
                metrics.trend === 'down' ? 'text-red-600' :
                'text-slate-500'
              )}>
                {metrics.trend === 'up' ? <ArrowUpRight className="size-3" /> :
                 metrics.trend === 'down' ? <ArrowDownRight className="size-3" /> : null}
                <span>{Math.abs(metrics.change).toFixed(1)}%</span>
              </div>
            </div>

            {/* Promedio */}
            <div className="glass-panel rounded-2xl p-4 border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-plasma-blue/10 flex items-center justify-center">
                  <BarChart3 className="size-4 text-plasma-blue" />
                </div>
                <span className="text-xs text-soft-slate">Promedio</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-vision-ink truncate">
                {formatValue(metrics.average, metrics.field)}
              </p>
              <p className="text-xs text-soft-slate mt-1">
                {chartData.length} períodos
              </p>
            </div>

            {/* Máximo */}
            <div className="glass-panel rounded-2xl p-4 border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="size-4 text-emerald-600" />
                </div>
                <span className="text-xs text-soft-slate">Máximo</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-vision-ink truncate">
                {formatValue(metrics.max, metrics.field)}
              </p>
            </div>

            {/* Total/Promedio acumulado - para porcentajes mostramos promedio, para montos total */}
            <div className="glass-panel rounded-2xl p-4 border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="size-4 text-purple-600" />
                </div>
                <span className="text-xs text-soft-slate">
                  {mainFieldFormatType === 'percentage' 
                    ? 'Promedio general' 
                    : `Total ${selectedYear === 'all' ? 'acumulado' : selectedYear}`}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-vision-ink truncate">
                {mainFieldFormatType === 'percentage' 
                  ? formatValue(metrics.average, metrics.field)
                  : formatValue(metrics.total, metrics.field)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gráfica principal */}
      <motion.div
        layout
        className="glass-panel rounded-3xl p-4 sm:p-6 border border-white/60 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-vision-ink">
              {currentSection?.title || (activeView === 'resumen' ? 'Tendencia de Resumen' : 'Tendencia de Detalle')}
            </h3>
            <p className="text-xs text-soft-slate mt-0.5">
              Evolución {selectedYear === 'all' ? 'histórica' : `mensual • ${selectedYear}`}
            </p>
            {/* Info de última carga para detalles */}
            {activeView === 'detalle' && currentSection?.lastUploadInfo && (
              <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-plasma-blue/5 rounded-lg border border-plasma-blue/20">
                <div className="w-2 h-2 rounded-full bg-plasma-blue animate-pulse" />
                <span className="text-xs text-plasma-blue font-medium">
                  Última carga: {currentSection.lastUploadInfo.date} • {currentSection.lastUploadInfo.count} registros
                </span>
              </div>
            )}
          </div>
          
          {loading && (
            <RefreshCw className="size-4 text-plasma-blue animate-spin" />
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeView}-${chartType}-${selectedYear}-${activeIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderChart()}
          </motion.div>
        </AnimatePresence>

        {/* Leyenda */}
        {dataKeys.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/40">
            {dataKeys.map((key, i) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i] }}
                />
                <span className="text-xs text-soft-slate capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Insights automáticos */}
      {metrics && chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-4 border border-white/60 bg-gradient-to-br from-plasma-blue/5 to-plasma-indigo/5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma-blue to-plasma-indigo flex items-center justify-center flex-shrink-0">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-vision-ink mb-1">
                Insight automático
              </h4>
              <p className="text-xs text-soft-slate leading-relaxed">
                {metrics.trend === 'up' ? (
                  <>
                    📈 <strong className="text-emerald-600">Tendencia positiva:</strong> El indicador creció {Math.abs(metrics.change).toFixed(1)}% respecto al período anterior. 
                    El promedio es {formatValue(metrics.average, metrics.field)}.
                  </>
                ) : metrics.trend === 'down' ? (
                  <>
                    📉 <strong className="text-red-600">Atención:</strong> El indicador bajó {Math.abs(metrics.change).toFixed(1)}% respecto al período anterior. 
                    Revisa las acciones correctivas necesarias.
                  </>
                ) : (
                  <>
                    ➡️ <strong className="text-slate-600">Estable:</strong> El indicador se mantiene sin cambios significativos. 
                    {mainFieldFormatType === 'percentage' 
                      ? `Promedio: ${formatValue(metrics.average, metrics.field)}.`
                      : `Total acumulado: ${formatValue(metrics.total, metrics.field)}.`}
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
