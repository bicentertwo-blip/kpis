import { motion } from 'framer-motion'
import { Sparkles, Lock, ArrowRight } from 'lucide-react'
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
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1] }}
        className="relative w-full max-w-lg"
      >
        {/* Background glow */}
        <div className="absolute -inset-4 bg-gradient-to-br from-plasma-blue/10 via-transparent to-plasma-violet/10 rounded-[3rem] blur-2xl" />
        
        <div className="glass-panel relative rounded-3xl sm:rounded-4xl p-8 sm:p-10 lg:p-12 text-center">
          {/* Inner gradient */}
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/60 via-transparent to-white/30 pointer-events-none" />
          
          <div className="relative">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-plasma-blue/10 to-plasma-indigo/10 mb-6"
            >
              {viewId ? (
                <Lock className="size-8 sm:size-10 text-plasma-blue" />
              ) : (
                <Sparkles className="size-8 sm:size-10 text-plasma-blue" />
              )}
            </motion.div>

            {/* Title */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-plasma-blue font-medium mb-3"
            >
              {viewId ? 'Acceso restringido' : 'Bienvenido'}
            </motion.p>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl lg:text-3xl font-semibold text-vision-ink mb-3 text-balance"
            >
              {viewName ? `Aún no tienes acceso a ${viewName}` : 'Experiencia VisionOS'}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm sm:text-base text-soft-slate max-w-sm mx-auto leading-relaxed"
            >
              {customMessage ??
                'Solicita permisos para activar esta vista. Una vez asignado, verás formularios, herramientas de seguimiento y estados actualizados en tiempo real.'}
            </motion.p>

            {/* Action hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 pt-6 border-t border-white/40"
            >
              <p className="text-xs text-soft-slate flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-plasma-blue/60 animate-pulse" />
                Contacta a tu administrador para obtener acceso
                <ArrowRight className="size-3" />
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
