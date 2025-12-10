import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { CUMPLIMIENTO_CONFIG } from '@/config/kpi-configs'
import { KpiSummaryForm } from '@/components/kpi/KpiSummaryForm'
import { RegulatoryComplianceAnalysisPanel } from '@/components/kpi/RegulatoryComplianceAnalysisPanel'
import { Button } from '@/components/base/Button'

const CumplimientoRegulatorioPage = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  const [filters] = useState({
    anio: currentYear,
    mes: currentMonth
  })

  const [activeTab, setActiveTab] = useState<'analisis' | 'resumen'>('analisis')
  const [activeSummaryIndex, setActiveSummaryIndex] = useState(0)
  
  const summaries = CUMPLIMIENTO_CONFIG.summaries
  const hasMultipleSummaries = summaries.length > 1
  const currentSummary = summaries[activeSummaryIndex]

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg shadow-teal-500/25">
            <Shield className="text-white" size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-vision-ink">
                {CUMPLIMIENTO_CONFIG.name}
              </h1>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                VISTA KPI
              </span>
            </div>
            <p className="text-soft-slate text-sm md:text-base">
              {CUMPLIMIENTO_CONFIG.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('analisis')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'analisis'
              ? 'bg-plasma-blue text-white shadow-lg shadow-plasma-blue/30'
              : 'bg-white/60 text-soft-slate hover:bg-white hover:text-vision-ink'
          }`}
        >
          <Shield size={16} />
          <span>Análisis</span>
        </button>
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'resumen'
              ? 'bg-plasma-blue text-white shadow-lg shadow-plasma-blue/30'
              : 'bg-white/60 text-soft-slate hover:bg-white hover:text-vision-ink'
          }`}
        >
          <span>Resumen</span>
          <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{summaries.length}</span>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'analisis' && (
          <motion.div
            key="analisis"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <RegulatoryComplianceAnalysisPanel config={CUMPLIMIENTO_CONFIG} filters={filters} />
          </motion.div>
        )}

        {activeTab === 'resumen' && (
          <motion.div
            key="resumen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Navegación entre secciones de resumen */}
            {hasMultipleSummaries && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {summaries.map((summary, index) => (
                  <button
                    key={summary.id}
                    onClick={() => setActiveSummaryIndex(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap border ${
                      activeSummaryIndex === index
                        ? 'bg-white text-vision-ink border-plasma-blue/30 shadow-md'
                        : 'bg-white/40 text-soft-slate border-transparent hover:bg-white/60'
                    }`}
                  >
                    <span>{summary.title}</span>
                    {activeSummaryIndex === index && (
                      <span className="w-1.5 h-1.5 rounded-full bg-plasma-blue" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Formulario del resumen actual */}
            <KpiSummaryForm section={currentSummary} />

            {/* Navegación con flechas */}
            {hasMultipleSummaries && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ChevronLeft className="size-4" />}
                  onClick={() => setActiveSummaryIndex(Math.max(0, activeSummaryIndex - 1))}
                  disabled={activeSummaryIndex === 0}
                >
                  Anterior
                </Button>
                <span className="text-sm text-soft-slate">
                  {activeSummaryIndex + 1} de {summaries.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={<ChevronRight className="size-4" />}
                  onClick={() => setActiveSummaryIndex(Math.min(summaries.length - 1, activeSummaryIndex + 1))}
                  disabled={activeSummaryIndex === summaries.length - 1}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CumplimientoRegulatorioPage
