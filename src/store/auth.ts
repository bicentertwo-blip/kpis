import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/auth'
import { FIRST_USER_DEFAULT_VIEWS } from '@/utils/constants'

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

let profileCache: Record<string, Profile> = {}
let profileLocks: Record<string, Promise<Profile>> = {}

const ensureProfile = async (user: User): Promise<Profile> => {
  // Check cache first
  if (profileCache[user.id]) {
    return profileCache[user.id]
  }

  // Check if there's already a pending operation for this user
  if (profileLocks[user.id]) {
    return profileLocks[user.id]
  }

  // Create a lock for this user
  const lockPromise = (async () => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existing) {
        profileCache[user.id] = existing as Profile
        return existing as Profile
      }

      // Use RPC function to create profile with atomic first-user check
      const { data, error } = await supabase.rpc('create_profile_with_permissions', {
        p_user_id: user.id,
        p_email: user.email ?? '',
      })

      if (error) {
        throw error
      }

      const profile = data as Profile
      profileCache[user.id] = profile
      return profile
    } finally {
      delete profileLocks[user.id]
    }
  })()

  profileLocks[user.id] = lockPromise
  return lockPromise
}

let authSubscription: { unsubscribe: () => void } | null = null

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

          // Unsubscribe from previous listener if exists
          if (authSubscription) {
            authSubscription.unsubscribe()
          }

          // Register auth state change listener only once
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
            set({ session: nextSession })
            if (nextSession?.user) {
              const profile = await ensureProfile(nextSession.user)
              set({ profile })
            } else {
              set({ profile: null })
            }
          })
          
          authSubscription = subscription
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
        profileCache = {}
        profileLocks = {}
        if (authSubscription) {
          authSubscription.unsubscribe()
          authSubscription = null
        }
        set({ session: null, profile: null })
      },
      requestPasswordReset: async (email) => {
        const redirectUrl = new URL('/auth/callback', window.location.origin)
        redirectUrl.searchParams.set('next', '/set-password')

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl.toString(),
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
