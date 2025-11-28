import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Circle } from 'lucide-react'
import type { ProgressStatus } from '@/types/kpi'
import { cn } from '@/utils/ui'

const STATUS_META: Record<ProgressStatus, { label: string; className: string; icon: typeof Circle }> = {
  not_started: { 
    label: 'Sin iniciar', 
    className: 'bg-slate-100/80 text-slate-600 border-slate-200/60',
    icon: Circle
  },
  in_progress: { 
    label: 'En progreso', 
    className: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
    icon: Clock
  },
  complete: { 
    label: 'Completo', 
    className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60',
    icon: CheckCircle2
  },
}

interface ProgressPillProps {
  status: ProgressStatus
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export const ProgressPill = ({ status, className, showIcon = true, size = 'sm' }: ProgressPillProps) => {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        'backdrop-blur-sm transition-all duration-200',
        size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
        meta.className,
        className
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'size-3' : 'size-3.5')} />}
      {meta.label}
    </motion.span>
  )
}
