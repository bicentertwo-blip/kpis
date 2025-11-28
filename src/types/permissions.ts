import type { KpiViewId } from './kpi'
import type { UserRole } from './auth'

export interface PermissionAssignment {
  user_id: string
  email: string
  role: UserRole
  permitted_views: KpiViewId[]
  updated_at?: string
}

export interface PermissionTogglePayload {
  user_id: string
  view_id: KpiViewId
  enabled: boolean
}
