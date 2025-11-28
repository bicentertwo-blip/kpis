import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { KPI_TABLES, KPI_VIEW_MAP, AUTOSAVE_DEBOUNCE } from '@/utils/constants'
import { resolveProgressStatus } from '@/utils/progress'
import type { KpiRecord, KpiViewId } from '@/types/kpi'
import { useAuthStore } from '@/store/auth'
import { useProgressStore } from '@/store/progress'
import { generateEmptyLayout } from '@/utils/csv'

interface UseKpiDataState {
  record: KpiRecord | null
  formValues: Record<string, unknown>
  loading: boolean
  saving: boolean
  lastSavedAt?: string
  error?: string | null
}

export const useKpiData = (viewId: KpiViewId) => {
  const tableName = KPI_TABLES[viewId]
  const viewMeta = KPI_VIEW_MAP[viewId]
  if (!tableName) {
    throw new Error(`No supabase table configured for view ${viewId}`)
  }
  const userId = useAuthStore((state) => state.session?.user.id)
  const upsertStatus = useProgressStore((state) => state.upsertStatus)

  const [state, setState] = useState<UseKpiDataState>({
    record: null,
    formValues: {},
    loading: true,
    saving: false,
  })

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchRecord = useCallback(async () => {
    if (!userId) return
    setState((prev) => ({ ...prev, loading: true }))
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      return
    }

    const record = (data as KpiRecord | null) ?? null
    setState({
      record,
      formValues: record?.form_values ?? {},
      loading: false,
      saving: false,
      lastSavedAt: record?.updated_at,
      error: null,
    })
  }, [tableName, userId])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  useEffect(() => {
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
    }
  }, [])

  const persistDraft = useCallback(
    async (nextValues: Record<string, unknown>) => {
      if (!userId) return
      setState((prev) => ({ ...prev, saving: true }))
      const payload: KpiRecord = {
        id: state.record?.id,
        owner_id: userId,
        view_id: viewId,
        form_values: nextValues,
        status: resolveProgressStatus(nextValues),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: 'owner_id' })
        .select()
        .single()

      if (error) {
        setState((prev) => ({ ...prev, saving: false, error: error.message }))
        return
      }

      setState({
        record: data as KpiRecord,
        formValues: nextValues,
        loading: false,
        saving: false,
        lastSavedAt: payload.updated_at,
        error: null,
      })

      await upsertStatus({ userId, viewId, status: payload.status })
    },
    [state.record?.id, tableName, upsertStatus, userId, viewId]
  )

  const queueAutosave = useCallback(
    (draft: Record<string, unknown>) => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
      autosaveRef.current = setTimeout(() => {
        void persistDraft(draft)
      }, AUTOSAVE_DEBOUNCE)
    },
    [persistDraft]
  )

  const updateField = (fieldId: string, value: unknown) => {
    setState((prev) => {
      const nextValues = { ...prev.formValues, [fieldId]: value }
      queueAutosave(nextValues)
      return { ...prev, formValues: nextValues }
    })
  }

  const replaceForm = (values: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, formValues: values }))
    queueAutosave(values)
  }

  const exportTemplate = () => {
    generateEmptyLayout(viewMeta.fields, viewMeta.id)
  }

  const status = useMemo(() => resolveProgressStatus(state.formValues), [state.formValues])

  return {
    ...state,
    viewMeta,
    status,
    updateField,
    replaceForm,
    refetch: fetchRecord,
    exportTemplate,
  }
}
