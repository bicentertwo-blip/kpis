import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/ui'

interface GlassCardProps<T extends ElementType = 'div'> {
  as?: T
  className?: string
  children: ReactNode
  glow?: boolean
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  delay?: number
}

type Props<T extends ElementType> = GlassCardProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof GlassCardProps>

const paddings = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5 lg:p-6',
  lg: 'p-5 sm:p-6 lg:p-8',
  xl: 'p-6 sm:p-8 lg:p-10',
}

const blurs = {
  sm: 'backdrop-blur-lg',
  md: 'backdrop-blur-xl',
  lg: 'backdrop-blur-2xl',
  xl: 'backdrop-blur-3xl',
}

export const GlassCard = <T extends ElementType = 'div'>({
  as,
  className,
  children,
  glow,
  hover,
  padding = 'md',
  blur = 'lg',
  animate = true,
  delay = 0,
  ...props
}: Props<T>) => {
  const Component = (as ?? 'div') as ElementType

  const content = (
    <Component
      className={cn(
        'glass-panel relative overflow-hidden',
        paddings[padding],
        blurs[blur],
        hover && 'glass-panel-hover cursor-pointer',
        glow && 'shadow-glow',
        className
      )}
      {...props}
    >
      {/* Inner glow effect */}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/50 via-transparent to-white/10" />
      {/* Subtle border highlight */}
      <span className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-b from-white/80 to-transparent opacity-60" style={{ maskImage: 'linear-gradient(to bottom, black, transparent 50%)' }} />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  )

  if (!animate) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0, 1] }}
    >
      {content}
    </motion.div>
  )
}
