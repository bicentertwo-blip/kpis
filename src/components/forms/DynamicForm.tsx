import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import type { KpiField } from '@/types/kpi'
import { cn } from '@/utils/ui'

interface DynamicFormProps {
  fields: KpiField[]
  values: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
  disabled?: boolean
}

// Formatear número con separadores de miles
const formatWithThousands = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === '') return ''
  const numStr = String(value).replace(/[^0-9.-]/g, '')
  if (numStr === '' || numStr === '-') return numStr
  const num = parseFloat(numStr)
  if (isNaN(num)) return ''
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const fieldVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0, 1] as const }
  },
}

const fieldTypeConfig: Record<KpiField['type'], { icon: string; prefix?: string }> = {
  currency: { icon: '$', prefix: '$' },
  percentage: { icon: '%' },
  number: { icon: '#' },
  text: { icon: 'Aa' },
  'long-text': { icon: '¶' },
}

export const DynamicForm = ({ fields, values, onChange, disabled }: DynamicFormProps) => {
  const renderField = (field: KpiField) => {
    const config = fieldTypeConfig[field.type]
    
    return (
      <motion.div
        key={field.id}
        variants={fieldVariants}
        className={cn(
          'group relative rounded-2xl lg:rounded-3xl',
          'bg-white/50 backdrop-blur-xl',
          'border border-white/60 hover:border-white/80',
          'shadow-soft hover:shadow-glass',
          'transition-all duration-300',
          'p-4 sm:p-5 lg:p-6',
          field.type === 'long-text' && 'sm:col-span-2'
        )}
      >
        {/* Field type indicator */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-lg bg-plasma-blue/5 flex items-center justify-center text-xs font-mono text-plasma-blue/60">
          {config.icon}
        </div>

        <div className="mb-3 sm:mb-4 pr-10">
          <label className="text-sm sm:text-base font-medium text-vision-ink">
            {field.label}
            {field.required && <span className="text-plasma-blue ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-xs sm:text-sm text-soft-slate mt-0.5">{field.description}</p>
          )}
        </div>

        {field.type === 'long-text' ? (
          <textarea
            rows={4}
            className={cn(
              'w-full resize-none rounded-xl lg:rounded-2xl',
              'border border-white/60 bg-white/60',
              'px-4 py-3 text-sm sm:text-base text-vision-ink',
              'placeholder:text-soft-slate/50',
              'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
              'focus:outline-none transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={field.placeholder}
            value={(values[field.id] as string) ?? ''}
            onChange={(event) => onChange(field.id, event.target.value)}
            disabled={disabled}
          />
        ) : field.type === 'currency' || field.type === 'percentage' || field.type === 'number' ? (
          <FormattedNumberInput
            field={field}
            value={values[field.id]}
            onChange={onChange}
            disabled={disabled}
          />
        ) : (
          <div className="relative">
            <input
              type="text"
              className={cn(
                'w-full rounded-xl lg:rounded-2xl',
                'border border-white/60 bg-white/60',
                'py-3 text-sm sm:text-base text-vision-ink',
                'px-4',
                'placeholder:text-soft-slate/50',
                'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
                'focus:outline-none transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              placeholder={field.placeholder}
              value={(values[field.id] as string | number | undefined) ?? ''}
              onChange={(event) => onChange(field.id, event.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2"
    >
      {fields.map(renderField)}
    </motion.div>
  )
}

// Componente para inputs numéricos con formato
interface FormattedNumberInputProps {
  field: KpiField
  value: unknown
  onChange: (fieldId: string, value: unknown) => void
  disabled?: boolean
}

const FormattedNumberInput = ({ field, value, onChange, disabled }: FormattedNumberInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  
  // Valor formateado para mostrar
  const displayValue = useCallback(() => {
    if (isFocused) {
      // Mientras edita, mostrar el valor sin formato para facilitar escritura
      return value === undefined || value === null || value === '' ? '' : String(value)
    }
    // Cuando no está enfocado, mostrar formateado
    if (value === undefined || value === null || value === '') return ''
    return formatWithThousands(value as string | number)
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Permitir solo números, punto decimal y signo negativo
    const cleaned = input.replace(/[^0-9.-]/g, '')
    // Evitar múltiples puntos o signos negativos
    const parts = cleaned.split('.')
    let sanitized = parts[0]
    if (parts.length > 1) {
      sanitized += '.' + parts.slice(1).join('')
    }
    onChange(field.id, sanitized)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  return (
    <div className="relative">
      {field.type === 'currency' && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate text-sm font-medium">
          $
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          'w-full rounded-xl lg:rounded-2xl',
          'border border-white/60 bg-white/60',
          'py-3 text-sm sm:text-base text-vision-ink',
          field.type === 'currency' ? 'pl-8 pr-4' : field.type === 'percentage' ? 'pl-4 pr-8' : 'px-4',
          'placeholder:text-soft-slate/50',
          'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
          'focus:outline-none transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'tabular-nums'
        )}
        placeholder={field.placeholder}
        value={displayValue()}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
      />
      {field.type === 'percentage' && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-soft-slate text-sm font-medium">
          %
        </span>
      )}
    </div>
  )
}
