/**
 * Tarjeta de KPI para el Dashboard
 * Muestra el progreso con semáforo visual
 */

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { STATUS_COLORS, formatMetricValue, type StatusColor } from '@/config/kpi-dashboard-config'
import { KPI_ICON_MAP } from '@/components/kpi/iconMap'
import { cn } from '@/utils/ui'

interface KpiProgressCardProps {
  id: string
  name: string
  shortName: string
  icon: string
  route: string
  format: 'currency' | 'percentage' | 'number'
  actualValue: number | null
  metaValue: number | null
  progressPercent: number
  status: StatusColor
  hasData: boolean
  monthsWithData: number
}

export function KpiProgressCard({
  name,
  icon,
  route,
  format,
  actualValue,
  metaValue,
  progressPercent,
  status,
  hasData,
  monthsWithData,
}: KpiProgressCardProps) {
  const Icon = KPI_ICON_MAP[icon]
  const colors = STATUS_COLORS[status]
  
  // Limitar progreso visual a 100% para la barra
  const barProgress = Math.min(progressPercent, 100)
  
  return (
    <Link to={route} className="block group">
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden rounded-2xl lg:rounded-3xl',
          'bg-white/70 backdrop-blur-xl',
          'border border-white/60',
          'shadow-soft hover:shadow-glass',
          'transition-all duration-300',
          'p-4 sm:p-5'
        )}
      >
        {/* Glow de fondo según estado */}
        <div 
          className={cn(
            'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-500',
            'group-hover:opacity-40',
            colors.bg
          )} 
        />

        {/* Header: Ícono + Nombre + Indicador */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Ícono */}
            <div className={cn(
              'flex-shrink-0 flex items-center justify-center',
              'w-10 h-10 sm:w-11 sm:h-11 rounded-xl lg:rounded-2xl',
              'bg-gradient-to-br from-plasma-blue/10 to-plasma-indigo/10',
              'text-plasma-blue',
              'group-hover:from-plasma-blue group-hover:to-plasma-indigo',
              'group-hover:text-white group-hover:shadow-glow-sm',
              'transition-all duration-300'
            )}>
              {Icon && <Icon className="size-5" />}
            </div>
            
            {/* Nombre */}
            <h3 className="text-sm sm:text-base font-semibold text-vision-ink truncate group-hover:text-plasma-blue transition-colors">
              {name}
            </h3>
          </div>

          {/* Indicador de semáforo */}
          <div className={cn(
            'flex-shrink-0 w-3 h-3 rounded-full',
            colors.dot,
            'shadow-lg',
            colors.glow
          )} />
        </div>

        {/* Barra de progreso */}
        <div className="relative h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barProgress}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0, 1], delay: 0.2 }}
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              'bg-gradient-to-r',
              colors.progress
            )}
          />
          
          {/* Línea de meta al 100% */}
          {hasData && (
            <div className="absolute top-0 bottom-0 right-0 w-px bg-slate-300" />
          )}
        </div>

        {/* Valores y porcentaje */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            {hasData ? (
              <>
                <p className="text-lg sm:text-xl font-bold text-vision-ink truncate">
                  {formatMetricValue(actualValue, format)}
                </p>
                <p className="text-xs text-soft-slate truncate">
                  Meta: {formatMetricValue(metaValue, format)}
                </p>
              </>
            ) : (
              <>
                <p className="text-base sm:text-lg font-medium text-slate-400">
                  Sin datos
                </p>
                <p className="text-xs text-soft-slate">
                  Inicia capturando información
                </p>
              </>
            )}
          </div>

          {/* Porcentaje */}
          <div className="flex-shrink-0 text-right">
            {hasData ? (
              <p className={cn(
                'text-xl sm:text-2xl font-bold',
                colors.text
              )}>
                {Math.round(progressPercent)}%
              </p>
            ) : (
              <p className="text-lg font-medium text-slate-400">-</p>
            )}
            {hasData && monthsWithData > 0 && (
              <p className="text-[10px] text-soft-slate">
                {monthsWithData} {monthsWithData === 1 ? 'mes' : 'meses'}
              </p>
            )}
          </div>
        </div>

        {/* Hover: Flecha de navegación */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ArrowUpRight className="size-4 text-plasma-blue" />
        </div>
      </motion.div>
    </Link>
  )
}
