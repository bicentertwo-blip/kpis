import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { cn } from '@/utils/ui'

interface GlassCardProps<T extends ElementType = 'div'> {
  as?: T
  className?: string
  children: ReactNode
  glow?: boolean
}

type Props<T extends ElementType> = GlassCardProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof GlassCardProps>

export const GlassCard = <T extends ElementType = 'div'>({ as, className, children, glow, ...props }: Props<T>) => {
  const Component = (as ?? 'div') as ElementType
  return (
    <Component
      className={cn('glass-panel relative overflow-hidden rounded-3xl p-6', glow && 'drop-shadow-glow', className)}
      {...props}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
    </Component>
  )
}
