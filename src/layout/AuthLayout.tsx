import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export const AuthLayout = () => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
    {/* Animated background orbs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-plasma-blue/10 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-plasma-indigo/10 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-plasma-violet/5 blur-3xl" />
    </div>

    {/* Logo floating above card */}
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1] }}
      className="relative mb-6 sm:mb-8"
    >
      <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-plasma-blue via-plasma-indigo to-plasma-violet shadow-glow">
        <Sparkles className="size-8 sm:size-10 text-white" />
      </div>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-plasma-blue to-plasma-violet blur-xl opacity-40 -z-10 animate-pulse-soft" />
    </motion.div>

    {/* Main card */}
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0, 1] }}
      className="relative w-full max-w-md sm:max-w-lg"
    >
      {/* Card glow */}
      <div className="absolute -inset-1 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-plasma-blue/20 via-transparent to-plasma-violet/20 blur-xl opacity-60" />
      
      {/* Glass card */}
      <div className="relative glass-panel rounded-3xl sm:rounded-4xl p-6 sm:p-8 lg:p-10">
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/60 via-transparent to-white/20 pointer-events-none" />
        
        {/* Header */}
        <div className="relative space-y-2 text-center mb-6 sm:mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-plasma-blue font-medium"
          >
            KPIs VisionOS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-vision-ink"
          >
            Bienvenido
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm sm:text-base text-soft-slate max-w-xs mx-auto"
          >
            Accede para continuar con la captura de indicadores
          </motion.p>
        </div>

        {/* Form content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          <Outlet />
        </motion.div>
      </div>
    </motion.div>

    {/* Footer */}
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-6 sm:mt-8 text-xs text-soft-slate/60 text-center"
    >
      © 2025 KPIs VisionOS. Todos los derechos reservados.
    </motion.p>
  </div>
)
