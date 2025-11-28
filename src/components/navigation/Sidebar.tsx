import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Settings2, ShieldCheck, LogOut, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { KPI_VIEWS } from '@/utils/constants'
import { KPI_ICON_MAP } from '@/components/kpi/iconMap'
import { useAuthStore } from '@/store/auth'
import { usePermissionsStore } from '@/store/permissions'
import { Button } from '@/components/base/Button'
import { cn } from '@/utils/ui'

const navBase = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, viewId: 'dashboard' as const },
  { label: 'Supervisión', to: '/supervision', icon: ShieldCheck, viewId: 'supervision' as const },
  { label: 'Configuración', to: '/configuracion', icon: Settings2, viewId: 'configuracion' as const },
]

interface SidebarProps {
  onNavigate?: () => void
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { profile, logout } = useAuthStore()
  const canAccess = usePermissionsStore((state) => state.canAccess)
  const permissions = usePermissionsStore((state) => state.permissions)
  const loadingPermissions = usePermissionsStore((state) => state.loading)

  const visibleNavLinks = navBase.filter((link) => canAccess(link.viewId))
  const visibleKpis = KPI_VIEWS.filter((view) => canAccess(view.id))
  const enabledCount = Object.values(permissions).filter(Boolean).length

  const handleNavClick = () => {
    onNavigate?.()
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
      className="glass-panel sticky top-4 lg:top-6 flex h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-3rem)] flex-col rounded-3xl lg:rounded-4xl overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-5 lg:p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-plasma-blue to-plasma-indigo shadow-glow-sm">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-soft-slate font-medium">KPIs</p>
            <h2 className="text-lg font-semibold text-vision-ink leading-tight">VisionOS</h2>
          </div>
        </div>
        {/* Decorative line */}
        <div className="absolute bottom-0 left-5 right-5 lg:left-6 lg:right-6 h-px bg-gradient-to-r from-transparent via-plasma-blue/20 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="px-3 lg:px-4 py-2 space-y-1">
        {visibleNavLinks.length === 0 && !loadingPermissions && (
          <p className="rounded-2xl border border-dashed border-soft-slate/30 px-4 py-3 text-xs text-soft-slate text-center">
            Sin vistas activas
          </p>
        )}
        {visibleNavLinks.map((link, index) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <NavLink
              to={link.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
                  'transition-all duration-300 ease-smooth',
                  isActive
                    ? 'bg-gradient-to-r from-plasma-blue to-plasma-indigo text-white shadow-glow-sm'
                    : 'text-vision-ink hover:bg-white/60 hover:shadow-soft'
                )
              }
            >
              <link.icon className={cn('size-[18px] transition-transform duration-300 group-hover:scale-110')} />
              <span>{link.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* KPIs section */}
      <div className="flex-1 overflow-hidden flex flex-col px-3 lg:px-4 py-3">
        <p className="px-2 mb-2 text-[10px] uppercase tracking-[0.25em] text-soft-slate font-medium flex items-center gap-2">
          <span className="w-8 h-px bg-gradient-to-r from-soft-slate/30 to-transparent" />
          Indicadores
          <span className="flex-1 h-px bg-gradient-to-l from-soft-slate/30 to-transparent" />
        </p>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 pr-1">
          {visibleKpis.length === 0 && !loadingPermissions && (
            <div className="rounded-2xl border border-dashed border-soft-slate/30 px-4 py-6 text-center">
              <p className="text-xs text-soft-slate">No tienes KPIs activos</p>
              <p className="text-[10px] text-soft-slate/60 mt-1">Solicita acceso a un administrador</p>
            </div>
          )}
          {visibleKpis.map((view, index) => {
            const Icon = KPI_ICON_MAP[view.icon]
            return (
              <motion.div
                key={view.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.03 }}
              >
                <NavLink
                  to={`/${view.id}`}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                      'transition-all duration-300 ease-smooth',
                      isActive
                        ? 'bg-white/80 shadow-soft text-vision-ink'
                        : 'text-vision-ink/70 hover:bg-white/50 hover:text-vision-ink'
                    )
                  }
                >
                  {Icon && (
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-plasma-blue/10 text-plasma-blue transition-all duration-300 group-hover:bg-plasma-blue/15 group-hover:scale-105">
                      <Icon className="size-4" />
                    </span>
                  )}
                  <span className="truncate">{view.name}</span>
                </NavLink>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* User section */}
      <div className="p-3 lg:p-4 pt-0">
        <div className="rounded-2xl bg-gradient-to-br from-white/80 to-white/40 border border-white/60 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma-blue/20 to-plasma-indigo/20 flex items-center justify-center text-plasma-blue font-semibold text-sm">
              {profile?.email?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vision-ink truncate">{profile?.email}</p>
              <p className="text-xs text-soft-slate">
                {loadingPermissions ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-plasma-blue animate-pulse" />
                    Sincronizando...
                  </span>
                ) : (
                  `${enabledCount} vista${enabledCount !== 1 ? 's' : ''} activa${enabledCount !== 1 ? 's' : ''}`
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            icon={<LogOut className="size-4" />}
            onClick={() => void logout()}
            className="justify-center"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </motion.aside>
  )
}
