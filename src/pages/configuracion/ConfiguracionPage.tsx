import { useEffect, useState } from 'react'
import { usePermissionsStore } from '@/store/permissions'
import { PERMISSION_VIEWS, ALL_VIEW_IDS } from '@/utils/constants'
import type { AppViewId } from '@/types/views'

const coreViews = PERMISSION_VIEWS.filter((view) => view.category === 'core')
const kpiViews = PERMISSION_VIEWS.filter((view) => view.category === 'kpi')

export const ConfiguracionPage = () => {
  const { assignments, fetchAssignments, toggleView, setAllViewsForUser, setAllViewsForAllUsers, adminLoading } = usePermissionsStore()
  const [globalLoading, setGlobalLoading] = useState(false)

  useEffect(() => {
    void fetchAssignments()
  }, [fetchAssignments])

  const handleActivateAllForUser = async (userId: string) => {
    await setAllViewsForUser(userId, ALL_VIEW_IDS as AppViewId[])
  }

  const handleDeactivateAllForUser = async (userId: string) => {
    await setAllViewsForUser(userId, [])
  }

  const handleActivateAllForAllUsers = async () => {
    setGlobalLoading(true)
    await setAllViewsForAllUsers(ALL_VIEW_IDS as AppViewId[])
    setGlobalLoading(false)
  }

  const handleDeactivateAllForAllUsers = async () => {
    setGlobalLoading(true)
    await setAllViewsForAllUsers([])
    setGlobalLoading(false)
  }

  if (adminLoading) {
    return <p className="text-sm text-soft-slate">Sincronizando usuarios...</p>
  }

  return (
    <div className="space-y-6">
      {/* Controles globales */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-vision-ink">Acciones Globales</p>
            <p className="text-xs text-soft-slate">Aplica cambios a todos los usuarios de una sola vez.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleActivateAllForAllUsers()}
              disabled={globalLoading}
              className="rounded-2xl border border-emerald-400 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-100 disabled:opacity-50"
              type="button"
            >
              {globalLoading ? 'Aplicando...' : '✓ Activar Todo (Todos)'}
            </button>
            <button
              onClick={() => void handleDeactivateAllForAllUsers()}
              disabled={globalLoading}
              className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-100 disabled:opacity-50"
              type="button"
            >
              {globalLoading ? 'Aplicando...' : '✗ Desactivar Todo (Todos)'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      {assignments.map((assignment) => {
        const allEnabled = ALL_VIEW_IDS.every((id) => assignment.permitted_views?.includes(id))
        const noneEnabled = !assignment.permitted_views?.length

        return (
          <div key={assignment.user_id} className="glass-panel space-y-4 rounded-3xl p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-vision-ink">{assignment.email}</p>
                  <p className="text-xs text-soft-slate">Activa vistas para este usuario de forma granular.</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-soft-slate">
                    Última edición:{' '}
                    {assignment.updated_at ? new Date(assignment.updated_at).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              {/* Botones de activar/desactivar todo para el usuario */}
              <div className="flex gap-2 border-b border-white/40 pb-4">
                <button
                  onClick={() => void handleActivateAllForUser(assignment.user_id)}
                  disabled={allEnabled}
                  className="rounded-xl border border-emerald-400 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                >
                  ✓ Activar Todas
                </button>
                <button
                  onClick={() => void handleDeactivateAllForUser(assignment.user_id)}
                  disabled={noneEnabled}
                  className="rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                >
                  ✗ Desactivar Todas
                </button>
                <span className="ml-auto text-xs text-soft-slate">
                  {assignment.permitted_views?.length ?? 0} / {ALL_VIEW_IDS.length} vistas activas
                </span>
              </div>

              <section className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-soft-slate">Vistas base</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {coreViews.map((view) => {
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
              </section>

              <section className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-soft-slate">KPIs</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {kpiViews.map((view) => {
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
              </section>
            </div>
          </div>
        )
      })}
    </div>
  )
}
