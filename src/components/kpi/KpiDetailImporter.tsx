/**
 * Panel de importación de CSV para detalles de KPIs
 * Incluye validación, preview y progreso de importación
 */

import { useRef, useState, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  FileText,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Button } from '@/components/base/Button'
import type { DetailLayoutDefinition } from '@/types/kpi-definitions'
import { useKpiImporter } from '@/hooks/useKpiImporter'
import { useKpiExporter } from '@/hooks/useKpiExporter'
import { cn } from '@/utils/ui'

interface KpiDetailImporterProps {
  layout: DetailLayoutDefinition
  onImportSuccess?: (count: number) => void
  disabled?: boolean
}

export const KpiDetailImporter = ({ layout, onImportSuccess, disabled }: KpiDetailImporterProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  
  const { 
    importing, 
    progress, 
    validationResult, 
    validateFile, 
    importFile, 
    reset 
  } = useKpiImporter()
  
  const { exportEmptyLayout, exportWithSampleData } = useKpiExporter()

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    setImportResult(null)
    reset()
    
    // Validar automáticamente
    await validateFile(file, layout)
    setShowPreview(true)
    
    // Limpiar input para permitir seleccionar el mismo archivo
    event.target.value = ''
  }

  const handleImport = async () => {
    if (!selectedFile) return
    
    const result = await importFile(selectedFile, layout)
    setImportResult(result)
    
    if (result.success) {
      onImportSuccess?.(progress?.success ?? 0)
      // Limpiar después de éxito
      setTimeout(() => {
        setSelectedFile(null)
        setShowPreview(false)
        reset()
      }, 3000)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setShowPreview(false)
    setImportResult(null)
    reset()
  }

  const handleExportEmpty = () => {
    exportEmptyLayout(layout)
  }

  const handleExportSample = () => {
    exportWithSampleData(layout, 5)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-plasma-blue/20 to-plasma-indigo/20 text-plasma-blue">
            <FileSpreadsheet className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-vision-ink truncate">{layout.title}</p>
            <p className="text-xs text-soft-slate truncate">{layout.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Columnas esperadas */}
        <div className="p-3 rounded-xl bg-white/30 border border-white/40">
          <div className="flex items-center gap-2 mb-2">
            <Info className="size-4 text-plasma-blue" />
            <span className="text-xs font-medium text-vision-ink">Columnas requeridas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {layout.columns.map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 text-xs font-mono bg-white/50 border border-white/60 rounded-md text-soft-slate"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Input de archivo */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || importing}
        />

        {/* Preview de validación */}
        <AnimatePresence mode="wait">
          {showPreview && validationResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Archivo seleccionado */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/50">
                <FileText className="size-5 text-plasma-blue" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-vision-ink truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-soft-slate">{validationResult.rowCount} filas detectadas</p>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <X className="size-4 text-soft-slate" />
                </button>
              </div>

              {/* Estado de validación */}
              <div className={cn(
                'p-3 rounded-xl border',
                validationResult.valid 
                  ? 'bg-emerald-50/50 border-emerald-200/50' 
                  : 'bg-red-50/50 border-red-200/50'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.valid ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 text-red-600" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    validationResult.valid ? 'text-emerald-700' : 'text-red-700'
                  )}>
                    {validationResult.valid ? 'Validación exitosa' : 'Errores encontrados'}
                  </span>
                </div>

                {/* Errores */}
                {validationResult.errors.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {validationResult.errors.slice(0, 5).map((error, i) => (
                      <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <AlertCircle className="size-3 mt-0.5 flex-shrink-0" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {validationResult.warnings.slice(0, 3).map((warning, i) => (
                      <p key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
                        <AlertTriangle className="size-3 mt-0.5 flex-shrink-0" />
                        {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Progreso de importación */}
              {importing && progress && (
                <div className="p-3 rounded-xl bg-plasma-blue/5 border border-plasma-blue/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-vision-ink">Importando...</span>
                    <span className="text-xs text-soft-slate">
                      {progress.processed}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-plasma-blue to-plasma-indigo"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progress.processed / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Resultado de importación */}
              {importResult && (
                <div className={cn(
                  'p-3 rounded-xl border',
                  importResult.success 
                    ? 'bg-emerald-50/50 border-emerald-200/50' 
                    : 'bg-red-50/50 border-red-200/50'
                )}>
                  <div className="flex items-center gap-2">
                    {importResult.success ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="size-4 text-red-600" />
                    )}
                    <span className={cn(
                      'text-sm',
                      importResult.success ? 'text-emerald-700' : 'text-red-700'
                    )}>
                      {importResult.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Botón de importar */}
              {validationResult.valid && !importing && !importResult?.success && (
                <Button
                  onClick={handleImport}
                  variant="primary"
                  fullWidth
                  icon={<Upload className="size-4" />}
                >
                  Importar {validationResult.rowCount} registros
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botones principales */}
        {!showPreview && (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="glass"
              fullWidth
              icon={importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              onClick={() => inputRef.current?.click()}
              disabled={disabled || importing}
            >
              {importing ? 'Importando...' : 'Importar CSV'}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                icon={<Download className="size-4" />}
                onClick={handleExportEmpty}
                disabled={disabled}
              >
                Layout vacío
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                icon={<FileSpreadsheet className="size-4" />}
                onClick={handleExportSample}
                disabled={disabled}
              >
                Con ejemplo
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
