import { motion } from 'framer-motion'
import { Check, Loader2, Cloud } from 'lucide-react'

interface AutosaveIndicatorProps {
  saving: boolean
  lastSavedAt?: string
}

export const AutosaveIndicator = ({ saving, lastSavedAt }: AutosaveIndicatorProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 rounded-xl sm:rounded-2xl bg-white/60 backdrop-blur-lg border border-white/60 px-4 py-2.5 sm:px-5 sm:py-3 shadow-soft"
  >
    <div className="flex items-center gap-2">
      {saving ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-plasma-blue"
        >
          <Loader2 className="size-4" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600"
        >
          <Check className="size-3" />
        </motion.div>
      )}
      <Cloud className="size-4 text-soft-slate/60" />
    </div>
    <p className="text-xs sm:text-sm text-soft-slate">
      {saving ? (
        <span className="text-plasma-blue font-medium">Guardando cambios...</span>
      ) : lastSavedAt ? (
        <span>
          Guardado <span className="text-vision-ink font-medium">{new Date(lastSavedAt).toLocaleTimeString()}</span>
        </span>
      ) : (
        'Todos los cambios guardados'
      )}
    </p>
  </motion.div>
)
