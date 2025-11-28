/**
 * Hook para importar CSV con validación robusta
 * Soporta múltiples formatos y valida estructura de datos
 */

import { useCallback, useState } from 'react'
import Papa from 'papaparse'
import type { DetailLayoutDefinition, ImportValidationResult, ImportProgress } from '@/types/kpi-definitions'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

interface UseKpiImporterReturn {
  importing: boolean
  progress: ImportProgress | null
  validationResult: ImportValidationResult | null
  validateFile: (file: File, layout: DetailLayoutDefinition) => Promise<ImportValidationResult>
  importFile: (file: File, layout: DetailLayoutDefinition) => Promise<{ success: boolean; message: string }>
  reset: () => void
}

interface ParsedRow {
  [key: string]: string | number | null
}

export const useKpiImporter = (): UseKpiImporterReturn => {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  
  const userId = useAuthStore((state) => state.session?.user.id)

  const parseFile = useCallback((file: File): Promise<{ data: ParsedRow[]; errors: string[] }> => {
    return new Promise((resolve) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (result) => {
          const errors = result.errors?.map((e) => `Fila ${e.row}: ${e.message}`) ?? []
          resolve({ data: result.data ?? [], errors })
        },
        error: (error) => {
          resolve({ data: [], errors: [error.message] })
        },
      })
    })
  }, [])

  const normalizeValue = useCallback((value: string | undefined, column: string): string | number | null => {
    if (value === undefined || value === null || value === '') {
      return null
    }

    const trimmed = value.toString().trim()
    
    // Columnas numéricas conocidas
    const numericColumns = [
      'anio', 'mes', 'meta', 'valor', 'monto', 'total', 'renovaciones', 'nuevas',
      'indice_renovacion', 'capital_contable', 'utilidad_operativa_mensual', 'activo_total',
      'roe', 'roa', 'meta_roe', 'meta_roa', 'monto_colocacion', 'imor', 'cartera_inicial',
      'cartera_final', 'crecimiento', 'cartera_total', 'cartera_vencida', 'ebitda',
      'flujo_libre', 'flujo_operativo', 'gasto_por_credito', 'hc', 'ingresos', 'bajas',
      'dias_sin_cubrir', 'ausentismo', 'permanencia_12m', 'procesos_digitalizados',
      'transacciones_automaticas', 'cost_to_serve', 'recordacion_marca', 'alcance_campanas',
      'nps', 'quejas_72h', 'clima_laboral', 'reportes_a_tiempo', 'observaciones_cnbv_condusef',
      'riesgos_activos', 'riesgos_mitigados', 'exposicion', 'incidentes_criticos',
      'riesgos_nuevos', 'cumplimiento_planes', 'reuniones_consejo', 'acuerdos_cumplidos',
      'actualizaciones_politica', 'sesiones', 'acuerdos_por_area', 'kpis_reportados',
      'seguimiento_politicas', 'indicador_implementacion', 'estimacion_ahorro',
    ]

    if (numericColumns.includes(column)) {
      // Limpiar formato de moneda y porcentajes
      const cleaned = trimmed
        .replace(/[$%,]/g, '')
        .replace(/\s/g, '')
      
      const num = parseFloat(cleaned)
      return isNaN(num) ? null : num
    }

    return trimmed
  }, [])

  const validateFile = useCallback(async (file: File, layout: DetailLayoutDefinition): Promise<ImportValidationResult> => {
    const { data, errors: parseErrors } = await parseFile(file)
    
    const result: ImportValidationResult = {
      valid: true,
      errors: [...parseErrors],
      warnings: [],
      rowCount: data.length,
    }

    if (data.length === 0) {
      result.valid = false
      result.errors.push('El archivo no contiene datos')
      setValidationResult(result)
      return result
    }

    // Verificar columnas requeridas
    const firstRow = data[0]
    const fileColumns = Object.keys(firstRow).map(c => c.toLowerCase())
    const requiredColumns = layout.columns.map(c => c.toLowerCase())

    const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col))
    if (missingColumns.length > 0) {
      result.valid = false
      result.errors.push(`Columnas faltantes: ${missingColumns.join(', ')}`)
    }

    const extraColumns = fileColumns.filter(col => !requiredColumns.includes(col))
    if (extraColumns.length > 0) {
      result.warnings.push(`Columnas adicionales ignoradas: ${extraColumns.join(', ')}`)
    }

    // Validar datos de cada fila
    data.forEach((row, index) => {
      const rowNum = index + 2 // +2 por header y 0-index

      // Validar año
      if (row.anio !== undefined) {
        const anio = parseInt(row.anio?.toString() ?? '')
        if (isNaN(anio) || anio < 2020 || anio > 2050) {
          result.errors.push(`Fila ${rowNum}: Año inválido "${row.anio}"`)
          result.valid = false
        }
      }

      // Validar mes
      if (row.mes !== undefined) {
        const mes = parseInt(row.mes?.toString() ?? '')
        if (isNaN(mes) || mes < 1 || mes > 12) {
          result.errors.push(`Fila ${rowNum}: Mes inválido "${row.mes}"`)
          result.valid = false
        }
      }

      // Validar campos requeridos no vacíos
      requiredColumns.forEach(col => {
        const value = row[col]
        if (value === undefined || value === null || value === '') {
          if (col !== 'meta') { // Meta puede ser opcional en algunos casos
            result.warnings.push(`Fila ${rowNum}: Campo "${col}" vacío`)
          }
        }
      })
    })

    // Limitar cantidad de errores mostrados
    if (result.errors.length > 10) {
      const total = result.errors.length
      result.errors = result.errors.slice(0, 10)
      result.errors.push(`... y ${total - 10} errores más`)
    }

    setValidationResult(result)
    return result
  }, [parseFile])

  const importFile = useCallback(async (
    file: File, 
    layout: DetailLayoutDefinition
  ): Promise<{ success: boolean; message: string }> => {
    if (!userId) {
      return { success: false, message: 'Usuario no autenticado' }
    }

    setImporting(true)
    setProgress({ total: 0, processed: 0, success: 0, failed: 0, errors: [] })

    try {
      // Validar primero
      const validation = await validateFile(file, layout)
      if (!validation.valid) {
        setImporting(false)
        return { 
          success: false, 
          message: `Validación fallida: ${validation.errors.slice(0, 3).join('; ')}` 
        }
      }

      const { data } = await parseFile(file)
      
      setProgress(prev => prev ? { ...prev, total: data.length } : null)

      // Preparar registros para inserción
      const records: Record<string, string | number | null>[] = []
      const errors: Array<{ row: number; message: string }> = []

      data.forEach((row, index) => {
        try {
          const record: Record<string, string | number | null> = {
            owner_id: userId,
            created_at: new Date().toISOString(),
          }

          layout.columns.forEach(column => {
            const rawValue = row[column] ?? row[column.toLowerCase()]
            record[column] = normalizeValue(rawValue?.toString(), column)
          })

          records.push(record)
        } catch (err) {
          errors.push({ row: index + 2, message: (err as Error).message })
        }
      })

      if (records.length === 0) {
        setImporting(false)
        return { success: false, message: 'No hay registros válidos para importar' }
      }

      // Insertar en lotes de 100
      const batchSize = 100
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from(layout.tableName)
          .insert(batch)

        if (error) {
          failedCount += batch.length
          errors.push({ row: i + 2, message: error.message })
        } else {
          successCount += batch.length
        }

        setProgress({
          total: records.length,
          processed: Math.min(i + batchSize, records.length),
          success: successCount,
          failed: failedCount,
          errors,
        })
      }

      setImporting(false)

      if (failedCount === 0) {
        return { 
          success: true, 
          message: `${successCount} registros importados exitosamente` 
        }
      } else if (successCount > 0) {
        return { 
          success: true, 
          message: `${successCount} registros importados, ${failedCount} fallaron` 
        }
      } else {
        return { 
          success: false, 
          message: `Error al importar: ${errors[0]?.message ?? 'Error desconocido'}` 
        }
      }
    } catch (err) {
      setImporting(false)
      return { success: false, message: (err as Error).message }
    }
  }, [userId, validateFile, parseFile, normalizeValue])

  const reset = useCallback(() => {
    setImporting(false)
    setProgress(null)
    setValidationResult(null)
  }, [])

  return {
    importing,
    progress,
    validationResult,
    validateFile,
    importFile,
    reset,
  }
}
