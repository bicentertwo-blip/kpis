/**
 * Formulario de resumen para KPIs
 * Componente reutilizable con validación y estilo Glass Design
 * MODO MANUAL: Botón para guardar e insertar en la base de datos
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Hash, DollarSign, Percent, Type, AlignLeft, ChevronDown, Check, Save, RotateCcw, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Target } from 'lucide-react'
import type { SectionDefinition, FieldDefinition } from '@/types/kpi-definitions'
import { useKpiSummaryForm } from '@/hooks/useKpiSummaryForm'
import { cn } from '@/utils/ui'

// Formatear número con separadores de miles
const formatWithThousands = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === '') return ''
  const numStr = String(value).replace(/[^0-9.-]/g, '')
  if (numStr === '' || numStr === '-') return numStr
  const num = parseFloat(numStr)
  if (isNaN(num)) return ''
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

interface KpiSummaryFormProps {
  section: SectionDefinition
  filters?: { anio?: number; mes?: number }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0, 1] as const },
  },
}

const fieldTypeConfig: Record<FieldDefinition['type'], { icon: React.ReactNode; prefix?: string }> = {
  currency: { icon: <DollarSign className="size-3.5" />, prefix: '$' },
  percentage: { icon: <Percent className="size-3.5" /> },
  number: { icon: <Hash className="size-3.5" /> },
  index: { icon: <Hash className="size-3.5" /> }, // Índices como NPS (-100 a 100)
  text: { icon: <Type className="size-3.5" /> },
  'long-text': { icon: <AlignLeft className="size-3.5" /> },
  select: { icon: <ChevronDown className="size-3.5" /> },
}

export const KpiSummaryForm = ({ section, filters }: KpiSummaryFormProps) => {
  const [showMetaAnualConfirmation, setShowMetaAnualConfirmation] = useState(false)
  
  // Obtener el tipo del campo meta_anual para formatear correctamente
  const metaAnualField = section.fields.find(f => f.id === 'meta_anual' || f.id.startsWith('meta_anual'))
  const metaAnualType = metaAnualField?.type || 'currency'
  
  // Función para formatear el valor de meta_anual según su tipo
  const formatMetaAnualValue = (value: unknown): string => {
    if (value === undefined || value === null || value === '') return '-'
    const numValue = Number(value)
    if (isNaN(numValue)) return String(value)
    
    switch (metaAnualType) {
      case 'percentage':
        return `${numValue.toFixed(2)}%`
      case 'index':
        return numValue.toFixed(1)
      case 'currency':
        return `$${numValue.toLocaleString()}`
      default:
        return numValue.toLocaleString()
    }
  }
  
  const {
    formValues,
    loading,
    saving,
    error,
    saveSuccess,
    updateField,
    isFieldValid,
    getFormProgress,
    saveAndClear,
    updateMetaAnualOnly,
    resetForm,
    canSave,
    canSaveMetaAnual,
    isDirty,
  } = useKpiSummaryForm(section, filters)

  const progress = getFormProgress()

  // Guardar datos mensuales normales (INSERT)
  const handleSave = async () => {
    await saveAndClear()
  }
  
  // Mostrar confirmación para actualizar solo Meta Anual
  const handleMetaAnualClick = () => {
    setShowMetaAnualConfirmation(true)
  }
  
  // Confirmar actualización de Meta Anual (UPDATE)
  const handleConfirmMetaAnual = async () => {
    setShowMetaAnualConfirmation(false)
    await updateMetaAnualOnly()
  }
  
  const handleCancelConfirmation = () => {
    setShowMetaAnualConfirmation(false)
  }

  const renderField = (field: FieldDefinition) => {
    const config = fieldTypeConfig[field.type]
    const isValid = isFieldValid(field)
    const value = formValues[field.id]
    const hasValue = value !== undefined && value !== null && value !== ''

    // Obtener el año actual del formulario para labels dinámicos
    const currentYear = formValues['anio'] || new Date().getFullYear()
    
    // Label dinámico para meta_anual
    const fieldLabel = field.id === 'meta_anual' || field.id.startsWith('meta_anual')
      ? `${field.label} (${currentYear})`
      : field.label

    // Campo especial para mes (selector)
    if (field.id === 'mes' || field.type === 'select') {
      return (
        <motion.div
          key={field.id}
          variants={fieldVariants}
          className={cn(
            'group relative rounded-2xl lg:rounded-3xl',
            'bg-white/50 backdrop-blur-xl',
            'border transition-all duration-300',
            isValid ? 'border-white/60 hover:border-white/80' : 'border-red-200/60',
            'shadow-soft hover:shadow-glass',
            'p-4 sm:p-5'
          )}
        >
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {hasValue && isValid && (
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="size-3 text-emerald-600" />
              </div>
            )}
            <div className="w-7 h-7 rounded-lg bg-plasma-blue/5 flex items-center justify-center text-plasma-blue/60">
              {config.icon}
            </div>
          </div>

          <div className="mb-3 pr-16">
            <label className="text-sm font-medium text-vision-ink">
              {fieldLabel}
              {field.required && <span className="text-plasma-blue ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-soft-slate mt-0.5">{field.description}</p>
            )}
          </div>

          <div className="relative">
            <select
              className={cn(
                'w-full appearance-none rounded-xl lg:rounded-2xl',
                'border border-white/60 bg-white/60',
                'px-4 py-3 pr-10 text-sm text-vision-ink',
                'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
                'focus:outline-none transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              value={(value as string) ?? ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              disabled={loading}
            >
              <option value="">Seleccionar...</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft-slate pointer-events-none" />
          </div>
        </motion.div>
      )
    }

    // Campo de texto largo
    if (field.type === 'long-text') {
      return (
        <motion.div
          key={field.id}
          variants={fieldVariants}
          className={cn(
            'group relative rounded-2xl lg:rounded-3xl sm:col-span-2',
            'bg-white/50 backdrop-blur-xl',
            'border transition-all duration-300',
            isValid ? 'border-white/60 hover:border-white/80' : 'border-red-200/60',
            'shadow-soft hover:shadow-glass',
            'p-4 sm:p-5'
          )}
        >
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {hasValue && isValid && (
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="size-3 text-emerald-600" />
              </div>
            )}
            <div className="w-7 h-7 rounded-lg bg-plasma-blue/5 flex items-center justify-center text-plasma-blue/60">
              {config.icon}
            </div>
          </div>

          <div className="mb-3 pr-16">
            <label className="text-sm font-medium text-vision-ink">
              {fieldLabel}
              {field.required && <span className="text-plasma-blue ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-soft-slate mt-0.5">{field.description}</p>
            )}
          </div>

          <textarea
            rows={3}
            className={cn(
              'w-full resize-none rounded-xl lg:rounded-2xl',
              'border border-white/60 bg-white/60',
              'px-4 py-3 text-sm text-vision-ink',
              'placeholder:text-soft-slate/50',
              'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
              'focus:outline-none transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={field.placeholder}
            value={(value as string) ?? ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            disabled={loading}
          />
        </motion.div>
      )
    }

    // Campos numéricos y de texto normal
    return (
      <motion.div
        key={field.id}
        variants={fieldVariants}
        className={cn(
          'group relative rounded-2xl lg:rounded-3xl',
          'bg-white/50 backdrop-blur-xl',
          'border transition-all duration-300',
          isValid ? 'border-white/60 hover:border-white/80' : 'border-red-200/60',
          'shadow-soft hover:shadow-glass',
          'p-4 sm:p-5'
        )}
      >
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {hasValue && isValid && (
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="size-3 text-emerald-600" />
            </div>
          )}
          <div className="w-7 h-7 rounded-lg bg-plasma-blue/5 flex items-center justify-center text-plasma-blue/60">
            {config.icon}
          </div>
        </div>

        <div className="mb-3 pr-16">
          <label className="text-sm font-medium text-vision-ink">
            {fieldLabel}
            {field.required && <span className="text-plasma-blue ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-xs text-soft-slate mt-0.5">{field.description}</p>
          )}
        </div>

        <div className="relative">
          {field.type === 'currency' && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate text-sm font-medium">
              $
            </span>
          )}
          <FormattedInput
            field={field}
            value={value}
            onChange={(newValue) => updateField(field.id, newValue)}
            disabled={loading}
          />
          {field.type === 'percentage' && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-soft-slate text-sm font-medium">
              %
            </span>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header del formulario */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-vision-ink">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-soft-slate mt-0.5">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de progreso */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white/40">
            <div className="w-16 h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-plasma-blue to-plasma-indigo rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium text-soft-slate">
              {progress.filled}/{progress.total}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de campos */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:gap-4 sm:grid-cols-2"
      >
        {section.fields.map(renderField)}
      </motion.div>

      {/* Botones de acción */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
      >
        {/* Mensaje de estado */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            <span className="text-sm font-medium">¡Guardado exitosamente!</span>
          </motion.div>
        )}

        <div className="flex-1" />

        {/* Botón Limpiar */}
        <button
          type="button"
          onClick={resetForm}
          disabled={!isDirty || saving}
          className={cn(
            'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl',
            'border border-gray-200 bg-white/60 backdrop-blur-sm',
            'text-sm font-medium text-gray-600',
            'hover:bg-gray-50 hover:border-gray-300',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
        >
          <RotateCcw className="size-4" />
          <span>Limpiar</span>
        </button>

        {/* Botón Actualizar Meta Anual - Solo visible si tiene año y meta_anual */}
        {canSaveMetaAnual && !canSave && (
          <button
            type="button"
            onClick={handleMetaAnualClick}
            disabled={saving}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl',
              'bg-gradient-to-r from-amber-500 to-orange-500',
              'text-sm font-medium text-white',
              'hover:shadow-lg hover:scale-[1.02]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <Target className="size-4" />
                <span>Actualizar Meta Anual</span>
              </>
            )}
          </button>
        )}

        {/* Botón Guardar - Requiere todos los campos obligatorios */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className={cn(
            'flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl',
            'bg-gradient-to-r from-plasma-blue to-plasma-indigo',
            'text-sm font-medium text-white',
            'hover:shadow-glow hover:scale-[1.02]',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none',
            'transition-all duration-200'
          )}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="size-4" />
              <span>Guardar</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Modal de Confirmación para Meta Anual */}
      {showMetaAnualConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={handleCancelConfirmation}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md mx-4 p-6 bg-white/95 backdrop-blur-xl rounded-3xl shadow-glass border border-white/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícono de advertencia */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="size-7 text-amber-600" />
              </div>
            </div>

            {/* Título y mensaje */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-vision-ink mb-2">
                Actualizar Meta Anual
              </h3>
              <p className="text-sm text-soft-slate leading-relaxed">
                Se actualizará la <span className="font-medium text-plasma-blue">Meta Anual</span> en todos los registros del año <span className="font-medium text-plasma-blue">{String(formValues['anio'] || new Date().getFullYear())}</span>. 
                Los demás datos mensuales <span className="font-medium text-emerald-600">NO serán modificados</span>.
              </p>
            </div>

            {/* Resumen de lo que se guardará */}
            <div className="bg-amber-50/60 rounded-2xl p-4 mb-6 border border-amber-100">
              <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2">
                Se actualizará:
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">Meta Anual ({String(formValues['anio'] || new Date().getFullYear())})</span>
                <span className="text-sm font-semibold text-amber-900">
                  {formatMetaAnualValue(formValues['meta_anual'])}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
                  'border border-gray-200 bg-white/60',
                  'text-sm font-medium text-gray-600',
                  'hover:bg-gray-50 hover:border-gray-300',
                  'transition-all duration-200'
                )}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMetaAnual}
                disabled={saving}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
                  'bg-gradient-to-r from-amber-500 to-orange-500',
                  'text-sm font-medium text-white',
                  'hover:shadow-lg hover:scale-[1.02]',
                  'disabled:opacity-50',
                  'transition-all duration-200'
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    <span>Sí, Actualizar</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// Componente de input formateado para montos y números
interface FormattedInputProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: string) => void
  disabled?: boolean
}

