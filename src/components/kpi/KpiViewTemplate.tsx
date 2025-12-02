import { motion } from 'framer-motion'
import type { KpiViewId } from '@/types/kpi'
import { useKpiData } from '@/hooks/useKpiData'
import { KpiHeader } from './KpiHeader'
import { DynamicForm } from '@/components/forms/DynamicForm'
import { ImportExportPanel } from '@/components/forms/ImportExportPanel'
import { AutosaveIndicator } from '@/components/forms/AutosaveIndicator'
import { GlassCard } from '@/components/base/GlassCard'
import { FileText, Lightbulb } from 'lucide-react'

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
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5 lg:space-y-6"
    >
      <KpiHeader definition={viewMeta} status={status} />
      
      <div className="grid gap-4 sm:gap-5 lg:gap-6 xl:grid-cols-[1fr,380px] 2xl:grid-cols-[1fr,420px]">
        {/* Main form area */}
        <div className="space-y-4 sm:space-y-5">
          <DynamicForm fields={viewMeta.fields} values={formValues} onChange={updateField} disabled={loading} />
          <AutosaveIndicator saving={saving} lastSavedAt={lastSavedAt} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-5">
          <ImportExportPanel onImport={handleImport} onExportTemplate={exportTemplate} disabled={loading} />
          
          <GlassCard delay={0.1}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-plasma-blue/10 text-plasma-blue flex-shrink-0">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-vision-ink">Estado de captura</p>
                <p className="text-xs text-soft-slate mt-1 leading-relaxed">
                  Se guarda automáticamente cada ajuste. Puedes importar un Excel o continuar manualmente.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.15}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex-shrink-0">
                <Lightbulb className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-vision-ink">Tip rápido</p>
                <p className="text-xs text-soft-slate mt-1 leading-relaxed">
                  Completa todos los campos requeridos para marcar este KPI como completado. Los campos con <span className="text-plasma-blue">*</span> son obligatorios.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.section>
  )
}
