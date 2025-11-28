/**
 * Hook para manejar formularios de resumen de KPIs
 * Incluye autosave, validación y persistencia en Supabase
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import type { SectionDefinition, FieldDefinition } from '@/types/kpi-definitions'

interface SummaryRecord {
  id?: string
  owner_id: string
  [key: string]: unknown
}

interface UseKpiSummaryFormState {
  record: SummaryRecord | null
  formValues: Record<string, unknown>
  loading: boolean
  saving: boolean
  lastSavedAt?: string
  error?: string | null
  isDirty: boolean
}

interface UseKpiSummaryFormReturn extends UseKpiSummaryFormState {
  updateField: (fieldId: string, value: unknown) => void
  replaceForm: (values: Record<string, unknown>) => void
  saveNow: () => Promise<void>
  resetForm: () => void
  getFieldValue: <T>(fieldId: string, defaultValue?: T) => T
  isFieldValid: (field: FieldDefinition) => boolean
  getFormProgress: () => { filled: number; total: number; percentage: number }
}

const AUTOSAVE_DEBOUNCE = 1500

export const useKpiSummaryForm = (
  section: SectionDefinition,
  filters?: { anio?: number; mes?: number }
): UseKpiSummaryFormReturn => {
  const userId = useAuthStore((state) => state.session?.user.id)
  
  const [state, setState] = useState<UseKpiSummaryFormState>({
    record: null,
    formValues: {},
    loading: true,
    saving: false,
    error: null,
    isDirty: false,
  })

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(false)

  // Generar valores iniciales basados en los campos
  const getInitialValues = useCallback((): Record<string, unknown> => {
    const values: Record<string, unknown> = {}
    const now = new Date()
    
    section.fields.forEach((field) => {
      if (field.id === 'anio') {
        values[field.id] = filters?.anio ?? now.getFullYear()
      } else if (field.id === 'mes') {
        values[field.id] = filters?.mes ?? (now.getMonth() + 1).toString()
      } else {
        values[field.id] = ''
      }
    })
    
    return values
  }, [section.fields, filters])

  // Cargar registro existente
  const fetchRecord = useCallback(async () => {
    if (!userId) return

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      let query = supabase
        .from(section.tableName)
        .select('*')
        .eq('owner_id', userId)

      // Filtrar por año/mes si se proporcionan
      if (filters?.anio) {
        query = query.eq('anio', filters.anio)
      }
      if (filters?.mes) {
        query = query.eq('mes', parseInt(filters.mes.toString()))
      }

      const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle()

      if (error && error.code !== 'PGRST116') {
        setState((prev) => ({ ...prev, loading: false, error: error.message }))
        return
      }

      const record = data as SummaryRecord | null
      
      if (record) {
        // Mapear valores del registro a los campos del formulario
        const formValues: Record<string, unknown> = {}
        section.fields.forEach((field) => {
          formValues[field.id] = record[field.id] ?? ''
        })
        
        setState({
          record,
          formValues,
          loading: false,
          saving: false,
          lastSavedAt: record.updated_at as string | undefined,
          error: null,
          isDirty: false,
        })
      } else {
        // No hay registro, usar valores iniciales
        setState({
          record: null,
          formValues: getInitialValues(),
          loading: false,
          saving: false,
          error: null,
          isDirty: false,
        })
      }
      
      initialLoadRef.current = true
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }))
    }
  }, [section.tableName, section.fields, userId, filters, getInitialValues])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  useEffect(() => {
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
    }
  }, [])

  // Persistir borrador
  const persistDraft = useCallback(
    async (nextValues: Record<string, unknown>) => {
      if (!userId) return

      setState((prev) => ({ ...prev, saving: true }))

      try {
        const payload: Record<string, unknown> = {
          owner_id: userId,
          updated_at: new Date().toISOString(),
        }

        // Agregar todos los valores del formulario
        section.fields.forEach((field) => {
          const value = nextValues[field.id]
          
          // Convertir valores según el tipo
          if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage') {
            payload[field.id] = value === '' || value === null || value === undefined 
              ? null 
              : parseFloat(value.toString().replace(/[$%,]/g, ''))
          } else if (field.type === 'select') {
            payload[field.id] = value === '' ? null : value
          } else {
            payload[field.id] = value ?? null
          }
        })

        // Si ya existe un registro, incluir el ID
        if (state.record?.id) {
          payload.id = state.record.id
        }

        const { data, error } = await supabase
          .from(section.tableName)
          .upsert(payload, { 
            onConflict: state.record?.id ? 'id' : 'owner_id,anio,mes',
          })
          .select()
          .single()

        if (error) {
          setState((prev) => ({ ...prev, saving: false, error: error.message }))
          return
        }

        setState((prev) => ({
          ...prev,
          record: data as SummaryRecord,
          saving: false,
          lastSavedAt: payload.updated_at as string,
          error: null,
          isDirty: false,
        }))
      } catch (err) {
        setState((prev) => ({
          ...prev,
          saving: false,
          error: (err as Error).message,
        }))
      }
    },
    [state.record?.id, section.tableName, section.fields, userId]
  )

  // Queue autosave
  const queueAutosave = useCallback(
    (draft: Record<string, unknown>) => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
      autosaveRef.current = setTimeout(() => {
        void persistDraft(draft)
      }, AUTOSAVE_DEBOUNCE)
    },
    [persistDraft]
  )

  // Actualizar un campo
  const updateField = useCallback((fieldId: string, value: unknown) => {
    setState((prev) => {
      const nextValues = { ...prev.formValues, [fieldId]: value }
      queueAutosave(nextValues)
      return { ...prev, formValues: nextValues, isDirty: true }
    })
  }, [queueAutosave])

  // Reemplazar todo el formulario
  const replaceForm = useCallback((values: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, formValues: values, isDirty: true }))
    queueAutosave(values)
  }, [queueAutosave])

  // Guardar inmediatamente
  const saveNow = useCallback(async () => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    await persistDraft(state.formValues)
  }, [persistDraft, state.formValues])

  // Resetear formulario
  const resetForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      formValues: getInitialValues(),
      isDirty: false,
    }))
  }, [getInitialValues])

  // Obtener valor de campo tipado
  const getFieldValue = useCallback(<T,>(fieldId: string, defaultValue?: T): T => {
    const value = state.formValues[fieldId]
    if (value === undefined || value === null || value === '') {
      return defaultValue as T
    }
    return value as T
  }, [state.formValues])

  // Validar campo
  const isFieldValid = useCallback((field: FieldDefinition): boolean => {
    const value = state.formValues[field.id]
    
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        return false
      }
    }

    if (value !== undefined && value !== null && value !== '') {
      if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage') {
        const num = parseFloat(value.toString())
        if (isNaN(num)) return false
        if (field.min !== undefined && num < field.min) return false
        if (field.max !== undefined && num > field.max) return false
      }
    }

    return true
  }, [state.formValues])

  // Calcular progreso del formulario
  const getFormProgress = useMemo(() => {
    return () => {
      const requiredFields = section.fields.filter((f) => f.required)
      const filledFields = requiredFields.filter((f) => {
        const value = state.formValues[f.id]
        return value !== undefined && value !== null && value !== ''
      })

      return {
        filled: filledFields.length,
        total: requiredFields.length,
        percentage: requiredFields.length > 0 
          ? Math.round((filledFields.length / requiredFields.length) * 100)
          : 100,
      }
    }
  }, [section.fields, state.formValues])

  return {
    ...state,
    updateField,
    replaceForm,
    saveNow,
    resetForm,
    getFieldValue,
    isFieldValid,
    getFormProgress,
  }
}
