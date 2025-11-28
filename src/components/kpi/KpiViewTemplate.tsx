import { motion } from 'framer-motion'
import type { KpiViewId } from '@/types/kpi'
import { useKpiData } from '@/hooks/useKpiData'
import { KpiHeader } from './KpiHeader'
import { DynamicForm } from '@/components/forms/DynamicForm'
import { ImportExportPanel } from '@/components/forms/ImportExportPanel'
import { AutosaveIndicator } from '@/components/forms/AutosaveIndicator'
import { GlassCard } from '@/components/base/GlassCard'

interface KpiViewTemplateProps {
  viewId: KpiViewId
}

export const KpiViewTemplate = ({ viewId }: KpiViewTemplateProps) => {
  const { viewMeta, formValues, status, loading, saving, lastSavedAt, updateField, replaceForm, exportTemplate } = useKpiData(viewId)

  const handleImport = async (rows: Record<string, string>[]) => {
    if (!rows.length) return
    const row = rows[0]
    const sanitized = viewMeta.fields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field.id] = row[field.id] ?? ''
      return acc
    }, {})
    replaceForm(sanitized)
  }

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-6">
      <KpiHeader definition={viewMeta} status={status} />
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <DynamicForm fields={viewMeta.fields} values={formValues} onChange={updateField} disabled={loading} />
          <AutosaveIndicator saving={saving} lastSavedAt={lastSavedAt} />
        </div>
        <div className="space-y-4">
          <ImportExportPanel onImport={handleImport} onExportTemplate={exportTemplate} disabled={loading} />
          <GlassCard>
            <p className="text-sm font-semibold text-vision-ink">Estado de captura</p>
            <p className="text-xs text-soft-slate">Se guarda automáticamente cada ajuste. Puedes importar un CSV o continuar manualmente.</p>
          </GlassCard>
        </div>
      </div>
    </motion.section>
  )
}
