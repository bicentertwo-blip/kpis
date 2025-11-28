import type { ProgressStatus } from '@/types/kpi'
import { cn } from '@/utils/ui'

const STATUS_META: Record<ProgressStatus, { label: string; className: string }> = {
  not_started: { label: 'Sin iniciar', className: 'bg-white/60 text-soft-slate' },
  in_progress: { label: 'En progreso', className: 'bg-amber-50/80 text-amber-900' },
  complete: { label: 'Completo', className: 'bg-emerald-50/80 text-emerald-900' },
}

interface ProgressPillProps {
  status: ProgressStatus
  className?: string
}

export const ProgressPill = ({ status, className }: ProgressPillProps) => {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', meta.className, className)}>
      {meta.label}
    </span>
  )
}
