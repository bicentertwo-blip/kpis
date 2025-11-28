import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { KPI_VIEWS } from '@/utils/constants'
import type { UserProgressOverview } from '@/types/progress'
import { GlassCard } from '@/components/base/GlassCard'
import { ProgressPill } from '@/components/status/ProgressPill'

export const SupervisionPage = () => {
  const [rows, setRows] = useState<UserProgressOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: profiles }, { data: progress }] = await Promise.all([
        supabase.from('profiles').select('user_id, email'),
        supabase.from('progress_tracking').select('*'),
      ])

      const merged = (profiles ?? []).map((profile) => {
        const statuses: UserProgressOverview['statuses'] = {} as UserProgressOverview['statuses']
        KPI_VIEWS.forEach((view) => {
          const match = progress?.find((entry) => entry.owner_id === profile.user_id && entry.view_id === view.id)
          statuses[view.id] = match?.status ?? 'not_started'
        })
        return {
          user_id: profile.user_id,
          email: profile.email,
          statuses,
          last_update: progress?.find((entry) => entry.owner_id === profile.user_id)?.updated_at ?? undefined,
        }
      })

      setRows(merged)
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) {
    return <p className="text-sm text-soft-slate">Actualizando tablero de supervisión...</p>
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <GlassCard key={row.user_id} className="space-y-3">
          <div className="flex items-center justify-between text-sm text-vision-ink">
            <p>{row.email}</p>
            <p className="text-xs text-soft-slate">Última edición: {row.last_update ? new Date(row.last_update).toLocaleString() : '—'}</p>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {KPI_VIEWS.map((view) => (
              <div key={view.id} className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/70 px-3 py-2">
                <p className="text-xs text-soft-slate">{view.name}</p>
                <ProgressPill status={row.statuses[view.id]} />
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  )
}
