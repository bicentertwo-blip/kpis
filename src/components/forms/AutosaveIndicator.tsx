import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

interface AutosaveIndicatorProps {
  saving: boolean
  lastSavedAt?: string
}

export const AutosaveIndicator = ({ saving, lastSavedAt }: AutosaveIndicatorProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 px-4 py-2 text-xs text-soft-slate">
    <motion.span
      animate={{ rotate: saving ? 360 : 0 }}
      transition={{ duration: saving ? 0.8 : 0.3, repeat: saving ? Infinity : 0, ease: 'linear' }}
      className="text-plasma-blue"
    >
      {saving ? <Loader2 className="size-4" /> : <Check className="size-4" />}
    </motion.span>
    <p>{saving ? 'Guardando cambios...' : lastSavedAt ? `Guardado ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Último guardado listo'}</p>
  </div>
)
