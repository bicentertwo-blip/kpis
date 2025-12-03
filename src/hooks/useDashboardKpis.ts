/**
 * Hook para cargar datos del Dashboard de KPIs
 * Calcula el progreso acumulado vs metas acumuladas del año actual
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  KPI_DASHBOARD_METRICS, 
  getStatusColor, 
  type KpiDashboardMetric,
  type StatusColor 
} from '@/config/kpi-dashboard-config'

interface KpiProgressData {
  id: string
  name: string
  shortName: string
  icon: string
  route: string
  format: 'currency' | 'percentage' | 'number'
  actualValue: number | null
  metaValue: number | null
  progressPercent: number
  status: StatusColor
  hasData: boolean
  monthsWithData: number
}

interface UseDashboardKpisReturn {
  kpis: KpiProgressData[]
  loading: boolean
  error: string | null
  refresh: () => void
  year: number
}

type SummaryRecord = Record<string, unknown>

export function useDashboardKpis(): UseDashboardKpisReturn {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<Record<string, SummaryRecord[]>>({})
  
  const currentYear = new Date().getFullYear()

  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)

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
      
      const dataMap: Record<string, SummaryRecord[]> = {}
      results.forEach(({ id, data }) => {
        dataMap[id] = data as SummaryRecord[]
      })

      setRawData(dataMap)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [currentYear])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Procesar datos y calcular progreso
  const kpis = useMemo((): KpiProgressData[] => {
    return KPI_DASHBOARD_METRICS.map((metric: KpiDashboardMetric) => {
      const data = rawData[metric.id] || []
      
      if (data.length === 0) {
        return {
          id: metric.id,
          name: metric.name,
          shortName: metric.shortName,
          icon: metric.icon,
          route: metric.route,
          format: metric.format,
          actualValue: null,
          metaValue: null,
          progressPercent: 0,
          status: 'gray' as StatusColor,
          hasData: false,
          monthsWithData: 0,
        }
      }

      // Calcular valores según el tipo de agregación
      let actualValue: number | null = null
      let metaValue: number | null = null
      let monthsWithData = 0

      if (metric.aggregationType === 'sum') {
        // Sumar todos los valores del año
        let sumActual = 0
        let sumMeta = 0
        let hasActual = false
        let hasMeta = false

        data.forEach((record) => {
          const actual = Number(record[metric.metricKey])
          const meta = Number(record[metric.metaKey])
          
          if (!isNaN(actual) && actual !== null) {
            sumActual += actual
            hasActual = true
            monthsWithData++
          }
          if (!isNaN(meta) && meta !== null) {
            sumMeta += meta
            hasMeta = true
          }
        })

        actualValue = hasActual ? sumActual : null
        metaValue = hasMeta ? sumMeta : null
      } else {
        // Promediar todos los valores del año
        let sumActual = 0
        let sumMeta = 0
        let countActual = 0
        let countMeta = 0

        data.forEach((record) => {
          const actual = Number(record[metric.metricKey])
          const meta = Number(record[metric.metaKey])
          
          if (!isNaN(actual) && actual !== null && record[metric.metricKey] !== null) {
            sumActual += actual
            countActual++
            monthsWithData++
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
          // Para métricas donde menos es mejor, invertir la lógica
          progressPercent = Math.min((metaValue / actualValue) * 100, 150)
        }
      }

      // Determinar color del semáforo
      const status = getStatusColor(actualValue, metaValue, metric.higherIsBetter)

      return {
        id: metric.id,
        name: metric.name,
        shortName: metric.shortName,
        icon: metric.icon,
        route: metric.route,
        format: metric.format,
        actualValue,
        metaValue,
        progressPercent,
        status,
        hasData: actualValue !== null,
        monthsWithData,
      }
    })
  }, [rawData])

  return {
    kpis,
    loading,
    error,
    refresh: loadAllData,
    year: currentYear,
  }
}
