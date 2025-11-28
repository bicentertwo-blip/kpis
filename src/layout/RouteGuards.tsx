import { Navigate, Outlet } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePermissionsStore } from '@/store/permissions'
import type { AppViewId } from '@/types/views'
import { FullScreenLoader } from '@/components/status/FullScreenLoader'
import { WelcomeEmptyState } from '@/components/status/WelcomeEmptyState'
import { ALL_VIEW_IDS } from '@/utils/constants'

export const ProtectedRoute = () => {
  const { session, status } = useAuthStore()
  if (status === 'loading') return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

interface PermissionGuardProps extends PropsWithChildren {
  viewId: AppViewId
}

export const PermissionGuard = ({ viewId, children }: PermissionGuardProps) => {
  const isAllowed = usePermissionsStore((state) => state.canAccess(viewId))
  const loading = usePermissionsStore((state) => state.loading)

  if (loading) {
    return <FullScreenLoader />
  }

  if (!isAllowed) {
    return <WelcomeEmptyState viewId={viewId} />
  }

  return children ?? <Outlet />
}

const viewIdToPath = (viewId: AppViewId) => (viewId === 'dashboard' ? '/dashboard' : `/${viewId}`)

export const FirstAllowedRoute = () => {
  const loading = usePermissionsStore((state) => state.loading)
  const permissions = usePermissionsStore((state) => state.permissions)

  if (loading) {
    return <FullScreenLoader />
  }

  const target = ALL_VIEW_IDS.find((viewId) => permissions[viewId])

  if (!target) {
    return <WelcomeEmptyState customMessage="Todavía no tienes vistas activas. Pide a un administrador que te habilite el acceso." />
  }

  return <Navigate to={viewIdToPath(target)} replace />
}
