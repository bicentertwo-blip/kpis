/**
 * Panel de Análisis para KPIs
 * Visualización de datos históricos con gráficas interactivas
 * Optimizado para móviles (iPhone-first)
 */

import { useState, useEffect, useMemo } from 'react'
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

// Colores para gráficas - eslint-disable-next-line
const PIE_COLORS = ['#4F46E5', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6366F1']

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const KpiAnalysisPanel = ({ config, filters }: KpiAnalysisPanelProps) => {
  const [activeView, setActiveView] = useState<AnalysisView>('resumen')
  const [chartType, setChartType] = useState<ChartType>('area')
  const [loading, setLoading] = useState(true)
  const [resumenData, setResumenData] = useState<DataPoint[]>([])
  const [detalleData, setDetalleData] = useState<DataPoint[]>([])
  const [selectedYear, setSelectedYear] = useState(filters?.anio || new Date().getFullYear())
  const [showYearFilter, setShowYearFilter] = useState(false)
  
  const userId = useAuthStore((state) => state.session?.user.id)

  // Obtener tablas del config
  const resumenTable = config.summaries[0]?.tableName
  const detalleTable = config.details[0]?.tableName

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      setLoading(true)

      try {
        // Cargar datos de resumen
        if (resumenTable) {
          const { data: resumen } = await supabase
            .from(resumenTable)
            .select('*')
            .eq('owner_id', userId)
            .eq('anio', selectedYear)
            .order('mes', { ascending: true })

          if (resumen) {
            setResumenData(resumen.map((r: Record<string, unknown>) => ({
              ...r,
              periodo: `${MONTHS_SHORT[(r.mes as number) - 1]} ${r.anio}`,
            })) as DataPoint[])
          }
        }

        // Cargar datos de detalle (agregados por mes)
        if (detalleTable) {
          const { data: detalle } = await supabase
            .from(detalleTable)
            .select('*')
            .eq('owner_id', userId)
            .eq('anio', selectedYear)
            .order('mes', { ascending: true })

          if (detalle) {
            // Agrupar por mes para el detalle
            const grouped = (detalle as Record<string, unknown>[]).reduce((acc: Record<number, DataPoint>, curr) => {
              const mes = curr.mes as number
              if (!acc[mes]) {
                acc[mes] = {
                  periodo: `${MONTHS_SHORT[mes - 1]} ${curr.anio}`,
                  mes,
                  anio: curr.anio as number,
                  count: 0,
                }
              }
              acc[mes].count = (acc[mes].count as number) + 1
              // Sumar valores numéricos
              Object.keys(curr).forEach((key) => {
                if (typeof curr[key] === 'number' && !['mes', 'anio'].includes(key)) {
                  acc[mes][key] = ((acc[mes][key] as number) || 0) + (curr[key] as number)
                }
              })
              return acc
            }, {})
            setDetalleData(Object.values(grouped))
          }
        }
      } catch (error) {
        console.error('Error cargando datos de análisis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, resumenTable, detalleTable, selectedYear])

  // Calcular métricas
  const metrics = useMemo(() => {
    const data = activeView === 'resumen' ? resumenData : detalleData
    if (data.length === 0) return null

    // Encontrar el campo numérico principal
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
  }, [activeView, resumenData, detalleData])

  // Obtener datos para gráficas
  const chartData = activeView === 'resumen' ? resumenData : detalleData
  const dataKeys = useMemo(() => {
    if (chartData.length === 0) return []
    return Object.keys(chartData[0] || {}).filter(
      (k) => typeof chartData[0][k] === 'number' && !['mes', 'anio'].includes(k)
    ).slice(0, 3) // Máximo 3 series
  }, [chartData])

  // Formato de números
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toFixed(0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Tooltip personalizado
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
            <span className="font-semibold text-vision-ink">{formatCurrency(entry.value)}</span>
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
          <p className="text-soft-slate text-sm">Sin datos para {selectedYear}</p>
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
              <span>{selectedYear}</span>
              <ChevronDown className={cn('size-4 transition-transform', showYearFilter && 'rotate-180')} />
            </button>
            
            <AnimatePresence>
              {showYearFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 z-20 glass-panel rounded-xl border border-white/60 shadow-xl overflow-hidden"
                >
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year)
                        setShowYearFilter(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left transition-all',
                        year === selectedYear
                          ? 'bg-plasma-blue/10 text-plasma-blue font-semibold'
                          : 'text-vision-ink hover:bg-white/50'
                      )}
                    >
                      {year}
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
                {formatCurrency(metrics.current)}
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
                {formatCurrency(metrics.average)}
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
                {formatCurrency(metrics.max)}
              </p>
            </div>

            {/* Total acumulado */}
            <div className="glass-panel rounded-2xl p-4 border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="size-4 text-purple-600" />
                </div>
                <span className="text-xs text-soft-slate">Total {selectedYear}</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-vision-ink truncate">
                {formatCurrency(metrics.total)}
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
              {activeView === 'resumen' ? 'Tendencia de Resumen' : 'Tendencia de Detalle'}
            </h3>
            <p className="text-xs text-soft-slate mt-0.5">
              Evolución mensual • {selectedYear}
            </p>
          </div>
          
          {loading && (
            <RefreshCw className="size-4 text-plasma-blue animate-spin" />
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeView}-${chartType}-${selectedYear}`}
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
                    El promedio anual es {formatCurrency(metrics.average)}.
                  </>
                ) : metrics.trend === 'down' ? (
                  <>
                    📉 <strong className="text-red-600">Atención:</strong> El indicador bajó {Math.abs(metrics.change).toFixed(1)}% respecto al período anterior. 
                    Revisa las acciones correctivas necesarias.
                  </>
                ) : (
                  <>
                    ➡️ <strong className="text-slate-600">Estable:</strong> El indicador se mantiene sin cambios significativos. 
                    Total acumulado: {formatCurrency(metrics.total)}.
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
