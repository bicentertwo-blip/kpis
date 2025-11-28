import { useRef, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, Download, FileSpreadsheet } from 'lucide-react'
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-plasma-blue/10 text-plasma-blue">
          <FileSpreadsheet className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-vision-ink">Importar / Exportar</p>
          <p className="text-xs text-soft-slate">Gestiona datos con CSV</p>
        </div>
      </div>
      
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={disabled} />
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          type="button"
          variant="glass"
          size="sm"
          fullWidth
          icon={<UploadCloud className="size-4" />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Importar CSV
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth
          icon={<Download className="size-4" />}
          onClick={onExportTemplate}
          disabled={disabled}
        >
          Descargar layout
        </Button>
      </div>
    </motion.div>
  )
}
