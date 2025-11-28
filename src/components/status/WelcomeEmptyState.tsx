import { motion } from 'framer-motion'
import { KPI_VIEW_MAP } from '@/utils/constants'
import type { KpiViewId } from '@/types/kpi'

interface WelcomeEmptyStateProps {
  viewId?: KpiViewId
}

export const WelcomeEmptyState = ({ viewId }: WelcomeEmptyStateProps) => {
  const definition = viewId ? KPI_VIEW_MAP[viewId] : null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel flex flex-col items-center gap-4 rounded-4xl p-10 text-center"
    >
      <p className="text-xs uppercase tracking-[0.4em] text-soft-slate">Experiencia VisionOS</p>
      <h2 className="text-3xl font-semibold text-vision-ink">
        {definition ? `Aún no tienes acceso a ${definition.name}` : 'Bienvenido a la nueva experiencia'}
      </h2>
      <p className="max-w-xl text-sm text-soft-slate">
        Solicita permisos a tu administrador para activar esta vista. Una vez asignado, verás formularios, carga CSV y estado de
        progreso en tiempo real.
      </p>
    </motion.div>
  )
}
