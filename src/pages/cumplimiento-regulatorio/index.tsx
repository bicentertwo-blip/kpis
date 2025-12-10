import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { CUMPLIMIENTO_CONFIG } from '@/config/kpi-configs'
import { KpiSummarySection } from '@/components/kpi/KpiSummarySection'
import { RegulatoryComplianceAnalysisPanel } from '@/components/kpi/RegulatoryComplianceAnalysisPanel'
import { KpiDetailImporter } from '@/components/kpi/KpiDetailImporter'

const CumplimientoRegulatorioPage = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  const [filters] = useState({
    anio: currentYear,
    mes: currentMonth
  })

  const [activeTab, setActiveTab] = useState<'analisis' | 'resumen' | 'importar'>('analisis')

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
          <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">2</span>
        </button>
        <button
          onClick={() => setActiveTab('importar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'importar'
              ? 'bg-plasma-blue text-white shadow-lg shadow-plasma-blue/30'
              : 'bg-white/60 text-soft-slate hover:bg-white hover:text-vision-ink'
          }`}
        >
          <span>Importar</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'analisis' && (
        <RegulatoryComplianceAnalysisPanel config={CUMPLIMIENTO_CONFIG} filters={filters} />
      )}

      {activeTab === 'resumen' && (
        <KpiSummarySection config={CUMPLIMIENTO_CONFIG} />
      )}

      {activeTab === 'importar' && (
        <KpiDetailImporter config={CUMPLIMIENTO_CONFIG} />
      )}
    </div>
  )
}

export default CumplimientoRegulatorioPage
