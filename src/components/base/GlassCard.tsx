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

// Optimized animation variants for iOS
const animationVariants = {
  hidden: { 
    opacity: 0, 
    y: 16,
    // Use transform3d for iOS GPU acceleration
    transform: 'translate3d(0, 16px, 0)',
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transform: 'translate3d(0, 0, 0)',
  },
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
      style={{
        // Force GPU layer for better iOS performance
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
      }}
      {...props}
    >
      {/* Inner glow effect - simplified for iOS */}
      <span 
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/50 via-transparent to-white/10" 
        aria-hidden="true"
      />
      {/* Subtle border highlight - simplified mask for iOS */}
      <span 
        className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-b from-white/60 to-transparent opacity-50" 
        aria-hidden="true"
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  )

  if (!animate) return content

  return (
    <motion.div
      variants={animationVariants}
      initial="hidden"
      animate="visible"
      transition={{ 
        duration: 0.4, 
        delay, 
        ease: [0.25, 0.1, 0.25, 1], // Smoother easing for iOS
      }}
      style={{
        // Prevent flickering on iOS
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        perspective: 1000,
      }}
    >
      {content}
    </motion.div>
  )
}
