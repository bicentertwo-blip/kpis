/**
 * Servicio de Supabase para operaciones CRUD de KPIs
 * Maneja tanto datos de resumen como de detalle
 */

import { supabase } from '@/lib/supabase'
import type { KpiDefinition, DetailLayoutDefinition, SectionDefinition } from '@/types/kpi-definitions'

// Tipos genéricos para registros
export interface BaseRecord {
  id?: string
  owner_id: string
  anio: number
  mes: number
  created_at?: string
  updated_at?: string
}

export interface QueryFilters {
  anio?: number
  mes?: number
  entidad?: string
  plaza?: string
  region?: string
  limit?: number
  offset?: number
  orderBy?: string
  ascending?: boolean
}

export interface QueryResult<T> {
  data: T[] | null
  error: string | null
  count: number
}

// =====================================================
// FUNCIONES DE RESUMEN
// =====================================================

export const getSummaryRecords = async <T extends BaseRecord>(
  tableName: string,
  userId: string,
  filters?: QueryFilters
): Promise<QueryResult<T>> => {
  try {
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq('owner_id', userId)

    if (filters?.anio) query = query.eq('anio', filters.anio)
    if (filters?.mes) query = query.eq('mes', filters.mes)
    if (filters?.limit) query = query.limit(filters.limit)
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 10) - 1)
    
    const orderBy = filters?.orderBy ?? 'updated_at'
    query = query.order(orderBy, { ascending: filters?.ascending ?? false })

    const { data, error, count } = await query

    return {
      data: data as T[] | null,
      error: error?.message ?? null,
      count: count ?? 0,
    }
  } catch (err) {
    return { data: null, error: (err as Error).message, count: 0 }
  }
}

