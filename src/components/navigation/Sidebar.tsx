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

export const Sidebar = () => {
  const { profile, logout } = useAuthStore()
  const canAccess = usePermissionsStore((state) => state.canAccess)
  const permissions = usePermissionsStore((state) => state.permissions)
  const loadingPermissions = usePermissionsStore((state) => state.loading)

  const visibleNavLinks = navBase.filter((link) => canAccess(link.viewId))
  const visibleKpis = KPI_VIEWS.filter((view) => canAccess(view.id))
  const enabledCount = Object.values(permissions).filter(Boolean).length

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-panel sticky top-6 flex h-[calc(100vh-3rem)] w-72 flex-col gap-6 rounded-4xl p-6"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-soft-slate">KPIs VisionOS</p>
        <h2 className="mt-2 text-xl font-semibold text-vision-ink">Control Room</h2>
      </div>

      <nav className="space-y-1">
        {visibleNavLinks.length === 0 && !loadingPermissions && (
          <p className="rounded-2xl border border-dashed border-white/50 px-4 py-3 text-xs text-soft-slate">
            Sin vistas base activas.
          </p>
        )}
        {visibleNavLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300',
                isActive ? 'bg-plasma-blue text-white shadow-glow' : 'text-vision-ink hover:bg-white/70'
              )
            }
          >
            <link.icon className="size-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 overflow-y-auto pr-1">
        <p className="text-xs uppercase tracking-[0.3em] text-soft-slate">KPIs</p>
        {visibleKpis.length === 0 && !loadingPermissions && (
          <p className="rounded-2xl border border-dashed border-white/50 px-4 py-2 text-xs text-soft-slate">
            No tienes KPIs activos todavía.
          </p>
        )}
        {visibleKpis.map((view) => {
          const Icon = KPI_ICON_MAP[view.icon]
          return (
            <NavLink
              key={view.id}
              to={`/${view.id}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-2 text-sm transition-all duration-300',
                  isActive ? 'bg-white/80 shadow-inner' : 'hover:bg-white/70'
                )
              }
            >
              {Icon && <Icon className="size-4 text-plasma-blue" />}
              <span>{view.name}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="mt-auto rounded-3xl border border-white/60 bg-white/70 p-4">
        <p className="text-sm font-medium text-vision-ink">{profile?.email}</p>
        <p className="text-xs text-soft-slate">
          {loadingPermissions ? 'Sincronizando permisos...' : `Vistas activas: ${enabledCount}`}
        </p>
        <Button className="mt-4 w-full" variant="ghost" icon={<LogOut className="size-4" />} onClick={() => void logout()}>
          Cerrar sesión
        </Button>
      </div>
    </motion.aside>
  )
}
