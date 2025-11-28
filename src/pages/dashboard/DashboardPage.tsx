import { useEffect } from 'react'
import { KPI_VIEWS } from '@/utils/constants'
import { GlassCard } from '@/components/base/GlassCard'
import { ProgressPill } from '@/components/status/ProgressPill'
import { useProgressStore } from '@/store/progress'
import { useAuthStore } from '@/store/auth'
import { motion } from 'framer-motion'
import { usePermissionsStore } from '@/store/permissions'
import { WelcomeEmptyState } from '@/components/status/WelcomeEmptyState'

export const DashboardPage = () => {
  const profile = useAuthStore((state) => state.profile)
  const fetchForUser = useProgressStore((state) => state.fetchForUser)
  const entries = useProgressStore((state) => state.entries)
  const permissions = usePermissionsStore((state) => state.permissions)
  const loadingPermissions = usePermissionsStore((state) => state.loading)

  useEffect(() => {
    if (profile?.user_id) {
      void fetchForUser(profile.user_id)
    }
  }, [fetchForUser, profile?.user_id])

  if (!loadingPermissions && Object.values(permissions).every((value) => !value)) {
    return <WelcomeEmptyState />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {KPI_VIEWS.map((view, index) => (
        <motion.div key={view.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
          <GlassCard className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-vision-ink">{view.name}</p>
              <ProgressPill status={entries[view.id]?.status ?? 'not_started'} />
            </div>
            <p className="text-xs text-soft-slate">{view.description}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
