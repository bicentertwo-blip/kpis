import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const visionSurface = 'bg-glass-light/80 backdrop-blur-3xl border border-white/60 shadow-glass'

export const glassHover = 'transition-all duration-500 ease-fluid-elastic hover:-translate-y-0.5 hover:shadow-float'
