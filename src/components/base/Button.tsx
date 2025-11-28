import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/ui'

export type ButtonVariant = 'primary' | 'ghost' | 'glass' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  glow?: boolean
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', icon, iconRight, glow, loading, fullWidth, disabled, ...props }, ref) => {
    const variants = {
      primary: cn(
        'bg-gradient-to-r from-plasma-blue to-plasma-indigo text-white',
        'shadow-glow-sm hover:shadow-glow',
        'border border-white/20',
        'hover:from-plasma-indigo hover:to-plasma-blue'
      ),
      ghost: cn(
        'bg-white/60 text-vision-ink',
        'border border-white/60 hover:border-white/80',
        'hover:bg-white/80 hover:shadow-soft'
      ),
      glass: cn(
        'bg-white/40 text-vision-ink backdrop-blur-xl',
        'border border-white/50 hover:border-white/70',
        'hover:bg-white/60 shadow-soft'
      ),
      outline: cn(
        'bg-transparent text-plasma-blue',
        'border-2 border-plasma-blue/30 hover:border-plasma-blue/60',
        'hover:bg-plasma-blue/5'
      ),
    }

    const sizes = {
      sm: 'px-4 py-2 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    }

    const iconSizes = {
      sm: 'size-3.5',
      md: 'size-4',
      lg: 'size-5',
    }

    return (
      <motion.div
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(fullWidth ? 'w-full' : 'inline-block')}
      >
        <button
          ref={ref}
          className={cn(
            'relative inline-flex items-center justify-center w-full',
            'rounded-full font-medium',
            'transition-all duration-300 ease-smooth',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:ring-2 focus-visible:ring-plasma-blue/40 focus-visible:ring-offset-2',
            variants[variant],
            sizes[size],
            glow && 'drop-shadow-glow',
            className
          )}
          disabled={disabled || loading}
          {...props}
        >
          {loading ? (
            <span className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', iconSizes[size])} />
          ) : icon ? (
            <span className={cn(iconSizes[size], 'flex-shrink-0')}>{icon}</span>
          ) : null}
          <span className={cn(loading && 'opacity-0')}>{children}</span>
          {iconRight && !loading && (
            <span className={cn(iconSizes[size], 'flex-shrink-0')}>{iconRight}</span>
          )}
          {/* Shine effect */}
          {variant === 'primary' && (
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          )}
        </button>
      </motion.div>
    )
  }
)

Button.displayName = 'Button'
