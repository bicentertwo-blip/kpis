import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Database, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CleanupResult {
  tabla: string
  total: number
  actuales: number
  obsoletos: number
}

interface DeleteResult {
  tabla: string
  registros_eliminados: number
  accion: string
}

type Step = 'idle' | 'summary' | 'preview' | 'confirm' | 'deleting' | 'done'

interface DatabaseCleanupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DatabaseCleanupModal = ({ isOpen, onClose }: DatabaseCleanupModalProps) => {
  const [step, setStep] = useState<Step>('idle')
  const [summaryData, setSummaryData] = useState<CleanupResult[]>([])
  const [previewData, setPreviewData] = useState<DeleteResult[]>([])
  const [deleteResults, setDeleteResults] = useState<DeleteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('idle')
      setSummaryData([])
      setPreviewData([])
      setDeleteResults([])
      setError(null)
    }
  }, [isOpen])

  const totalObsoletos = summaryData.reduce((acc, item) => acc + item.obsoletos, 0)
  const totalActuales = summaryData.reduce((acc, item) => acc + item.actuales, 0)
  const totalRegistros = summaryData.reduce((acc, item) => acc + item.total, 0)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('get_duplicates_summary')
      if (rpcError) throw rpcError
      setSummaryData(data || [])
      setStep('summary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener resumen')
    } finally {
      setLoading(false)
    }
  }

  const fetchPreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('delete_obsolete_records', { p_dry_run: true })
      if (rpcError) throw rpcError
      setPreviewData(data || [])
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener preview')
    } finally {
      setLoading(false)
    }
  }

  const executeDelete = async () => {
    setLoading(true)
    setError(null)
    setStep('deleting')
    try {
      const { data, error: rpcError } = await supabase.rpc('delete_obsolete_records', { p_dry_run: false })
      if (rpcError) throw rpcError
      setDeleteResults(data || [])
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar registros')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (step !== 'deleting') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={handleClose}
      >
        {/* Backdrop with blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-purple-900/40 to-slate-900/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-slate-50/95 shadow-2xl shadow-purple-500/20 border border-white/50"
        >
          {/* Header con gradiente animado */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute size-2 rounded-full bg-white/20"
                  initial={{ 
                    x: Math.random() * 100 + '%', 
                    y: Math.random() * 100 + '%',
                    scale: 0 
                  }}
                  animate={{ 
                    x: [null, Math.random() * 100 + '%'],
                    y: [null, Math.random() * 100 + '%'],
                    scale: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.5
                  }}
                />
              ))}
            </div>

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Database className="size-7 sm:size-8 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Limpieza de Base de Datos
                  </h2>
                  <p className="text-sm text-white/80 mt-1">
                    Elimina registros obsoletos de forma segura
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={step === 'deleting'}
                className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all disabled:opacity-50"
              >
                <X className="size-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {/* Step: Idle */}
              {step === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StepCard 
                      icon={<Eye className="size-6" />}
                      title="1. Ver Estado"
                      description="Revisa cuántos registros actuales y obsoletos hay"
                      color="blue"
                    />
                    <StepCard 
                      icon={<Shield className="size-6" />}
                      title="2. Previsualizar"
                      description="Ve qué se eliminaría sin borrar nada"
                      color="amber"
                    />
                    <StepCard 
                      icon={<Zap className="size-6" />}
                      title="3. Ejecutar"
                      description="Elimina los registros obsoletos"
                      color="rose"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={fetchSummary}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <BarChart3 className="size-6" />
                    )}
                    {loading ? 'Analizando...' : 'Analizar Base de Datos'}
                  </motion.button>
                </motion.div>
              )}

              {/* Step: Summary */}
              {step === 'summary' && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  <div className="grid gap-4 grid-cols-3">
                    <StatCard 
                      value={totalRegistros}
                      label="Total"
                      color="slate"
                      icon={<Database className="size-5" />}
                    />
                    <StatCard 
                      value={totalActuales}
                      label="Actuales"
                      color="emerald"
                      icon={<CheckCircle2 className="size-5" />}
                    />
                    <StatCard 
                      value={totalObsoletos}
                      label="Obsoletos"
                      color="rose"
                      icon={<Trash2 className="size-5" />}
                    />
                  </div>

                  {/* Table List */}
                  {summaryData.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {summaryData.map((item, index) => (
                        <motion.div
                          key={item.tabla}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`flex items-center justify-between rounded-xl p-3 ${
                            item.obsoletos > 0 
                              ? 'bg-rose-50 border border-rose-200' 
                              : 'bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          <span className="text-sm font-medium text-slate-700 truncate flex-1">
                            {item.tabla.replace('kpi_', '').replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-600 font-semibold">{item.actuales} ✓</span>
                            {item.obsoletos > 0 && (
                              <span className="text-rose-600 font-semibold">{item.obsoletos} ✗</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="size-12 mx-auto text-emerald-500 mb-3" />
                      <p className="text-lg font-semibold text-slate-700">¡Base de datos limpia!</p>
                      <p className="text-sm text-slate-500">No hay registros obsoletos</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('idle')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <RefreshCw className="size-4" />
                      Volver
                    </motion.button>
                    {totalObsoletos > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchPreview}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30"
                      >
                        {loading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                        Previsualizar Limpieza
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step: Preview */}
              {step === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Warning Banner */}
                  <div className="flex items-start gap-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <AlertTriangle className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Modo Previsualización</p>
                      <p className="text-sm text-amber-700">
                        Esto muestra lo que se eliminaría. Aún no se ha borrado nada.
                      </p>
                    </div>
                  </div>

                  {/* Preview List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {previewData.map((item, index) => (
                      <motion.div
                        key={item.tabla}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 p-3"
                      >
                        <span className="text-sm font-medium text-slate-700 truncate flex-1">
                          {item.tabla.replace('kpi_', '').replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-bold text-rose-600">
                          -{item.registros_eliminados}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Total to delete */}
                  <div className="flex items-center justify-between rounded-2xl bg-rose-100 border border-rose-300 p-4">
                    <span className="font-semibold text-rose-800">Total a eliminar:</span>
                    <span className="text-2xl font-bold text-rose-600">
                      {previewData.reduce((acc, item) => acc + item.registros_eliminados, 0)} registros
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('summary')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('confirm')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30"
                    >
                      <Trash2 className="size-4" />
                      Confirmar Eliminación
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step: Confirm */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6 text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="mx-auto flex size-20 items-center justify-center rounded-full bg-rose-100"
                  >
                    <AlertTriangle className="size-10 text-rose-600" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-800">¿Estás seguro?</h3>
                    <p className="text-slate-600 mt-2">
                      Esta acción eliminará permanentemente{' '}
                      <span className="font-bold text-rose-600">
                        {previewData.reduce((acc, item) => acc + item.registros_eliminados, 0)} registros
                      </span>{' '}
                      obsoletos.
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('preview')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      No, cancelar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={executeDelete}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/40"
                    >
                      <Trash2 className="size-4" />
                      Sí, eliminar todo
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step: Deleting */}
              {step === 'deleting' && (
                <motion.div
                  key="deleting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 space-y-6"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="relative"
                  >
                    <div className="size-20 rounded-full border-4 border-purple-200" />
                    <div className="absolute inset-0 size-20 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
                    <Trash2 className="absolute inset-0 m-auto size-8 text-purple-600" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-800">Eliminando registros...</p>
                    <p className="text-sm text-slate-500">Por favor espera, esto puede tomar unos segundos</p>
                  </div>
                </motion.div>
              )}

              {/* Step: Done */}
              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                    className="mx-auto flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-xl shadow-emerald-500/40"
                  >
                    <CheckCircle2 className="size-12 text-white" />
                  </motion.div>

                  <div>
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-slate-800"
                    >
                      ¡Limpieza completada!
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-slate-600 mt-2"
                    >
                      Se eliminaron{' '}
                      <span className="font-bold text-emerald-600">
                        {deleteResults.reduce((acc, item) => acc + item.registros_eliminados, 0)} registros
                      </span>{' '}
                      obsoletos.
                    </motion.p>
                  </div>

                  {/* Results */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {deleteResults.map((item, index) => (
                      <motion.div
                        key={item.tabla}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.03 }}
                        className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3"
                      >
                        <span className="text-sm font-medium text-slate-700 truncate flex-1">
                          {item.tabla.replace('kpi_', '').replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="size-4" />
                          {item.registros_eliminados}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30"
                  >
                    <Sparkles className="size-5" />
                    ¡Perfecto!
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4"
              >
                <AlertTriangle className="size-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700">{error}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Helper Components
const StepCard = ({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  color: 'blue' | 'amber' | 'rose'
}) => {
  const colors = {
    blue: 'from-blue-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-red-600'
  }

  return (
    <div className="rounded-2xl bg-white/80 border border-white/60 p-4 text-center shadow-sm">
      <div className={`mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg`}>
        {icon}
      </div>
      <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  )
}

const StatCard = ({ 
  value, 
  label, 
  color, 
  icon 
}: { 
  value: number
  label: string
  color: 'slate' | 'emerald' | 'rose'
  icon: React.ReactNode
}) => {
  const colors = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    rose: 'bg-rose-100 text-rose-600 border-rose-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border p-4 text-center ${colors[color]}`}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-bold">{value.toLocaleString()}</span>
      </div>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </motion.div>
  )
}
