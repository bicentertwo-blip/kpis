import type { ProgressStatus } from '@/types/kpi'

export const resolveProgressStatus = (values: Record<string, unknown>): ProgressStatus => {
  if (!values) return 'not_started'
  const total = Object.keys(values).length
  const filled = Object.values(values).filter((value) => value !== undefined && value !== null && `${value}`.trim() !== '').length
  if (filled === 0) return 'not_started'
  if (filled < total) return 'in_progress'
  return 'complete'
}
