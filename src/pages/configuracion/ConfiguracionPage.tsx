import { useEffect } from 'react'
import { usePermissionsStore } from '@/store/permissions'
import { PERMISSION_VIEWS } from '@/utils/constants'

const coreViews = PERMISSION_VIEWS.filter((view) => view.category === 'core')
const kpiViews = PERMISSION_VIEWS.filter((view) => view.category === 'kpi')

export const ConfiguracionPage = () => {
  const { assignments, fetchAssignments, toggleView, adminLoading } = usePermissionsStore()

  useEffect(() => {
    void fetchAssignments()
  }, [fetchAssignments])

  if (adminLoading) {
    return <p className="text-sm text-soft-slate">Sincronizando usuarios...</p>
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.user_id} className="glass-panel space-y-4 rounded-3xl p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-vision-ink">{assignment.email}</p>
                <p className="text-xs text-soft-slate">Activa vistas para este usuario de forma granular.</p>
              </div>
              <p className="text-xs text-soft-slate">
                Última edición:{' '}
                {assignment.updated_at ? new Date(assignment.updated_at).toLocaleString() : '—'}
              </p>
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
      ))}
    </div>
  )
}