const FormattedInput = ({ field, value, onChange, disabled }: FormattedInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  
  // Para campos de texto simple o el campo año, no formatear
  if (field.type === 'text' || field.id === 'anio') {
    return (
      <input
        type={field.id === 'anio' ? 'number' : 'text'}
        min={field.min}
        max={field.max}
        className={cn(
          'w-full rounded-xl lg:rounded-2xl',
          'border border-white/60 bg-white/60',
          'py-3 text-sm text-vision-ink',
          'px-4',
          'placeholder:text-soft-slate/50',
          'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
          'focus:outline-none transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        placeholder={field.placeholder}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    )
  }
  
  // Valor formateado para mostrar
  const displayValue = useCallback(() => {
    if (isFocused) {
      // Mientras edita, mostrar el valor sin formato
      return value === undefined || value === null || value === '' ? '' : String(value)
    }
    // Cuando no está enfocado, mostrar formateado
    if (value === undefined || value === null || value === '') return ''
    // Para índices (como NPS), no aplicar formato de miles
    if (field.type === 'index') return String(value)
    return formatWithThousands(value as string | number)
  }, [value, isFocused, field.type])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Permitir solo números, punto decimal y signo negativo
    const cleaned = input.replace(/[^0-9.-]/g, '')
    // Evitar múltiples puntos
    const parts = cleaned.split('.')
    let sanitized = parts[0]
    if (parts.length > 1) {
      sanitized += '.' + parts.slice(1).join('')
    }
    onChange(sanitized)
  }

  // Determinar padding según tipo de campo
  const getPadding = () => {
    if (field.type === 'currency') return 'pl-8 pr-4'
    if (field.type === 'percentage') return 'pl-4 pr-8'
    return 'px-4' // index, number, etc.
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={cn(
        'w-full rounded-xl lg:rounded-2xl',
        'border border-white/60 bg-white/60',
        'py-3 text-sm text-vision-ink',
        getPadding(),
        'placeholder:text-soft-slate/50',
        'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
        'focus:outline-none transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'tabular-nums'
      )}
      placeholder={field.placeholder}
      value={displayValue()}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
    />
  )
}
