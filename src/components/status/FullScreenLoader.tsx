import { motion } from 'framer-motion'

export const FullScreenLoader = () => (
  <div className="grid min-h-screen place-items-center bg-vision-gradient">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.2 }}
      className="glass-panel rounded-4xl px-10 py-6 text-center"
    >
      <p className="text-sm uppercase tracking-[0.45em] text-soft-slate">Loading</p>
      <p className="text-2xl font-semibold text-vision-ink">Preparando tu espacio</p>
    </motion.div>
  </div>
)
