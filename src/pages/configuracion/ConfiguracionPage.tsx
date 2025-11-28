import { useEffect } from 'react'
import { usePermissionsStore } from '@/store/permissions'
import { KPI_VIEWS } from '@/utils/constants'
import { useAuthStore } from '@/store/auth'
import { WelcomeEmptyState } from '@/components/status/WelcomeEmptyState'

export const ConfiguracionPage = () => {
  const { assignments, fetchAssignments, toggleView, updateRole, adminLoading } = usePermissionsStore()
  const profile = useAuthStore((state) => state.profile)

  useEffect(() => {
    if (profile?.role === 'user') return
    void fetchAssignments()
  }, [fetchAssignments, profile?.role])

  if (profile && profile.role === 'user') {
    return <WelcomeEmptyState />
  }

  if (adminLoading) {
    return <p className="text-sm text-soft-slate">Sincronizando usuarios...</p>
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.user_id} className="glass-panel space-y-4 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-vision-ink">{assignment.email}</p>
              <p className="text-xs text-soft-slate">Permisos personalizados para cada vista KPI.</p>
            </div>
            <select
              value={assignment.role}
              onChange={(event) => void updateRole(assignment.user_id, event.target.value as typeof assignment.role)}
              className="rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
            >
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="user">Usuario</option>
            </select>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {KPI_VIEWS.map((view) => {
              const enabled = assignment.permitted_views?.includes(view.id) ?? false
              return (
                <button
                  key={view.id}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-2 text-sm ${enabled ? 'border-plasma-blue bg-plasma-blue/10 text-plasma-blue' : 'border-white/60 bg-white/70 text-soft-slate'}`}
                  onClick={() => void toggleView(assignment.user_id, view.id, !enabled)}
                  type="button"
                >
                  <span>{view.name}</span>
                  <span>{enabled ? 'Activo' : 'Inactivo'}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
