import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export const AuthLayout = () => (
  <div className="min-h-screen bg-vision-gradient p-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-xl space-y-6 rounded-4xl border border-white/60 bg-white/70 p-10 backdrop-blur-3xl"
    >
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-soft-slate">KPIs VisionOS</p>
        <h1 className="text-3xl font-semibold text-vision-ink">Bienvenido</h1>
        <p className="text-sm text-soft-slate">Accede para continuar con la captura de indicadores.</p>
      </div>
      <Outlet />
    </motion.div>
  </div>
)
