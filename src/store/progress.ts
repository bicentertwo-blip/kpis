import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { KpiViewId, ProgressStatus } from '@/types/kpi'
import type { ProgressEntry } from '@/types/progress'
import { KPI_IDS } from '@/utils/constants'

interface ProgressStoreState {
  entries: Record<KpiViewId, ProgressEntry | null>
  loading: boolean
  error: string | null
  fetchForUser: (userId: string) => Promise<void>
  upsertStatus: (payload: { userId: string; viewId: KpiViewId; status: ProgressStatus }) => Promise<void>
}

const emptyEntries = () =>
  KPI_IDS.reduce<Record<KpiViewId, ProgressEntry | null>>((acc, id) => {
    acc[id] = null
    return acc
  }, {} as Record<KpiViewId, ProgressEntry | null>)

export const useProgressStore = create<ProgressStoreState>((set) => ({
  entries: emptyEntries(),
  loading: false,
  error: null,
  fetchForUser: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('owner_id', userId)

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    const nextEntries = emptyEntries()
    data?.forEach((entry) => {
      nextEntries[entry.view_id as KpiViewId] = entry as ProgressEntry
    })

    set({ entries: nextEntries, loading: false, error: null })
  },
  upsertStatus: async ({ userId, viewId, status }) => {
    const payload = {
      owner_id: userId,
      view_id: viewId,
      status,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('progress_tracking').upsert(payload, { onConflict: 'owner_id,view_id' })

    if (error) {
      set({ error: error.message })
      return
    }

    set((state) => ({
      entries: {
        ...state.entries,
        [viewId]: { ...payload },
      },
    }))
  },
}))
