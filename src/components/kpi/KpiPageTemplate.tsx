/**
 * Template principal para páginas de KPI
 * Integra formularios de resumen, importadores de detalle y navegación por secciones
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Upload,
  Calendar,
  Database,
  BarChart3,
} from 'lucide-react'
import type { KpiDefinition, SectionDefinition, DetailLayoutDefinition } from '@/types/kpi-definitions'
import { KpiSummaryForm } from './KpiSummaryForm'
import { KpiDetailImporter } from './KpiDetailImporter'
import { KpiAnalysisPanel } from './KpiAnalysisPanel'
import { InnovacionAnalysisPanel } from './InnovacionAnalysisPanel'
import { RiskManagementAnalysisPanel } from './RiskManagementAnalysisPanel'
import { GovernanceAnalysisPanel } from './GovernanceAnalysisPanel'
import { RoeRoaAnalysisPanel } from './RoeRoaAnalysisPanel'
import { KpiHeaderNew } from './KpiHeaderNew'
import { GlassCard } from '@/components/base/GlassCard'
import { Button } from '@/components/base/Button'
import { cn } from '@/utils/ui'

interface KpiPageTemplateProps {
  config: KpiDefinition
}

type TabType = 'analysis' | 'summary' | 'detail'

export const KpiPageTemplate = ({ config }: KpiPageTemplateProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('analysis')
  const [activeSummaryIndex, setActiveSummaryIndex] = useState(0)
  const [activeDetailIndex, setActiveDetailIndex] = useState(0)
  const [selectedYear] = useState(new Date().getFullYear())
  const [selectedMonth] = useState(new Date().getMonth() + 1)

  const hasSummaries = config.summaries.length > 0
  const hasDetails = config.details.length > 0
  const hasMultipleSummaries = config.summaries.length > 1
  const hasMultipleDetails = config.details.length > 1

  const currentSummary = config.summaries[activeSummaryIndex]
  const currentDetail = config.details[activeDetailIndex]

  const renderSectionNav = (
    sections: SectionDefinition[] | DetailLayoutDefinition[],
    activeIndex: number,
    onChange: (index: number) => void,
    type: 'summary' | 'detail'
  ) => {
    if (sections.length <= 1) return null

    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => onChange(index)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap',
              'text-sm font-medium transition-all duration-200',
              index === activeIndex
                ? 'bg-white/70 text-vision-ink shadow-soft border border-white/60'
                : 'text-soft-slate hover:text-vision-ink hover:bg-white/40'
            )}
          >
            {type === 'summary' ? (
              <FileText className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            <span>{section.title}</span>
            {index === activeIndex && (
              <motion.div
                layoutId={`indicator-${type}`}
                className="w-1.5 h-1.5 rounded-full bg-plasma-blue"
              />
            )}
          </button>
        ))}
      </div>
    )
  }

  const renderTabNav = () => {
    // Show tab nav if there are summaries (even without details)
    if (!hasSummaries) return null

    return (
      <div className="flex items-center gap-1 p-1 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('analysis')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl min-w-max',
            'text-sm font-medium transition-all duration-200',
            activeTab === 'analysis'
              ? 'bg-gradient-to-r from-plasma-blue to-indigo-500 text-white shadow-lg shadow-plasma-blue/25'
              : 'text-soft-slate hover:text-vision-ink hover:bg-white/50'
          )}
        >
          <BarChart3 className="size-4" />
          <span className="hidden sm:inline">Análisis</span>
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl min-w-max',
            'text-sm font-medium transition-all duration-200',
            activeTab === 'summary'
              ? 'bg-white text-vision-ink shadow-soft'
              : 'text-soft-slate hover:text-vision-ink hover:bg-white/50'
          )}
        >
          <FileText className="size-4" />
          <span className="hidden sm:inline">Resumen</span>
          {hasMultipleSummaries && (
            <span className="px-1.5 py-0.5 text-xs rounded-md bg-plasma-blue/10 text-plasma-blue">
              {config.summaries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('detail')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl min-w-max',
            'text-sm font-medium transition-all duration-200',
            activeTab === 'detail'
              ? 'bg-white text-vision-ink shadow-soft'
              : 'text-soft-slate hover:text-vision-ink hover:bg-white/50'
          )}
        >
          <Upload className="size-4" />
          <span className="hidden sm:inline">Importar</span>
          {hasMultipleDetails && (
            <span className="px-1.5 py-0.5 text-xs rounded-md bg-plasma-blue/10 text-plasma-blue">
              {config.details.length}
            </span>
          )}
        </button>
      </div>
    )
  }

  const renderSummaryContent = () => {
    if (!hasSummaries) {
      return (
        <GlassCard>
          <div className="text-center py-8">
            <FileText className="size-12 mx-auto text-soft-slate/50 mb-3" />
            <p className="text-soft-slate">Este KPI no tiene formulario de resumen</p>
          </div>
        </GlassCard>
      )
    }

    return (
      <div className="space-y-4">
        {renderSectionNav(config.summaries, activeSummaryIndex, setActiveSummaryIndex, 'summary')}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSummary.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <KpiSummaryForm 
              section={currentSummary}
              filters={{ anio: selectedYear, mes: selectedMonth }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navegación entre secciones */}
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
            <div className="flex items-center gap-1.5">
              {config.summaries.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSummaryIndex(i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    i === activeSummaryIndex 
                      ? 'bg-plasma-blue w-4' 
                      : 'bg-soft-slate/30 hover:bg-soft-slate/50'
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSummaryIndex(Math.min(config.summaries.length - 1, activeSummaryIndex + 1))}
              disabled={activeSummaryIndex === config.summaries.length - 1}
            >
              Siguiente
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderDetailContent = () => {
    if (!hasDetails) {
      return (
        <GlassCard>
          <div className="text-center py-8">
            <Database className="size-12 mx-auto text-soft-slate/50 mb-3" />
            <p className="text-soft-slate">Este KPI no tiene importación de detalle</p>
          </div>
        </GlassCard>
      )
    }

    return (
      <div className="space-y-4">
        {renderSectionNav(config.details, activeDetailIndex, setActiveDetailIndex, 'detail')}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDetail.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <KpiDetailImporter 
              layout={currentDetail}
              onImportSuccess={(count) => {
                console.log(`Importados ${count} registros`)
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navegación entre detalles */}
        {hasMultipleDetails && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronLeft className="size-4" />}
              onClick={() => setActiveDetailIndex(Math.max(0, activeDetailIndex - 1))}
              disabled={activeDetailIndex === 0}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1.5">
              {config.details.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDetailIndex(i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    i === activeDetailIndex 
                      ? 'bg-plasma-blue w-4' 
                      : 'bg-soft-slate/30 hover:bg-soft-slate/50'
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveDetailIndex(Math.min(config.details.length - 1, activeDetailIndex + 1))}
              disabled={activeDetailIndex === config.details.length - 1}
            >
              Siguiente
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5 lg:space-y-6"
    >
      {/* Header del KPI */}
      <KpiHeaderNew config={config} status="in_progress" />

      {/* Barra de navegación con período */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Tabs de navegación - Ocupa todo el ancho en móvil */}
        <div className="flex-1 min-w-0">
          {renderTabNav()}
        </div>
        
        {/* Badge de período - Compacto y elegante */}
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 
                        bg-white/60 backdrop-blur-sm rounded-xl border border-white/50
                        shadow-soft flex-shrink-0">
          <Calendar className="size-4 text-plasma-blue" />
          <span className="text-sm font-medium text-vision-ink capitalize">
            {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('es-MX', { 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Contenido principal - Ancho completo */}
      <AnimatePresence mode="wait">
        {activeTab === 'analysis' ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Paneles de análisis especializados según el KPI */}
            {config.id === 'innovacion-incremental' ? (
              <InnovacionAnalysisPanel 
                config={config}
                filters={{ anio: selectedYear, mes: selectedMonth }}
              />
            ) : config.id === 'gestion-riesgos' ? (
              <RiskManagementAnalysisPanel 
                config={config}
                filters={{ anio: selectedYear, mes: selectedMonth }}
              />
            ) : config.id === 'gobierno-corporativo' ? (
              <GovernanceAnalysisPanel 
                config={config}
                filters={{ anio: selectedYear, mes: selectedMonth }}
              />
            ) : (config.id === 'roe-roa' || config.id === 'rentabilidad-operativa') ? (
              <RoeRoaAnalysisPanel 
                config={config}
                filters={{ anio: selectedYear, mes: selectedMonth }}
              />
            ) : (
              <KpiAnalysisPanel 
                config={config}
                filters={{ anio: selectedYear, mes: selectedMonth }}
              />
            )}
          </motion.div>
        ) : activeTab === 'summary' ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderSummaryContent()}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderDetailContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