export const getSummaryRecord = async <T extends BaseRecord>(
  tableName: string,
  userId: string,
  anio: number,
  mes: number
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('owner_id', userId)
      .eq('anio', anio)
      .eq('mes', mes)
      .maybeSingle()

    return {
      data: data as T | null,
      error: error?.message ?? null,
    }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

export const upsertSummaryRecord = async <T extends BaseRecord>(
  tableName: string,
  record: Partial<T> & { owner_id: string }
): Promise<{ data: T | null; error: string | null }> => {
  try {
    // INSERT: Siempre insertar nuevo registro para mantener trazabilidad/versionamiento
    // El trigger set_is_current_resumen() en la BD marca automáticamente:
    // - El nuevo registro como is_current = true
    // - Los anteriores del mismo año/mes como is_current = false
    const payload = {
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_current: true,
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select()
      .single()

    return {
      data: data as T | null,
      error: error?.message ?? null,
    }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

export const deleteSummaryRecord = async (
  tableName: string,
  recordId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId)

    return {
      success: !error,
      error: error?.message ?? null,
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// FUNCIONES DE DETALLE
// =====================================================

export const getDetailRecords = async <T extends BaseRecord>(
  tableName: string,
  userId: string,
  filters?: QueryFilters
): Promise<QueryResult<T>> => {
  try {
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq('owner_id', userId)

    if (filters?.anio) query = query.eq('anio', filters.anio)
    if (filters?.mes) query = query.eq('mes', filters.mes)
    if (filters?.entidad) query = query.eq('entidad', filters.entidad)
    if (filters?.plaza) query = query.eq('plaza', filters.plaza)
    if (filters?.region) query = query.eq('region', filters.region)
    if (filters?.limit) query = query.limit(filters.limit)
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1)
    
    const orderBy = filters?.orderBy ?? 'created_at'
    query = query.order(orderBy, { ascending: filters?.ascending ?? false })

    const { data, error, count } = await query

    return {
      data: data as T[] | null,
      error: error?.message ?? null,
      count: count ?? 0,
    }
  } catch (err) {
    return { data: null, error: (err as Error).message, count: 0 }
  }
}

export const insertDetailRecords = async <T extends BaseRecord>(
  tableName: string,
  records: Array<Partial<T> & { owner_id: string }>
): Promise<{ success: number; failed: number; error: string | null }> => {
  try {
    const preparedRecords = records.map((record) => ({
      ...record,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from(tableName)
      .insert(preparedRecords)

    if (error) {
      return { success: 0, failed: records.length, error: error.message }
    }

    return { success: records.length, failed: 0, error: null }
  } catch (err) {
    return { success: 0, failed: records.length, error: (err as Error).message }
  }
}

export const deleteDetailRecords = async (
  tableName: string,
  userId: string,
  filters: { anio: number; mes: number }
): Promise<{ success: boolean; error: string | null; deletedCount?: number }> => {
  try {
    // Primero contar cuántos se van a eliminar
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('anio', filters.anio)
      .eq('mes', filters.mes)

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('owner_id', userId)
      .eq('anio', filters.anio)
      .eq('mes', filters.mes)

    return {
      success: !error,
      error: error?.message ?? null,
      deletedCount: count ?? 0,
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// FUNCIONES DE AGREGACIÓN
// =====================================================

export const getDetailSummary = async (
  tableName: string,
  userId: string,
  anio: number,
  mes: number
): Promise<{ count: number; error: string | null }> => {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('anio', anio)
      .eq('mes', mes)

    return {
      count: count ?? 0,
      error: error?.message ?? null,
    }
  } catch (err) {
    return { count: 0, error: (err as Error).message }
  }
}

export const getAvailablePeriods = async (
  tableName: string,
  userId: string
): Promise<{ periods: Array<{ anio: number; mes: number }>; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('anio, mes')
      .eq('owner_id', userId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })

    if (error) {
      return { periods: [], error: error.message }
    }

    // Eliminar duplicados
    const uniquePeriods = data?.reduce<Array<{ anio: number; mes: number }>>((acc, row) => {
      const exists = acc.some((p) => p.anio === row.anio && p.mes === row.mes)
      if (!exists) {
        acc.push({ anio: row.anio, mes: row.mes })
      }
      return acc
    }, []) ?? []

    return { periods: uniquePeriods, error: null }
  } catch (err) {
    return { periods: [], error: (err as Error).message }
  }
}

// =====================================================
// FUNCIONES DE UTILIDAD PARA KPIs
// =====================================================

export const getKpiSectionStatus = async (
  section: SectionDefinition,
  userId: string,
  anio: number,
  mes: number
): Promise<{ hasData: boolean; isComplete: boolean; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from(section.tableName)
      .select('*')
      .eq('owner_id', userId)
      .eq('anio', anio)
      .eq('mes', mes)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return { hasData: false, isComplete: false, error: error.message }
    }

    if (!data) {
      return { hasData: false, isComplete: false, error: null }
    }

    // Verificar si todos los campos requeridos tienen valor
    const requiredFields = section.fields.filter((f) => f.required)
    const isComplete = requiredFields.every((field) => {
      const value = data[field.id]
      return value !== null && value !== undefined && value !== ''
    })

    return { hasData: true, isComplete, error: null }
  } catch (err) {
    return { hasData: false, isComplete: false, error: (err as Error).message }
  }
}

export const getKpiDetailStatus = async (
  detail: DetailLayoutDefinition,
  userId: string,
  anio: number,
  mes: number
): Promise<{ recordCount: number; error: string | null }> => {
  const result = await getDetailSummary(detail.tableName, userId, anio, mes)
  return { recordCount: result.count, error: result.error }
}

export const getKpiOverallStatus = async (
  kpiConfig: KpiDefinition,
  userId: string,
  anio: number,
  mes: number
): Promise<{
  summaries: Array<{ id: string; hasData: boolean; isComplete: boolean }>
  details: Array<{ id: string; recordCount: number }>
  error: string | null
}> => {
  try {
    const summaryResults = await Promise.all(
      kpiConfig.summaries.map(async (section) => {
        const status = await getKpiSectionStatus(section, userId, anio, mes)
        return { id: section.id, ...status }
      })
    )

    const detailResults = await Promise.all(
      kpiConfig.details.map(async (detail) => {
        const status = await getKpiDetailStatus(detail, userId, anio, mes)
        return { id: detail.id, recordCount: status.recordCount }
      })
    )

    return {
      summaries: summaryResults.map(({ id, hasData, isComplete }) => ({ id, hasData, isComplete })),
      details: detailResults,
      error: null,
    }
  } catch (err) {
    return {
      summaries: [],
      details: [],
      error: (err as Error).message,
    }
  }
}
