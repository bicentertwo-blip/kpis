import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { KPI_CONFIGS } from '@/config/kpi-configs'
import { GlassCard } from '@/components/base/GlassCard'
import { Calendar, Database, Clock, User, ChevronDown, ChevronUp, FileText, Upload } from 'lucide-react'
import { cn } from '@/utils/ui'

// Mapeo de KPI ID a sus tablas de resumen
const KPI_SUMMARY_TABLES: Record<string, string[]> = {
  'margen-financiero': ['kpi_margen_financiero_resumen'],
  'indice-renovacion-creditos': ['kpi_indice_renovacion_resumen'],
  'rentabilidad-operativa': ['kpi_roe_roa_resumen'],
  'colocacion': ['kpi_colocacion_resumen_1', 'kpi_colocacion_resumen_2', 'kpi_colocacion_resumen_3'],
  'rentabilidad': ['kpi_rentabilidad_resumen_1', 'kpi_rentabilidad_resumen_2', 'kpi_rentabilidad_resumen_3', 'kpi_rentabilidad_resumen_4'],
  'rotacion-personal': ['kpi_rotacion_resumen_1', 'kpi_rotacion_resumen_2', 'kpi_rotacion_resumen_3', 'kpi_rotacion_resumen_4'],
  'escalabilidad': ['kpi_escalabilidad_resumen_1', 'kpi_escalabilidad_resumen_2', 'kpi_escalabilidad_resumen_3'],
  'posicionamiento-marca': ['kpi_posicionamiento_resumen_1', 'kpi_posicionamiento_resumen_2', 'kpi_posicionamiento_resumen_3'],
  'innovacion-incremental': ['kpi_innovacion_resumen'],
  'satisfaccion-cliente': ['kpi_satisfaccion_resumen_1', 'kpi_satisfaccion_resumen_2', 'kpi_satisfaccion_resumen_3'],
  'cumplimiento-regulatorio': ['kpi_cumplimiento_resumen_1', 'kpi_cumplimiento_resumen_2'],
  'gestion-riesgos': ['kpi_gestion_riesgos_resumen'],
  'gobierno-corporativo': ['kpi_gobierno_corporativo_resumen'],
}

// Mapeo de KPI ID a sus tablas de detalle
const KPI_DETAIL_TABLES: Record<string, string[]> = {
  'margen-financiero': ['kpi_margen_financiero_detalle'],
  'indice-renovacion-creditos': ['kpi_indice_renovacion_detalle'],
  'rentabilidad-operativa': ['kpi_roe_roa_detalle'],
  'colocacion': ['kpi_colocacion_detalle_1', 'kpi_colocacion_detalle_2', 'kpi_colocacion_detalle_3'],
  'rentabilidad': ['kpi_rentabilidad_detalle_1', 'kpi_rentabilidad_detalle_2', 'kpi_rentabilidad_detalle_3', 'kpi_rentabilidad_detalle_4'],
  'rotacion-personal': ['kpi_rotacion_detalle_1', 'kpi_rotacion_detalle_2', 'kpi_rotacion_detalle_3', 'kpi_rotacion_detalle_4'],
  'escalabilidad': ['kpi_escalabilidad_detalle_1', 'kpi_escalabilidad_detalle_2', 'kpi_escalabilidad_detalle_3'],
  'posicionamiento-marca': ['kpi_posicionamiento_detalle_1', 'kpi_posicionamiento_detalle_2', 'kpi_posicionamiento_detalle_3'],
  'innovacion-incremental': ['kpi_innovacion_detalle'],
  'satisfaccion-cliente': ['kpi_satisfaccion_detalle_1', 'kpi_satisfaccion_detalle_2', 'kpi_satisfaccion_detalle_3'],
  'cumplimiento-regulatorio': [],
  'gestion-riesgos': ['kpi_gestion_riesgos_detalle'],
  'gobierno-corporativo': ['kpi_gobierno_corporativo_detalle'],
}

