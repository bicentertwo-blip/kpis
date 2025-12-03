/**
 * KPI Metrics Cards - Dashboard Ejecutivo
 * Diseño premium para comparación de indicadores vs metas
 * Optimizado para iPhone y móviles
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Trophy,
  AlertTriangle,
  Flame,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/ui'

// Tipos
interface MetricData {
  currentValue: number
  currentMeta: number
  accumulatedValue: number
  accumulatedMeta: number
  previousMonthValue?: number
  sameMonthLastYear?: number
  accumulatedLastYear?: number
  previousYearAccumulated?: number
  fieldName: string
  formatType: 'currency' | 'percentage' | 'number'
  currentPeriod: { mes: number; anio: number }
  historicalData?: Array<{ anio: number; mes: number; value: number }>
}

interface KpiMetricsCardsProps {
  data: MetricData
  loading?: boolean
}

// Nombres de meses
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Formatters
const formatValue = (value: number, type: 'currency' | 'percentage' | 'number'): string => {
  if (type === 'currency') {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (type === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString('es-MX', { maximumFractionDigits: 1 })
}

const formatVariation = (value: number): string => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// Calcular cumplimiento
const getComplianceStatus = (value: number, meta: number) => {
  if (meta === 0) return { percentage: 0, status: 'neutral' as const }
  const percentage = (value / meta) * 100
  
  if (percentage >= 100) return { percentage, status: 'excellent' as const }
  if (percentage >= 90) return { percentage, status: 'good' as const }
  if (percentage >= 70) return { percentage, status: 'warning' as const }
  return { percentage, status: 'critical' as const }
}

// Colores según estado
const statusColors = {
  excellent: {
    bg: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    glow: 'shadow-emerald-500/20',
    icon: Trophy,
  },
  good: {
    bg: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    glow: 'shadow-blue-500/20',
    icon: TrendingUp,
  },
  warning: {
    bg: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    glow: 'shadow-amber-500/20',
    icon: AlertTriangle,
  },
  critical: {
    bg: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    glow: 'shadow-red-500/20',
    icon: Flame,
  },
  neutral: {
    bg: 'from-slate-400 to-slate-500',
    bgLight: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    glow: 'shadow-slate-500/20',
    icon: Minus,
  },
}

// Componente de Gauge circular
const CircularGauge = ({ 
  percentage, 
  status, 
  size = 'md' 
}: { 
  percentage: number
  status: keyof typeof statusColors
  size?: 'sm' | 'md' | 'lg'
}) => {
  const sizes = {
    sm: { dimension: 48, stroke: 4, fontSize: 'text-xs' },
    md: { dimension: 72, stroke: 5, fontSize: 'text-sm' },
    lg: { dimension: 96, stroke: 6, fontSize: 'text-lg' },
  }
  
  const { dimension, stroke, fontSize } = sizes[size]
  const radius = (dimension - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const cappedPercentage = Math.min(percentage, 100)
  const offset = circumference - (cappedPercentage / 100) * circumference

  return (
    <div className="relative" style={{ width: dimension, height: dimension }}>
      <svg width={dimension} height={dimension} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-slate-200/50"
        />
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={cn(
              status === 'excellent' && 'stop-color: #10b981',
              status === 'good' && 'stop-color: #3b82f6',
              status === 'warning' && 'stop-color: #f59e0b',
              status === 'critical' && 'stop-color: #ef4444',
              status === 'neutral' && 'stop-color: #64748b',
            )} style={{ stopColor: status === 'excellent' ? '#10b981' : status === 'good' ? '#3b82f6' : status === 'warning' ? '#f59e0b' : status === 'critical' ? '#ef4444' : '#64748b' }} />
            <stop offset="100%" className={cn(
              status === 'excellent' && 'stop-color: #0d9488',
              status === 'good' && 'stop-color: #4f46e5',
              status === 'warning' && 'stop-color: #ea580c',
              status === 'critical' && 'stop-color: #e11d48',
              status === 'neutral' && 'stop-color: #475569',
            )} style={{ stopColor: status === 'excellent' ? '#0d9488' : status === 'good' ? '#4f46e5' : status === 'warning' ? '#ea580c' : status === 'critical' ? '#e11d48' : '#475569' }} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('font-bold', fontSize, statusColors[status].text)}>
          {percentage > 999 ? '999+' : Math.round(percentage)}%
        </span>
      </div>
    </div>
  )
}

// Mini sparkline para histórico
const MiniSparkline = ({ 
  data, 
  color = '#4F46E5',
  height = 32 
}: { 
  data: number[]
  color?: string
  height?: number 
}) => {
  if (data.length < 2) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
      {/* Punto final */}
      <circle
        cx="100%"
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r={3}
        fill={color}
        className="drop-shadow-md"
      />
    </svg>
  )
}

