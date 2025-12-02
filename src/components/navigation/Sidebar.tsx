import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Settings2, ShieldCheck, LogOut } from 'lucide-react'
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

// iOS-optimized animation variants
const sidebarVariants = {
  hidden: { 
    opacity: 0, 
    x: -16,
    transform: 'translate3d(-16px, 0, 0)',
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transform: 'translate3d(0, 0, 0)',
  },
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    x: -8,
  },
  visible: { 
    opacity: 1, 
    x: 0,
  },
}

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
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      transition={{ 
        duration: 0.35, 
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="glass-panel sticky top-4 lg:top-6 flex h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-3rem)] flex-col rounded-3xl lg:rounded-4xl overflow-hidden"
      style={{
        // iOS GPU acceleration
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
      }}
    >
      {/* Header */}
      <div className="relative p-5 lg:p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/90 shadow-soft overflow-hidden p-1.5 border border-white/60">
            <img 
              src="/logo.png" 
              alt="Logo Inteligencia de Negocios" 
              className="max-w-full max-h-full object-contain"
              style={{ aspectRatio: 'auto' }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-vision-ink tracking-tight leading-none">KPIs</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-plasma-blue font-semibold mt-0.5">Inteligencia de Negocios</p>
          </div>
        </div>
        {/* Decorative line */}
        <div className="absolute bottom-0 left-5 right-5 lg:left-6 lg:right-6 h-px bg-gradient-to-r from-transparent via-plasma-blue/20 to-transparent" aria-hidden="true" />
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
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.04, duration: 0.25 }}
          >
            <NavLink
              to={link.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
                  'transition-all duration-200 ease-smooth', // Faster transition
                  'touch-manipulation', // iOS touch optimization
                  isActive
                    ? 'bg-gradient-to-r from-plasma-blue to-plasma-indigo text-white shadow-glow-sm'
                    : 'text-vision-ink hover:bg-white/60 hover:shadow-soft active:bg-white/80'
                )
              }
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <link.icon className={cn('size-[18px] transition-transform duration-200')} />
              <span>{link.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* KPIs section */}
      <div className="flex-1 overflow-hidden flex flex-col px-3 lg:px-4 py-3">
        <p className="px-2 mb-2 text-[10px] uppercase tracking-[0.25em] text-soft-slate font-medium flex items-center gap-2">
          <span className="w-8 h-px bg-gradient-to-r from-soft-slate/30 to-transparent" aria-hidden="true" />
          Indicadores
          <span className="flex-1 h-px bg-gradient-to-l from-soft-slate/30 to-transparent" aria-hidden="true" />
        </p>
        
        <div 
          className="flex-1 overflow-y-auto scrollbar-hide space-y-1 pr-1"
          style={{
            // iOS smooth scrolling
            WebkitOverflowScrolling: 'touch',
          }}
        >
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
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.08 + index * 0.02, duration: 0.2 }}
              >
                <NavLink
                  to={`/${view.id}`}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                      'transition-all duration-200 ease-smooth', // Faster
                      'touch-manipulation',
                      isActive
                        ? 'bg-white/80 shadow-soft text-vision-ink'
                        : 'text-vision-ink/70 hover:bg-white/50 hover:text-vision-ink active:bg-white/70'
                    )
                  }
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {Icon && (
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-plasma-blue/10 text-plasma-blue transition-all duration-200">
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
