import { useRef, type ChangeEvent } from 'react'
import { UploadCloud, Download } from 'lucide-react'
import { Button } from '@/components/base/Button'
import { parseCsvFile } from '@/utils/csv'

interface ImportExportPanelProps {
  onImport: (rows: Record<string, string>[]) => Promise<void> | void
  onExportTemplate: () => void
  disabled?: boolean
}

export const ImportExportPanel = ({ onImport, onExportTemplate, disabled }: ImportExportPanelProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const { rows } = await parseCsvFile(file)
    await onImport(rows)
    event.target.value = ''
  }

  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 rounded-3xl p-4">
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={disabled} />
      <Button
        type="button"
        variant="glass"
        icon={<UploadCloud className="size-4" />}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Importar layout CSV
      </Button>
      <Button type="button" variant="ghost" icon={<Download className="size-4" />} onClick={onExportTemplate} disabled={disabled}>
        Descargar layout vacío
      </Button>
    </div>
  )
}
