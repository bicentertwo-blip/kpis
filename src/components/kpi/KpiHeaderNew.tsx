/**
 * Header para páginas de KPI con nueva arquitectura
 */

import { motion } from 'framer-motion'
import type { KpiDefinition } from '@/types/kpi-definitions'
import { KPI_ICON_MAP } from './iconMap'
import { ProgressPill } from '@/components/status/ProgressPill'
import { GlassCard } from '@/components/base/GlassCard'
import type { ProgressStatus } from '@/types/kpi'

interface KpiHeaderNewProps {
  config: KpiDefinition
  status?: ProgressStatus
}

export const KpiHeaderNew = ({ config, status = 'not_started' }: KpiHeaderNewProps) => {
  const Icon = KPI_ICON_MAP[config.icon]
  
  return (
    <GlassCard animate padding="lg" className="overflow-visible">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        {/* Left side - Icon and info */}
        <div className="flex items-start sm:items-center gap-4">
          {/* Icon container with gradient */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="relative flex-shrink-0"
          >
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-plasma-blue to-plasma-indigo text-white shadow-glow-sm">
              {Icon && <Icon className="size-7 sm:size-8" />}
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-plasma-blue to-plasma-indigo blur-lg opacity-30 -z-10" />
          </motion.div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-plasma-blue font-medium"
            >
              Vista KPI
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="text-xl sm:text-2xl lg:text-3xl font-semibold text-vision-ink mt-1 leading-tight"
            >
              {config.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-soft-slate mt-1 line-clamp-2 sm:line-clamp-1"
            >
              {config.description}
            </motion.p>
          </div>
        </div>

        {/* Right side - Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring' }}
          className="flex-shrink-0"
        >
          <ProgressPill status={status} size="md" />
        </motion.div>
      </div>
    </GlassCard>
  )
}