// Tarjeta de variación compacta
const VariationCard = ({
  label,
  sublabel,
  currentValue,
  compareValue,
  formatType,
  delay = 0,
}: {
  label: string
  sublabel: string
  currentValue: number
  compareValue?: number
  formatType: 'currency' | 'percentage' | 'number'
  delay?: number
}) => {
  const variation = compareValue ? ((currentValue - compareValue) / Math.abs(compareValue)) * 100 : 0
  const isPositive = variation >= 0
  const hasData = compareValue !== undefined && compareValue !== 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-4',
        'bg-white/60 backdrop-blur-xl border border-white/60',
        'shadow-lg shadow-black/5'
      )}
    >
      {/* Decorative gradient */}
      <div className={cn(
        'absolute top-0 right-0 w-20 h-20 -mr-8 -mt-8 rounded-full blur-2xl opacity-30',
        isPositive ? 'bg-emerald-400' : 'bg-red-400'
      )} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-medium text-soft-slate">{label}</p>
            <p className="text-[10px] text-soft-slate/70">{sublabel}</p>
          </div>
          {hasData && (
            <div className={cn(
              'flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold',
              isPositive 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
            )}>
              {isPositive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {formatVariation(variation)}
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-vision-ink">
              {formatValue(currentValue, formatType)}
            </p>
            {hasData && (
              <p className="text-xs text-soft-slate mt-0.5">
                vs {formatValue(compareValue!, formatType)}
              </p>
            )}
          </div>
          
          {!hasData && (
            <span className="text-xs text-soft-slate/50 italic">Sin datos</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Componente Principal
export const KpiMetricsCards = ({ data, loading }: KpiMetricsCardsProps) => {
  const {
    currentValue,
    currentMeta,
    accumulatedValue,
    accumulatedMeta,
    previousMonthValue,
    sameMonthLastYear,
    accumulatedLastYear,
    formatType,
    currentPeriod,
    historicalData,
  } = data

  // Calcular estados de cumplimiento
  const monthlyCompliance = useMemo(() => 
    getComplianceStatus(currentValue, currentMeta), 
    [currentValue, currentMeta]
  )
  
  const ytdCompliance = useMemo(() => 
    getComplianceStatus(accumulatedValue, accumulatedMeta), 
    [accumulatedValue, accumulatedMeta]
  )

  // Calcular variaciones
  const monthlyVariation = previousMonthValue 
    ? ((currentValue - previousMonthValue) / Math.abs(previousMonthValue)) * 100 
    : 0

  const yoyVariation = sameMonthLastYear 
    ? ((currentValue - sameMonthLastYear) / Math.abs(sameMonthLastYear)) * 100 
    : 0

  // Datos para sparkline (últimos 6 meses o lo disponible)
  const sparklineData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return []
    return historicalData.slice(-6).map(d => d.value)
  }, [historicalData])

  const StatusIcon = monthlyCompliance.status !== 'neutral' 
    ? statusColors[monthlyCompliance.status].icon 
    : Target

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 rounded-3xl bg-white/40" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 rounded-2xl bg-white/40" />
          <div className="h-32 rounded-2xl bg-white/40" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* === TARJETA HERO: Resultado del Mes vs Meta === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'relative overflow-hidden rounded-3xl',
          'bg-gradient-to-br from-white/80 via-white/60 to-white/40',
          'backdrop-blur-2xl border border-white/60',
          'shadow-xl shadow-black/5',
          'p-5 sm:p-6'
        )}
      >
        {/* Background decorations */}
        <div className={cn(
          'absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20',
          `bg-gradient-to-br ${statusColors[monthlyCompliance.status].bg}`
        )} />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-10 bg-plasma-blue" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                `bg-gradient-to-br ${statusColors[monthlyCompliance.status].bg}`,
                'shadow-lg',
                statusColors[monthlyCompliance.status].glow
              )}>
                <StatusIcon className="size-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-vision-ink">Resultado del Mes</h3>
                <p className="text-xs text-soft-slate">
                  {MONTHS[currentPeriod.mes - 1]} {currentPeriod.anio}
                </p>
              </div>
            </div>
            
            <CircularGauge 
              percentage={monthlyCompliance.percentage} 
              status={monthlyCompliance.status}
              size="md"
            />
          </div>

          {/* Valores principales */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-soft-slate mb-1">Resultado</p>
              <p className="text-2xl sm:text-3xl font-bold text-vision-ink tracking-tight">
                {formatValue(currentValue, formatType)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-soft-slate mb-1">Meta</p>
              <p className="text-2xl sm:text-3xl font-bold text-soft-slate/70 tracking-tight">
                {formatValue(currentMeta, formatType)}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="relative h-3 rounded-full bg-slate-200/50 overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(monthlyCompliance.percentage, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                `bg-gradient-to-r ${statusColors[monthlyCompliance.status].bg}`
              )}
            />
            {/* Línea de meta al 100% */}
            <div className="absolute inset-y-0 right-0 w-px bg-vision-ink/20" />
          </div>

          {/* Variaciones rápidas */}
          <div className="flex items-center gap-3 flex-wrap">
            {previousMonthValue !== undefined && previousMonthValue !== 0 && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                monthlyVariation >= 0 
                  ? 'bg-emerald-100/80 text-emerald-700' 
                  : 'bg-red-100/80 text-red-700'
              )}>
                {monthlyVariation >= 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                <span>{formatVariation(monthlyVariation)}</span>
                <span className="text-[10px] opacity-70">vs mes ant.</span>
              </div>
            )}
            
            {sameMonthLastYear !== undefined && sameMonthLastYear !== 0 && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                yoyVariation >= 0 
                  ? 'bg-blue-100/80 text-blue-700' 
                  : 'bg-orange-100/80 text-orange-700'
              )}>
                <Calendar className="size-3.5" />
                <span>{formatVariation(yoyVariation)}</span>
                <span className="text-[10px] opacity-70">vs {currentPeriod.anio - 1}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* === TARJETA ACUMULADO YTD === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className={cn(
          'relative overflow-hidden rounded-3xl',
          'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
          'border border-white/10',
          'shadow-xl shadow-black/20',
          'p-5 sm:p-6'
        )}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-plasma-blue/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-xl" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma-blue to-indigo-600 flex items-center justify-center shadow-lg shadow-plasma-blue/30">
                <Zap className="size-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Acumulado {currentPeriod.anio}</h3>
                <p className="text-xs text-slate-400">
                  Ene - {MONTHS_SHORT[currentPeriod.mes - 1]}
                </p>
              </div>
            </div>
            
            <CircularGauge 
              percentage={ytdCompliance.percentage} 
              status={ytdCompliance.status}
              size="md"
            />
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Acumulado</p>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {formatValue(accumulatedValue, formatType)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Meta YTD</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-500 tracking-tight">
                {formatValue(accumulatedMeta, formatType)}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="relative h-3 rounded-full bg-white/10 overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(ytdCompliance.percentage, 100)}%` }}
              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-plasma-blue via-indigo-500 to-purple-500"
            />
          </div>

          {/* Comparativo año anterior */}
          {accumulatedLastYear !== undefined && accumulatedLastYear !== 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-slate-400" />
                <span className="text-xs text-slate-400">vs Acum. {currentPeriod.anio - 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">
                  {formatValue(accumulatedLastYear, formatType)}
                </span>
                {(() => {
                  const variation = ((accumulatedValue - accumulatedLastYear) / Math.abs(accumulatedLastYear)) * 100
                  return (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      variation >= 0 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    )}>
                      {formatVariation(variation)}
                    </span>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* === MINI CARDS DE COMPARACIÓN === */}
      <div className="grid grid-cols-2 gap-3">
        <VariationCard
          label="vs Mes Anterior"
          sublabel={MONTHS_SHORT[(currentPeriod.mes - 2 + 12) % 12]}
          currentValue={currentValue}
          compareValue={previousMonthValue}
          formatType={formatType}
          delay={0.2}
        />
        <VariationCard
          label="vs Mismo Mes"
          sublabel={`${MONTHS_SHORT[currentPeriod.mes - 1]} ${currentPeriod.anio - 1}`}
          currentValue={currentValue}
          compareValue={sameMonthLastYear}
          formatType={formatType}
          delay={0.25}
        />
      </div>

      {/* === TENDENCIA HISTÓRICA === */}
      {sparklineData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'bg-white/60 backdrop-blur-xl border border-white/60',
            'shadow-lg shadow-black/5',
            'p-4'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-plasma-blue" />
              <span className="text-sm font-semibold text-vision-ink">Tendencia</span>
            </div>
            <span className="text-xs text-soft-slate">Últimos 6 meses</span>
          </div>
          
          <div className="h-12">
            <MiniSparkline 
              data={sparklineData} 
              color="#4F46E5"
              height={48}
            />
          </div>

          {/* Valores min/max */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-soft-slate">
            <span>Mín: {formatValue(Math.min(...sparklineData), formatType)}</span>
            <span>Máx: {formatValue(Math.max(...sparklineData), formatType)}</span>
          </div>
        </motion.div>
      )}

      {/* === INSIGHT RÁPIDO === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className={cn(
          'flex items-start gap-3 p-4 rounded-2xl',
          'bg-gradient-to-br from-plasma-blue/5 via-indigo-500/5 to-purple-500/5',
          'border border-plasma-blue/20'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-plasma-blue to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-plasma-blue/20">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-vision-ink mb-1">Análisis automático</p>
          <p className="text-xs text-soft-slate leading-relaxed">
            {monthlyCompliance.status === 'excellent' ? (
              <>🎯 <strong className="text-emerald-600">¡Excelente!</strong> Superaste la meta mensual por {formatValue(currentValue - currentMeta, formatType)}. Mantén este ritmo.</>
            ) : monthlyCompliance.status === 'good' ? (
              <>📈 <strong className="text-blue-600">Buen avance.</strong> Estás al {monthlyCompliance.percentage.toFixed(0)}% de la meta. Faltan {formatValue(currentMeta - currentValue, formatType)} para alcanzarla.</>
            ) : monthlyCompliance.status === 'warning' ? (
              <>⚠️ <strong className="text-amber-600">Atención.</strong> El cumplimiento está al {monthlyCompliance.percentage.toFixed(0)}%. Revisa las acciones correctivas.</>
            ) : monthlyCompliance.status === 'critical' ? (
              <>🚨 <strong className="text-red-600">Alerta.</strong> El indicador está significativamente por debajo de la meta. Se requiere acción inmediata.</>
            ) : (
              <>📊 Sin meta definida para este período. Configura las metas para habilitar el análisis.</>
            )}
          </p>
        </div>
        <ChevronRight className="size-4 text-soft-slate/50 flex-shrink-0" />
      </motion.div>
    </div>
  )
}

export type { MetricData }
