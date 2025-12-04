/**
 * Store para los datos del dashboard de KPIs
 * Permite compartir el estado de los KPIs entre el dashboard y el sidebar
 */

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { 
  KPI_DASHBOARD_METRICS, 
  getStatusColor, 
  type StatusColor 
} from '@/config/kpi-dashboard-config'
import type { KpiViewId } from '@/types/kpi'

interface KpiStatus {
  status: StatusColor
  hasData: boolean
  actualValue: number | null
  metaValue: number | null
  progressPercent: number
}

interface DashboardKpisState {
  kpiStatuses: Record<string, KpiStatus>
  loading: boolean
  error: string | null
  year: number
  fetchKpiStatuses: () => Promise<void>
  getStatus: (kpiId: KpiViewId) => StatusColor
}

type SummaryRecord = Record<string, unknown>

export const useDashboardKpisStore = create<DashboardKpisState>((set, get) => ({
  kpiStatuses: {},
  loading: false,
  error: null,
  year: new Date().getFullYear(),

  fetchKpiStatuses: async () => {
    const currentYear = new Date().getFullYear()
    set({ loading: true, error: null, year: currentYear })

    try {
      // Cargar datos de todas las tablas en paralelo
      const promises = KPI_DASHBOARD_METRICS.map(async (metric) => {
        try {
          const { data, error: queryError } = await supabase
            .from(metric.tableName)
            .select('*')
            .eq('is_current', true)
            .eq('anio', currentYear)
            .order('mes', { ascending: true })

          if (queryError) {
            console.warn(`Error loading ${metric.tableName}:`, queryError)
            return { id: metric.id, data: [] }
          }

          return { id: metric.id, data: data || [] }
        } catch (err) {
          console.warn(`Exception loading ${metric.tableName}:`, err)
          return { id: metric.id, data: [] }
        }
      })

      const results = await Promise.all(promises)
      
      const statuses: Record<string, KpiStatus> = {}
      
      results.forEach(({ id, data }) => {
        const metric = KPI_DASHBOARD_METRICS.find(m => m.id === id)
        if (!metric) return

        const records = data as SummaryRecord[]
        
        if (records.length === 0) {
          statuses[id] = {
            status: 'gray',
            hasData: false,
            actualValue: null,
            metaValue: null,
            progressPercent: 0,
          }
          return
        }

        // Calcular valores según el tipo de agregación
        let actualValue: number | null = null
        let metaValue: number | null = null

        if (metric.aggregationType === 'sum') {
          let sumActual = 0
          let sumMeta = 0
          let hasActual = false
          let hasMeta = false

          records.forEach((record) => {
            const actual = Number(record[metric.metricKey])
            const meta = Number(record[metric.metaKey])
            
            if (!isNaN(actual) && actual !== null) {
              sumActual += actual
              hasActual = true
            }
            if (!isNaN(meta) && meta !== null) {
              sumMeta += meta
              hasMeta = true
            }
          })

          actualValue = hasActual ? sumActual : null
          metaValue = hasMeta ? sumMeta : null
        } else {
          let sumActual = 0
          let sumMeta = 0
          let countActual = 0
          let countMeta = 0

          records.forEach((record) => {
            const actual = Number(record[metric.metricKey])
            const meta = Number(record[metric.metaKey])
            
            if (!isNaN(actual) && actual !== null && record[metric.metricKey] !== null) {
              sumActual += actual
              countActual++
            }
            if (!isNaN(meta) && meta !== null && record[metric.metaKey] !== null) {
              sumMeta += meta
              countMeta++
            }
          })

          actualValue = countActual > 0 ? sumActual / countActual : null
          metaValue = countMeta > 0 ? sumMeta / countMeta : null
        }

        // Calcular porcentaje de progreso
        let progressPercent = 0
        if (actualValue !== null && metaValue !== null && metaValue !== 0) {
          if (metric.higherIsBetter) {
            progressPercent = Math.min((actualValue / metaValue) * 100, 150)
          } else {
            progressPercent = Math.min((metaValue / actualValue) * 100, 150)
          }
        }

        // Determinar color del semáforo
        const status = getStatusColor(actualValue, metaValue, metric.higherIsBetter)

        statuses[id] = {
          status,
          hasData: actualValue !== null,
          actualValue,
          metaValue,
          progressPercent,
        }
      })

      set({ kpiStatuses: statuses, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  getStatus: (kpiId: KpiViewId): StatusColor => {
    const { kpiStatuses } = get()
    return kpiStatuses[kpiId]?.status || 'gray'
  },
}))
