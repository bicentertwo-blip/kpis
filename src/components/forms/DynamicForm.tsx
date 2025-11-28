import { motion } from 'framer-motion'
import type { KpiField } from '@/types/kpi'

interface DynamicFormProps {
  fields: KpiField[]
  values: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
  disabled?: boolean
}

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({ opacity: 1, y: 0, transition: { delay: index * 0.04, duration: 0.4 } }),
}

export const DynamicForm = ({ fields, values, onChange, disabled }: DynamicFormProps) => {
  const renderField = (field: KpiField, index: number) => (
    <motion.label
      key={field.id}
      custom={index}
      variants={fieldVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur-xl"
    >
      <div>
        <p className="text-sm font-medium text-vision-ink">{field.label}</p>
        {field.description && <p className="text-xs text-soft-slate">{field.description}</p>}
      </div>
      {field.type === 'long-text' ? (
        <textarea
          rows={4}
          className="w-full resize-none rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-vision-ink focus:border-plasma-blue/40 focus:outline-none"
          placeholder={field.placeholder}
          value={(values[field.id] as string) ?? ''}
          onChange={(event) => onChange(field.id, event.target.value)}
          disabled={disabled}
        />
      ) : (
        <input
          type={field.type === 'text' ? 'text' : 'number'}
          step={field.type === 'percentage' ? 0.1 : 0.01}
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-vision-ink focus:border-plasma-blue/40 focus:outline-none"
          placeholder={field.placeholder}
          value={(values[field.id] as string | number | undefined) ?? ''}
          onChange={(event) => onChange(field.id, event.target.value)}
          disabled={disabled}
        />
      )}
    </motion.label>
  )

  return <div className="grid gap-4 md:grid-cols-2">{fields.map(renderField)}</div>
}
