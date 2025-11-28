import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/utils/ui'

export type ButtonVariant = 'primary' | 'ghost' | 'glass'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  icon?: ReactNode
  glow?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', icon, glow, ...props }, ref) => {
    const base = {
      primary:
        'bg-plasma-blue text-white shadow-glow hover:shadow-float border border-white/40',
      ghost: 'bg-white/70 text-vision-ink border border-white/60 hover:bg-white/90',
      glass: 'bg-white/20 text-vision-ink border border-white/50 hover:bg-white/40',
    }[variant]

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ease-fluid-elastic backdrop-blur-xl',
          glow && 'drop-shadow-glow',
          base,
          className
        )}
        {...props}
      >
        {icon && <span className="size-4 text-current">{icon}</span>}
        <span>{children}</span>
      </button>
    )
  }
)

Button.displayName = 'Button'
