import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { PermissionAssignment } from '@/types/permissions'
import type { KpiViewId } from '@/types/kpi'
import type { UserRole, Profile } from '@/types/auth'
import { KPI_IDS } from '@/utils/constants'

interface PermissionsStoreState {
  permissions: Record<KpiViewId, boolean>
  assignments: PermissionAssignment[]
  loading: boolean
  adminLoading: boolean
  error: string | null
  fetchForUser: (userId: string) => Promise<void>
  fetchAssignments: () => Promise<void>
  toggleView: (userId: string, viewId: KpiViewId, enabled: boolean) => Promise<void>
  updateRole: (userId: string, role: UserRole) => Promise<void>
  canAccess: (viewId: KpiViewId) => boolean
}

const buildEmptyPermissions = () =>
  KPI_IDS.reduce<Record<KpiViewId, boolean>>((acc, id) => {
    acc[id] = false
    return acc
  }, {} as Record<KpiViewId, boolean>)

export const usePermissionsStore = create<PermissionsStoreState>((set, get) => ({
  permissions: buildEmptyPermissions(),
  assignments: [],
  loading: true,
  adminLoading: false,
  error: null,
  canAccess: (viewId) => get().permissions[viewId] ?? false,
  fetchForUser: async (userId) => {
    if (!userId) return
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    const permittedViews = (data as Profile | null)?.permitted_views ?? []
    const nextState = buildEmptyPermissions()
    permittedViews.forEach((viewId) => {
      nextState[viewId] = true
    })

    set({ permissions: nextState, loading: false, error: null })
  },
  fetchAssignments: async () => {
    set({ adminLoading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, role, permitted_views, updated_at')
      .order('email')

    if (error) {
      set({ adminLoading: false, error: error.message })
      return
    }

    set({ assignments: (data ?? []) as PermissionAssignment[], adminLoading: false, error: null })
  },
  toggleView: async (userId, viewId, enabled) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('permitted_views')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    const current = ((data as Profile | null)?.permitted_views ?? []) as KpiViewId[]
    const next = enabled ? Array.from(new Set([...current, viewId])) : current.filter((item) => item !== viewId)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ permitted_views: next })
      .eq('user_id', userId)

    if (updateError) throw updateError

    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData.session?.user.id

    if (userId === currentUserId) {
      set((state) => ({
        permissions: { ...state.permissions, [viewId]: enabled },
      }))
    }

    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.user_id === userId ? { ...assignment, permitted_views: next } : assignment
      ),
    }))
  },
  updateRole: async (userId, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('user_id', userId)
    if (error) throw error

    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.user_id === userId ? { ...assignment, role } : assignment
      ),
    }))
  },
}))
