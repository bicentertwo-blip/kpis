/**
 * Formulario de resumen para KPIs
 * Componente reutilizable con validación y estilo VisionOS
 * MODO MANUAL: Botón para guardar e insertar en la base de datos
 */

import { motion } from 'framer-motion'
import { Hash, DollarSign, Percent, Type, AlignLeft, ChevronDown, Check, Save, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { SectionDefinition, FieldDefinition } from '@/types/kpi-definitions'
import { useKpiSummaryForm } from '@/hooks/useKpiSummaryForm'
import { cn } from '@/utils/ui'

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
  text: { icon: <Type className="size-3.5" /> },
  'long-text': { icon: <AlignLeft className="size-3.5" /> },
  select: { icon: <ChevronDown className="size-3.5" /> },
}

export const KpiSummaryForm = ({ section, filters }: KpiSummaryFormProps) => {
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
    resetForm,
    canSave,
    isDirty,
  } = useKpiSummaryForm(section, filters)

  const progress = getFormProgress()

  const handleSave = async () => {
    await saveAndClear()
  }

  const renderField = (field: FieldDefinition) => {
    const config = fieldTypeConfig[field.type]
    const isValid = isFieldValid(field)
    const value = formValues[field.id]
    const hasValue = value !== undefined && value !== null && value !== ''

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
              {field.label}
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
              {field.label}
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
            {field.label}
            {field.required && <span className="text-plasma-blue ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-xs text-soft-slate mt-0.5">{field.description}</p>
          )}
        </div>

        <div className="relative">
          {config.prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate text-sm">
              {config.prefix}
            </span>
          )}
          <input
            type={field.type === 'text' ? 'text' : 'number'}
            step={field.type === 'percentage' ? 0.1 : field.type === 'currency' ? 0.01 : 1}
            min={field.min}
            max={field.max}
            className={cn(
              'w-full rounded-xl lg:rounded-2xl',
              'border border-white/60 bg-white/60',
              'py-3 text-sm text-vision-ink',
              config.prefix ? 'pl-8 pr-4' : 'px-4',
              'placeholder:text-soft-slate/50',
              'focus:border-plasma-blue/40 focus:bg-white/80 focus:shadow-glow-sm',
              'focus:outline-none transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={field.placeholder}
            value={(value as string | number | undefined) ?? ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            disabled={loading}
          />
          {field.type === 'percentage' && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-soft-slate text-sm">
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

        {/* Botón Guardar */}
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
    </div>
  )
}
