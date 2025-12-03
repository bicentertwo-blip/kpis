import { motion } from 'framer-motion'
import { Calendar, Loader2, RefreshCw } from 'lucide-react'
import { KpiProgressCard } from '@/components/dashboard/KpiProgressCard'
import { useDashboardKpis } from '@/hooks/useDashboardKpis'
import { usePermissionsStore } from '@/store/permissions'
import { WelcomeEmptyState } from '@/components/status/WelcomeEmptyState'
import { cn } from '@/utils/ui'
import type { AppViewId } from '@/types/views'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0, 1] as const }
  }
}

export const DashboardPage = () => {
  const { kpis, loading, year, refresh } = useDashboardKpis()
  const permissions = usePermissionsStore((state) => state.permissions)
  const loadingPermissions = usePermissionsStore((state) => state.loading)

  // Filtrar KPIs según permisos
  const visibleKpis = kpis.filter((kpi) => {
    // El id del KPI es directamente el AppViewId
    const permissionId = kpi.id as AppViewId
    return permissions[permissionId]
  })

  // Calcular estadísticas rápidas
  const stats = {
    green: visibleKpis.filter(k => k.status === 'green').length,
    yellow: visibleKpis.filter(k => k.status === 'yellow').length,
    red: visibleKpis.filter(k => k.status === 'red').length,
    gray: visibleKpis.filter(k => k.status === 'gray').length,
  }

  if (!loadingPermissions && Object.values(permissions).every((value) => !value)) {
    return <WelcomeEmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vision-ink">
            Panel de Indicadores
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="size-4 text-soft-slate" />
            <span className="text-sm text-soft-slate">
              Año {year} • Progreso acumulado
            </span>
          </div>
        </div>

        {/* Mini resumen de estados */}
        <div className="flex items-center gap-3">
          {stats.green > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">{stats.green}</span>
            </div>
          )}
          {stats.yellow > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-700">{stats.yellow}</span>
            </div>
          )}
          {stats.red > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-700">{stats.red}</span>
            </div>
          )}
          {stats.gray > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-medium text-slate-600">{stats.gray}</span>
            </div>
          )}
          
          {/* Botón refrescar */}
          <button
            onClick={refresh}
            disabled={loading}
            className={cn(
              'p-2 rounded-xl',
              'bg-white/60 border border-white/60',
              'hover:bg-white/80 hover:border-plasma-blue/20',
              'transition-all duration-200',
              'disabled:opacity-50'
            )}
          >
            <RefreshCw className={cn('size-4 text-soft-slate', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && visibleKpis.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-plasma-blue animate-spin" />
            <p className="text-sm text-soft-slate">Cargando indicadores...</p>
          </div>
        </div>
      )}

      {/* Grid de KPIs */}
      {visibleKpis.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visibleKpis.map((kpi) => (
            <motion.div key={kpi.id} variants={itemVariants}>
              <KpiProgressCard {...kpi} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty state si no hay KPIs visibles */}
      {!loading && visibleKpis.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Calendar className="size-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-vision-ink mb-2">
            No hay indicadores disponibles
          </h3>
          <p className="text-sm text-soft-slate max-w-md">
            Contacta al administrador para que te asigne acceso a los indicadores.
          </p>
        </div>
      )}
    </div>
  )
}
