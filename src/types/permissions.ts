import type { AppViewId } from './views'

export interface PermissionAssignment {
  user_id: string
  email: string
  permitted_views: AppViewId[]
  updated_at?: string
}

export interface PermissionViewDefinition {
  id: AppViewId
  name: string
  description: string
  category: 'core' | 'kpi'
}
