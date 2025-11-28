import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { KPI_VIEWS } from '@/utils/constants'
import { GlassCard } from '@/components/base/GlassCard'
import { ProgressPill } from '@/components/status/ProgressPill'
import { useProgressStore } from '@/store/progress'
import { useAuthStore } from '@/store/auth'
import { usePermissionsStore } from '@/store/permissions'
import { WelcomeEmptyState } from '@/components/status/WelcomeEmptyState'
import { KPI_ICON_MAP } from '@/components/kpi/iconMap'
import { cn } from '@/utils/ui'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
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
  const profile = useAuthStore((state) => state.profile)
  const fetchForUser = useProgressStore((state) => state.fetchForUser)
  const entries = useProgressStore((state) => state.entries)
  const permissions = usePermissionsStore((state) => state.permissions)
  const loadingPermissions = usePermissionsStore((state) => state.loading)

  useEffect(() => {
    if (profile?.user_id) {
      void fetchForUser(profile.user_id)
    }
  }, [fetchForUser, profile?.user_id])

  const visibleKpis = KPI_VIEWS.filter((view) => permissions[view.id])

  // Calculate stats
  const stats = {
    total: visibleKpis.length,
    complete: visibleKpis.filter((v) => entries[v.id]?.status === 'complete').length,
    inProgress: visibleKpis.filter((v) => entries[v.id]?.status === 'in_progress').length,
    notStarted: visibleKpis.filter((v) => !entries[v.id] || entries[v.id]?.status === 'not_started').length,
  }

  if (!loadingPermissions && Object.values(permissions).every((value) => !value)) {
    return <WelcomeEmptyState />
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Stats cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
      >
        {[
          { label: 'Total KPIs', value: stats.total, icon: TrendingUp, color: 'from-plasma-blue to-plasma-indigo' },
          { label: 'Completados', value: stats.complete, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
          { label: 'En progreso', value: stats.inProgress, icon: Clock, color: 'from-amber-500 to-orange-500' },
          { label: 'Sin iniciar', value: stats.notStarted, icon: AlertCircle, color: 'from-slate-400 to-slate-500' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <GlassCard animate={false} padding="md" className="group hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-soft-slate font-medium">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-vision-ink mt-1">{stat.value}</p>
                </div>
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl lg:rounded-2xl',
                  'bg-gradient-to-br shadow-lg',
                  stat.color
                )}>
                  <stat.icon className="size-5 sm:size-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-vision-ink">Indicadores</h2>
            <p className="text-sm text-soft-slate">Gestiona y actualiza tus KPIs</p>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {visibleKpis.map((view) => {
            const Icon = KPI_ICON_MAP[view.icon]
            const status = entries[view.id]?.status ?? 'not_started'
            
            return (
              <motion.div key={view.id} variants={itemVariants}>
                <Link to={`/${view.id}`}>
                  <GlassCard
                    animate={false}
                    hover
                    padding="md"
                    className="group h-full"
                  >
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-plasma-blue/10 to-plasma-indigo/10 text-plasma-blue group-hover:from-plasma-blue group-hover:to-plasma-indigo group-hover:text-white group-hover:shadow-glow-sm transition-all duration-300">
                          {Icon && <Icon className="size-5 sm:size-6" />}
                        </div>
                        <ProgressPill status={status} />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-vision-ink group-hover:text-plasma-blue transition-colors line-clamp-1">
                          {view.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-soft-slate mt-1 line-clamp-2">
                          {view.description}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/40">
                        <span className="text-xs text-soft-slate">{view.fields.length} campos</span>
                        <span className="flex items-center gap-1 text-xs font-medium text-plasma-blue opacity-0 group-hover:opacity-100 transition-opacity">
                          Abrir <ArrowUpRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
