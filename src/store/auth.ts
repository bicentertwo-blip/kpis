import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/auth'
import { KPI_IDS } from '@/utils/constants'

type ProfileInsert = Omit<Profile, 'id'> & { id?: string }

interface AuthStoreState {
  session: Session | null
  profile: Profile | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  setProfile: (profile: Profile | null) => void
}

const ensureProfile = async (user: User): Promise<Profile> => {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError
  }

  if (existing) {
    return existing as Profile
  }

  const { count } = await supabase.from('profiles').select('id', { head: true, count: 'exact' })
  const isFirstUser = (count ?? 0) === 0

  const payload: ProfileInsert = {
    id: crypto.randomUUID(),
    user_id: user.id,
    email: user.email ?? '',
    role: isFirstUser ? 'superadmin' : 'user',
    permitted_views: isFirstUser ? KPI_IDS : [],
  }

  const { data, error } = await supabase.from('profiles').insert(payload).select().single()
  if (error) {
    throw error
  }
  return data as Profile
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      status: 'idle',
      error: null,
      setProfile: (profile) => set({ profile }),
      initialize: async () => {
        try {
          set({ status: 'loading' })
          const { data } = await supabase.auth.getSession()
          const session = data.session ?? null
          set({ session, status: 'idle' })

          if (session?.user) {
            const profile = await ensureProfile(session.user)
            set({ profile })
          }

          supabase.auth.onAuthStateChange(async (_event, nextSession) => {
            set({ session: nextSession })
            if (nextSession?.user) {
              const profile = await ensureProfile(nextSession.user)
              set({ profile })
            } else {
              set({ profile: null })
            }
          })
        } catch (error) {
          console.error(error)
          set({ status: 'error', error: (error as Error).message })
        }
      },
      login: async (email, password) => {
        set({ status: 'loading', error: null })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          set({ status: 'error', error: error.message })
          throw error
        }
        const profile = data.user ? await ensureProfile(data.user) : null
        set({ session: data.session ?? null, profile, status: 'idle' })
      },
      logout: async () => {
        await supabase.auth.signOut()
        set({ session: null, profile: null })
      },
      requestPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/set-password`,
        })
        if (error) throw error
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      },
    }),
    {
      name: 'kpis-auth-store',
      partialize: ({ session, profile }) => ({ session, profile }),
    }
  )
)
