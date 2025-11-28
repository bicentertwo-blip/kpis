import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'

export const TopBar = () => {
  const location = useLocation()
  const page = location.pathname.replace('/', '').replace('-', ' ') || 'dashboard'

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel sticky top-6 z-10 flex items-center justify-between rounded-4xl px-6 py-4"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-soft-slate">{page}</p>
        <h1 className="text-xl font-semibold text-vision-ink">Panel ejecutivo</h1>
      </div>
      <label className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/60 px-4 py-2 text-sm text-soft-slate">
        <Search className="size-4" />
        <input className="w-48 bg-transparent text-sm outline-none" placeholder="Buscar" />
      </label>
    </motion.header>
  )
}
