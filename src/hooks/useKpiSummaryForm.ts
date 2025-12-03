/**
 * Hook para manejar formularios de resumen de KPIs
 * Incluye validación y persistencia en Supabase
 * MODO MANUAL: El usuario debe hacer clic en "Guardar" para persistir
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
  saveSuccess: boolean
}

interface UseKpiSummaryFormReturn extends UseKpiSummaryFormState {
  updateField: (fieldId: string, value: unknown) => void
  replaceForm: (values: Record<string, unknown>) => void
  saveAndClear: () => Promise<boolean>
  saveNow: () => Promise<boolean>
  resetForm: () => void
  getFieldValue: <T>(fieldId: string, defaultValue?: T) => T
  isFieldValid: (field: FieldDefinition) => boolean
  getFormProgress: () => { filled: number; total: number; percentage: number }
  canSave: boolean
}

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
    saveSuccess: false,
  })

  const initialLoadRef = useRef(false)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Cargar datos iniciales (formulario inicia vacío para insertar)
  const fetchRecord = useCallback(async () => {
    if (!userId) return

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      setState({
        record: null,
        formValues: getInitialValues(),
        loading: false,
        saving: false,
        error: null,
        isDirty: false,
        saveSuccess: false,
      })
      
      initialLoadRef.current = true
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
        saveSuccess: false,
      }))
    }
  }, [userId, getInitialValues])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [])

  // Persistir datos en la base de datos (INSERT para trazabilidad)
  // El trigger en la BD marca automáticamente is_current = true para el nuevo
  // y is_current = false para los anteriores del mismo periodo
  const persistData = useCallback(
    async (nextValues: Record<string, unknown>): Promise<boolean> => {
      if (!userId) return false

      setState((prev) => ({ ...prev, saving: true, error: null, saveSuccess: false }))

      try {
        const payload: Record<string, unknown> = {
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_current: true, // Siempre true para nuevos registros
        }

        // Agregar todos los valores del formulario
        section.fields.forEach((field) => {
          const value = nextValues[field.id]
          
          // Convertir valores según el tipo
          if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage') {
            payload[field.id] = value === '' || value === null || value === undefined 
              ? null 
              : parseFloat(String(value).replace(/[$%,]/g, ''))
          } else if (field.type === 'select') {
            payload[field.id] = value === '' ? null : parseInt(String(value))
          } else {
            payload[field.id] = value ?? null
          }
        })

        // INSERT: Siempre insertar nuevo registro para mantener trazabilidad
        // El trigger set_is_current_resumen() en la BD marca automáticamente
        // los registros anteriores del mismo año/mes como is_current = false
        const { error } = await supabase
          .from(section.tableName)
          .insert(payload)

        if (error) {
          setState((prev) => ({ ...prev, saving: false, error: error.message, saveSuccess: false }))
          return false
        }

        setState((prev) => ({
          ...prev,
          saving: false,
          lastSavedAt: payload.updated_at as string,
          error: null,
          isDirty: false,
          saveSuccess: true,
        }))

        // Resetear el flag de éxito después de 3 segundos
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, saveSuccess: false }))
        }, 3000)

        return true
      } catch (err) {
        setState((prev) => ({
          ...prev,
          saving: false,
          error: (err as Error).message,
          saveSuccess: false,
        }))
        return false
      }
    },
    [section.tableName, section.fields, userId]
  )

  // Actualizar un campo (sin autosave)
  const updateField = useCallback((fieldId: string, value: unknown) => {
    setState((prev) => {
      const nextValues = { ...prev.formValues, [fieldId]: value }
      return { ...prev, formValues: nextValues, isDirty: true, saveSuccess: false }
    })
  }, [])

  // Reemplazar todo el formulario (sin autosave)
  const replaceForm = useCallback((values: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, formValues: values, isDirty: true, saveSuccess: false }))
  }, [])

  // Guardar y limpiar formulario
  const saveAndClear = useCallback(async (): Promise<boolean> => {
    const success = await persistData(state.formValues)
    if (success) {
      // Limpiar formulario manteniendo año y mes
      setState((prev) => ({
        ...prev,
        formValues: getInitialValues(),
        record: null,
        isDirty: false,
      }))
    }
    return success
  }, [persistData, state.formValues, getInitialValues])

  // Guardar sin limpiar
  const saveNow = useCallback(async (): Promise<boolean> => {
    return await persistData(state.formValues)
  }, [persistData, state.formValues])

  // Resetear formulario
  const resetForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      formValues: getInitialValues(),
      isDirty: false,
      saveSuccess: false,
      error: null,
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

  // Verificar si se puede guardar (todos los campos requeridos llenos)
  const canSave = useMemo(() => {
    const requiredFields = section.fields.filter((f) => f.required)
    return requiredFields.every((field) => {
      const value = state.formValues[field.id]
      return value !== undefined && value !== null && value !== ''
    })
  }, [section.fields, state.formValues])

  return {
    ...state,
    updateField,
    replaceForm,
    saveAndClear,
    saveNow,
    resetForm,
    getFieldValue,
    isFieldValid,
    getFormProgress,
    canSave,
  }
}
