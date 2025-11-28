import { Navigate, Outlet } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePermissionsStore } from '@/store/permissions'
import type { KpiViewId } from '@/types/kpi'
import { FullScreenLoader } from '@/components/status/FullScreenLoader'
import { WelcomeEmptyState } from '@/components/status/WelcomeEmptyState'

export const ProtectedRoute = () => {
  const { session, status } = useAuthStore()
  if (status === 'loading') return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

interface PermissionGuardProps extends PropsWithChildren {
  viewId: KpiViewId
}

export const PermissionGuard = ({ viewId, children }: PermissionGuardProps) => {
  const canAccess = usePermissionsStore((state) => state.permissions[viewId])
  const loading = usePermissionsStore((state) => state.loading)

  if (loading) {
    return <FullScreenLoader />
  }

  if (!canAccess) {
    return <WelcomeEmptyState viewId={viewId} />
  }

  return children ?? <Outlet />
}
