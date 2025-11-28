/**
 * Hook para exportar layouts CSV vacíos
 * Genera archivos CSV con los encabezados correctos para cada KPI
 */

import { useCallback } from 'react'
import Papa from 'papaparse'
import type { DetailLayoutDefinition } from '@/types/kpi-definitions'

interface UseKpiExporterReturn {
  exportEmptyLayout: (layout: DetailLayoutDefinition) => void
  exportWithSampleData: (layout: DetailLayoutDefinition, sampleRows?: number) => void
  exportMultipleLayouts: (layouts: DetailLayoutDefinition[]) => void
}

export const useKpiExporter = (): UseKpiExporterReturn => {
  const downloadCsv = useCallback((content: string, filename: string) => {
    // BOM para UTF-8 (importante para Excel)
    const bom = '\uFEFF'
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.setAttribute('download', filename)
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [])

  const generateSampleValue = useCallback((column: string): string | number => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    // Valores de ejemplo basados en el nombre de la columna
    const sampleValues: Record<string, string | number> = {
      anio: currentYear,
      mes: currentMonth,
      entidad: 'SOFOM Principal',
      region: 'Centro',
      plaza: 'CDMX Norte',
      producto: 'Crédito Personal',
      concepto: 'Intereses',
      categoria: 'General',
      puesto: 'Asesor de Crédito',
      comite: 'Comité de Riesgos',
      proyecto: 'Digitalización Procesos',
      etapa: 'Implementación',
      tipo: 'Operativo',
      descripcion: 'Descripción del registro',
      responsable: 'Juan Pérez',
      riesgo: 'Medio',
      meta: 100,
      valor: 50000,
      monto: 100000,
      monto_colocacion: 15000000,
      cartera_total: 50000000,
      cartera_vencida: 1500000,
      cartera_inicial: 48000000,
      cartera_final: 52000000,
      imor: 3.0,
      indice_renovacion: 32.5,
      total: 1000,
      renovaciones: 325,
      nuevas: 150,
      capital_contable: 25000000,
      utilidad_operativa_mensual: 2500000,
      activo_total: 100000000,
      ebitda: 8500000,
      flujo_libre: 3200000,
      flujo_operativo: 5800000,
      gasto_por_credito: 1250,
      hc: 50,
      ingresos: 8,
      bajas: 3,
      dias_sin_cubrir: 15,
      ausentismo: 2.3,
      permanencia_12m: 85,
      procesos_digitalizados: 68,
      transacciones_automaticas: 75,
      cost_to_serve: 125,
      recordacion_marca: 18,
      alcance_campanas: 500000,
      nps: 45,
      quejas_72h: 92,
      clima_laboral: 78,
      reportes_a_tiempo: 98,
      observaciones_cnbv_condusef: 0,
      riesgos_activos: 12,
      riesgos_mitigados: 8,
      exposicion: 15,
      incidentes_criticos: 1,
      riesgos_nuevos: 2,
      cumplimiento_planes: 90,
      reuniones_consejo: 2,
      acuerdos_cumplidos: 95,
      actualizaciones_politica: 3,
      sesiones: 4,
      acuerdos_por_area: 12,
      kpis_reportados: 8,
      seguimiento_politicas: 95,
      indicador_implementacion: 75,
      estimacion_ahorro: 500000,
      crecimiento: 10,
    }

    return sampleValues[column] ?? ''
  }, [])

  const exportEmptyLayout = useCallback((layout: DetailLayoutDefinition) => {
    const csv = Papa.unparse({
      fields: layout.columns,
      data: [],
    })
    const filename = `${layout.tableName}_layout.csv`
    downloadCsv(csv, filename)
  }, [downloadCsv])

  const exportWithSampleData = useCallback((layout: DetailLayoutDefinition, sampleRows = 3) => {
    const data: Record<string, string | number>[] = []
    
    for (let i = 0; i < sampleRows; i++) {
      const row: Record<string, string | number> = {}
      layout.columns.forEach((column) => {
        row[column] = generateSampleValue(column)
      })
      // Variar el mes para mostrar diferentes períodos
      if ('mes' in row) {
        row.mes = Math.max(1, ((row.mes as number) - i) || 1)
      }
      data.push(row)
    }

    const csv = Papa.unparse({
      fields: layout.columns,
      data,
    })
    const filename = `${layout.tableName}_ejemplo.csv`
    downloadCsv(csv, filename)
  }, [downloadCsv, generateSampleValue])

  const exportMultipleLayouts = useCallback((layouts: DetailLayoutDefinition[]) => {
    layouts.forEach((layout, index) => {
      // Delay para evitar bloqueos del navegador
      setTimeout(() => {
        exportEmptyLayout(layout)
      }, index * 100)
    })
  }, [exportEmptyLayout])

  return {
    exportEmptyLayout,
    exportWithSampleData,
    exportMultipleLayouts,
  }
}
