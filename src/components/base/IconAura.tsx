import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/ui'

interface IconAuraProps {
  icon: LucideIcon
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: 'p-2 text-sm',
  md: 'p-3 text-base',
  lg: 'p-4 text-lg',
}

export const IconAura = ({ icon: Icon, className, size = 'md' }: IconAuraProps) => (
  <motion.span
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className={cn(
      'inline-flex items-center justify-center rounded-2xl bg-white/60 text-plasma-blue shadow-inner shadow-white/50 backdrop-blur-xl',
      SIZE_MAP[size],
      className
    )}
  >
    <Icon className="size-4" />
  </motion.span>
)
