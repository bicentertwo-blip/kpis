import { motion } from 'framer-motion'

export const FullScreenLoader = () => (
  <div className="fixed inset-0 grid place-items-center bg-gradient-to-br from-white via-vision-glow to-white">
    {/* Animated background orbs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-plasma-blue/10 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-plasma-indigo/10 blur-3xl"
      />
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center gap-6"
    >
      {/* Logo with pulse */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 shadow-glow overflow-hidden p-2">
          <img 
            src="/logo.png" 
            alt="Logo Inteligencia de Negocios" 
            className="max-w-full max-h-full object-contain"
            style={{ aspectRatio: 'auto' }}
          />
        </div>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-plasma-blue to-plasma-violet"
        />
      </motion.div>

      {/* Loading text */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-0"
        >
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-vision-ink via-plasma-blue to-plasma-indigo bg-clip-text text-transparent tracking-tight">
            KPIs
          </h1>
          <p className="text-[9px] uppercase tracking-[0.25em] text-plasma-blue font-semibold mt-0.5">
            Inteligencia de Negocios
          </p>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-medium text-vision-ink mt-4"
        >
          Preparando tu espacio
        </motion.p>
      </div>

      {/* Loading dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-plasma-blue"
          />
        ))}
      </div>
    </motion.div>
  </div>
)
