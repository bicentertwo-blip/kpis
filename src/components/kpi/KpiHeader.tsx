import { motion } from 'framer-motion'
import type { KpiViewDefinition, ProgressStatus } from '@/types/kpi'
import { KPI_ICON_MAP } from './iconMap'
import { ProgressPill } from '@/components/status/ProgressPill'

interface KpiHeaderProps {
  definition: KpiViewDefinition
  status: ProgressStatus
}

export const KpiHeader = ({ definition, status }: KpiHeaderProps) => {
  const Icon = KPI_ICON_MAP[definition.icon]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl px-6 py-5"
    >
      <div>
        <div className="flex items-center gap-3 text-vision-ink">
          {Icon && <Icon className="size-5 text-plasma-blue" />}
          <p className="text-xs uppercase tracking-[0.25em] text-soft-slate">Vista KPI</p>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-vision-ink">{definition.name}</h1>
        <p className="text-sm text-soft-slate">{definition.description}</p>
      </div>
      <ProgressPill status={status} className="drop-shadow-sm" />
    </motion.div>
  )
}
