/**
 * Hook para exportar layouts Excel (.xlsx)
 * Genera archivos Excel con formato corporativo para cada KPI
 */

import { useCallback, useState } from 'react'
import type { DetailLayoutDefinition } from '@/types/kpi-definitions'
import { generateExcelTemplate, downloadExcelFile } from '@/utils/excel'

interface UseKpiExporterReturn {
  exporting: boolean
  exportEmptyLayout: (layout: DetailLayoutDefinition) => Promise<void>
  exportWithSampleData: (layout: DetailLayoutDefinition) => Promise<void>
  exportMultipleLayouts: (layouts: DetailLayoutDefinition[]) => Promise<void>
}

export const useKpiExporter = (): UseKpiExporterReturn => {
  const [exporting, setExporting] = useState(false)

  const exportEmptyLayout = useCallback(async (layout: DetailLayoutDefinition) => {
    setExporting(true)
    try {
      const blob = await generateExcelTemplate(layout, false)
      const filename = `${layout.tableName}_plantilla.xlsx`
      downloadExcelFile(blob, filename)
    } finally {
      setExporting(false)
    }
  }, [])

  const exportWithSampleData = useCallback(async (layout: DetailLayoutDefinition) => {
    setExporting(true)
    try {
      const blob = await generateExcelTemplate(layout, true)
      const filename = `${layout.tableName}_ejemplo.xlsx`
      downloadExcelFile(blob, filename)
    } finally {
      setExporting(false)
    }
  }, [])

  const exportMultipleLayouts = useCallback(async (layouts: DetailLayoutDefinition[]) => {
    setExporting(true)
    try {
      for (const layout of layouts) {
        const blob = await generateExcelTemplate(layout, false)
        const filename = `${layout.tableName}_plantilla.xlsx`
        downloadExcelFile(blob, filename)
        // Pequeño delay entre descargas
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    } finally {
      setExporting(false)
    }
  }, [])

  return {
    exporting,
    exportEmptyLayout,
    exportWithSampleData,
    exportMultipleLayouts,
  }
}
