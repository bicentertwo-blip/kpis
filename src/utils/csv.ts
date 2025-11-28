import Papa from 'papaparse'
import type { ImportResult, KpiField } from '@/types/kpi'

export const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.setAttribute('download', filename)
  anchor.click()
  URL.revokeObjectURL(url)
}

export const generateEmptyLayout = (fields: KpiField[], name: string) => {
  const header = fields.map((field) => field.id)
  const csv = Papa.unparse({ fields: header, data: [] })
  downloadCsv(csv, `${name}-layout.csv`)
}

export const parseCsvFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: 'greedy',
      complete: (result) => {
        resolve({ rows: result.data ?? [], errors: result.errors?.map((e) => e.message) ?? [] })
      },
    })
  })
}
