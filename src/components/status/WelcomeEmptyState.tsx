import { motion } from 'framer-motion'
import { PERMISSION_VIEW_MAP } from '@/utils/constants'
import type { AppViewId } from '@/types/views'

interface WelcomeEmptyStateProps {
  viewId?: AppViewId
  customMessage?: string
}

export const WelcomeEmptyState = ({ viewId, customMessage }: WelcomeEmptyStateProps) => {
  const definition = viewId ? PERMISSION_VIEW_MAP[viewId] : null
  const viewName = definition?.name
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel flex flex-col items-center gap-4 rounded-4xl p-10 text-center"
    >
      <p className="text-xs uppercase tracking-[0.4em] text-soft-slate">Experiencia VisionOS</p>
      <h2 className="text-3xl font-semibold text-vision-ink">
        {viewName ? `Aún no tienes acceso a ${viewName}` : 'Bienvenido a la nueva experiencia'}
      </h2>
      <p className="max-w-xl text-sm text-soft-slate">
        {customMessage ??
          'Solicita permisos para activar esta vista. Una vez asignado, verás formularios, herramientas de seguimiento y estados actualizados en tiempo real.'}
      </p>
    </motion.div>
  )
}
