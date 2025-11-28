import type { Session } from '@supabase/supabase-js'
import type { ProfileRow } from './supabase'

export type Profile = ProfileRow

export interface AuthContextState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
}
