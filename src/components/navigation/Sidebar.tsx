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
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Supervisión', to: '/supervision', icon: ShieldCheck, requiresAdmin: true },
  { label: 'Configuración', to: '/configuracion', icon: Settings2, requiresAdmin: true },
]

export const Sidebar = () => {
  const { profile, logout } = useAuthStore()
  const canAccess = usePermissionsStore((state) => state.canAccess)
  const role = profile?.role

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
        {navBase
          .filter((link) => (link.requiresAdmin ? role === 'superadmin' || role === 'admin' : true))
          .map((link) => (
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
        {KPI_VIEWS.map((view) => {
          const Icon = KPI_ICON_MAP[view.icon]
          const disabled = !canAccess(view.id)
          return (
            <NavLink
              key={view.id}
              to={`/${view.id}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-2 text-sm transition-all duration-300',
                  disabled && 'pointer-events-none opacity-40',
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
        <p className="text-xs text-soft-slate">Rol: {profile?.role ?? '—'}</p>
        <Button className="mt-4 w-full" variant="ghost" icon={<LogOut className="size-4" />} onClick={() => void logout()}>
          Cerrar sesión
        </Button>
      </div>
    </motion.aside>
  )
}