interface KpiStats {
  summaryCount: number
  detailCount: number
  lastSummaryUpdate: string | null
  lastDetailUpdate: string | null
}

interface UserKpiData {
  user_id: string
  email: string
  kpiStats: Record<string, KpiStats>
  totalSummaries: number
  totalDetails: number
  lastGlobalUpdate: string | null
}

const KPI_LIST = Object.keys(KPI_SUMMARY_TABLES)

export const SupervisionPage = () => {
  const [users, setUsers] = useState<UserKpiData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      // 1. Obtener todos los perfiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .order('email')
      
      if (!profiles) {
        setLoading(false)
        return
      }

      // 2. Para cada usuario, consultar estadísticas de cada KPI
      const usersData: UserKpiData[] = await Promise.all(
        profiles.map(async (profile) => {
          const kpiStats: Record<string, KpiStats> = {}
          let totalSummaries = 0
          let totalDetails = 0
          let lastGlobalUpdate: string | null = null

          for (const kpiId of KPI_LIST) {
            const summaryTables = KPI_SUMMARY_TABLES[kpiId] || []
            const detailTables = KPI_DETAIL_TABLES[kpiId] || []
            
            let summaryCount = 0
            let detailCount = 0
            let lastSummaryUpdate: string | null = null
            let lastDetailUpdate: string | null = null

            // Contar registros de resumen
            for (const table of summaryTables) {
              try {
                const { count, data } = await supabase
                  .from(table)
                  .select('updated_at', { count: 'exact', head: false })
                  .eq('owner_id', profile.user_id)
                  .order('updated_at', { ascending: false })
                  .limit(1)
                
                summaryCount += count || 0
                if (data && data[0]?.updated_at) {
                  if (!lastSummaryUpdate || data[0].updated_at > lastSummaryUpdate) {
                    lastSummaryUpdate = data[0].updated_at
                  }
                }
              } catch {
                // Tabla no existe, ignorar
              }
            }

            // Contar registros de detalle
            for (const table of detailTables) {
              try {
                const { count, data } = await supabase
                  .from(table)
                  .select('created_at', { count: 'exact', head: false })
                  .eq('owner_id', profile.user_id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                
                detailCount += count || 0
                if (data && data[0]?.created_at) {
                  if (!lastDetailUpdate || data[0].created_at > lastDetailUpdate) {
                    lastDetailUpdate = data[0].created_at
                  }
                }
              } catch {
                // Tabla no existe, ignorar
              }
            }

            kpiStats[kpiId] = {
              summaryCount,
              detailCount,
              lastSummaryUpdate,
              lastDetailUpdate,
            }

            totalSummaries += summaryCount
            totalDetails += detailCount

            // Actualizar última fecha global
            const latestUpdate = lastSummaryUpdate && lastDetailUpdate
              ? (lastSummaryUpdate > lastDetailUpdate ? lastSummaryUpdate : lastDetailUpdate)
              : lastSummaryUpdate || lastDetailUpdate

            if (latestUpdate && (!lastGlobalUpdate || latestUpdate > lastGlobalUpdate)) {
              lastGlobalUpdate = latestUpdate
            }
          }

          return {
            user_id: profile.user_id,
            email: profile.email,
            kpiStats,
            totalSummaries,
            totalDetails,
            lastGlobalUpdate,
          }
        })
      )

      setUsers(usersData)
      setLoading(false)
    }

    void loadData()
  }, [])

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getKpiName = (kpiId: string) => {
    const config = KPI_CONFIGS[kpiId]
    return config?.shortName || config?.name || kpiId
  }

  const getStatusColor = (stats: KpiStats) => {
    if (stats.summaryCount > 0 && stats.detailCount > 0) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    if (stats.summaryCount > 0 || stats.detailCount > 0) {
      return 'bg-amber-100 text-amber-700 border-amber-200'
    }
    return 'bg-gray-100 text-gray-500 border-gray-200'
  }

  const getStatusLabel = (stats: KpiStats) => {
    if (stats.summaryCount > 0 && stats.detailCount > 0) {
      return 'Completo'
    }
    if (stats.summaryCount > 0 || stats.detailCount > 0) {
      return 'Parcial'
    }
    return 'Sin datos'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-soft-slate">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Database className="size-5" />
          </motion.div>
          <span>Cargando datos de supervisión...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-plasma-blue/10">
              <User className="size-5 text-plasma-blue" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-vision-ink">{users.length}</p>
              <p className="text-xs text-soft-slate">Usuarios en sistema</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100">
              <FileText className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-vision-ink">
                {users.reduce((acc, u) => acc + u.totalSummaries, 0)}
              </p>
              <p className="text-xs text-soft-slate">Resúmenes capturados</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <Upload className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-vision-ink">
                {users.reduce((acc, u) => acc + u.totalDetails, 0)}
              </p>
              <p className="text-xs text-soft-slate">Registros detalle (CSV)</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Lista de usuarios */}
      {users.map((user, index) => {
        const isExpanded = expandedUsers.has(user.user_id)
        const hasData = user.totalSummaries > 0 || user.totalDetails > 0

        return (
          <motion.div
            key={user.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard className="overflow-hidden">
              {/* Header del usuario - siempre visible */}
              <button
                onClick={() => toggleUserExpand(user.user_id)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold',
                    hasData 
                      ? 'bg-gradient-to-br from-plasma-blue/20 to-plasma-indigo/20 text-plasma-blue'
                      : 'bg-gray-100 text-gray-400'
                  )}>
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-vision-ink">{user.email}</p>
                    <div className="flex items-center gap-4 text-xs text-soft-slate mt-0.5">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        {user.totalSummaries} resúmenes
                      </span>
                      <span className="flex items-center gap-1">
                        <Upload className="size-3" />
                        {user.totalDetails} detalles
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-soft-slate">Última actividad</p>
                    <p className="text-sm text-vision-ink flex items-center gap-1 justify-end">
                      <Clock className="size-3" />
                      {formatDate(user.lastGlobalUpdate)}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-soft-slate" />
                  ) : (
                    <ChevronDown className="size-5 text-soft-slate" />
                  )}
                </div>
              </button>

              {/* Detalle expandido */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/40"
                >
                  <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {KPI_LIST.map((kpiId) => {
                      const stats = user.kpiStats[kpiId]
                      const latestUpdate = stats.lastSummaryUpdate && stats.lastDetailUpdate
                        ? (stats.lastSummaryUpdate > stats.lastDetailUpdate ? stats.lastSummaryUpdate : stats.lastDetailUpdate)
                        : stats.lastSummaryUpdate || stats.lastDetailUpdate

                      return (
                        <div
                          key={kpiId}
                          className={cn(
                            'rounded-xl border p-3 transition-all',
                            stats.summaryCount > 0 || stats.detailCount > 0
                              ? 'bg-white/60 border-white/60'
                              : 'bg-gray-50/50 border-gray-200/50'
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-vision-ink">
                              {getKpiName(kpiId)}
                            </p>
                            <span className={cn(
                              'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                              getStatusColor(stats)
                            )}>
                              {getStatusLabel(stats)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <FileText className="size-3 text-emerald-500" />
                              <span className="text-soft-slate">Resumen:</span>
                              <span className="font-medium text-vision-ink">{stats.summaryCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Upload className="size-3 text-amber-500" />
                              <span className="text-soft-slate">Detalle:</span>
                              <span className="font-medium text-vision-ink">{stats.detailCount}</span>
                            </div>
                          </div>
                          {latestUpdate && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-[10px] text-soft-slate">
                              <Calendar className="size-3" />
                              {formatDate(latestUpdate)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        )
      })}

      {users.length === 0 && (
        <GlassCard className="p-8 text-center">
          <User className="size-12 text-soft-slate/30 mx-auto mb-3" />
          <p className="text-soft-slate">No hay usuarios en el sistema</p>
        </GlassCard>
      )}
    </div>
  )
}
