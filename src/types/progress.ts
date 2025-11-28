import type { KpiViewId, ProgressStatus } from './kpi'

export interface ProgressEntry {
  id?: string
  owner_id: string
  view_id: KpiViewId
  status: ProgressStatus
  updated_at?: string
}

export interface UserProgressOverview {
  user_id: string
  email: string
  statuses: Record<KpiViewId, ProgressStatus>
  last_update?: string
}
