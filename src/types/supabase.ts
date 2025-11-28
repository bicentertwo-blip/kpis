import type { KpiRecord, ProgressStatus, KpiViewId } from './kpi'
import type { AppViewId } from './views'

export interface ProfileRow {
  id: string
  user_id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  permitted_views: AppViewId[]
  created_at?: string | null
  updated_at?: string | null
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'id'> & { id?: string }
        Update: Partial<ProfileRow>
        Relationships: []
      }
      progress_tracking: {
        Row: {
          id: string
          owner_id: string
          view_id: KpiRecord['view_id']
          status: ProgressStatus
          updated_at: string
        Insert: {
          id?: string
          owner_id: string
          view_id: KpiRecord['view_id']
          status: ProgressStatus
          updated_at?: string
        }
        Update: Partial<{ owner_id: string; view_id: KpiRecord['view_id']; status: ProgressStatus; updated_at: string }>
        Relationships: []
      }
      /** Generic KPI storage per view (JSON payload + metadata). */
      kpi_payloads: {
        Row: KpiRecord
        Insert: KpiRecord
        Update: Partial<KpiRecord>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
