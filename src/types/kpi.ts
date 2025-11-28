export type KpiViewId =
  | 'margen-financiero'
  | 'rentabilidad-operativa'
  | 'indice-renovacion-creditos'
  | 'colocacion'
  | 'rentabilidad'
  | 'rotacion-personal'
  | 'escalabilidad'
  | 'posicionamiento-marca'
  | 'innovacion-incremental'
  | 'satisfaccion-cliente'
  | 'cumplimiento-regulatorio'
  | 'gestion-riesgos'
  | 'gobierno-corporativo'

export type ProgressStatus = 'not_started' | 'in_progress' | 'complete'

export interface KpiField {
  id: string
  label: string
  placeholder?: string
  description?: string
  type: 'currency' | 'percentage' | 'number' | 'text' | 'long-text'
  required?: boolean
  unit?: string
}

export interface KpiViewDefinition {
  id: KpiViewId
  name: string
  description: string
  table: string
  icon: string
  accent: string
  fields: KpiField[]
}

export interface KpiRecord {
  id?: string
  owner_id: string
  view_id: KpiViewId
  form_values: Record<string, unknown>
  status: ProgressStatus
  updated_at?: string
}

export interface ImportResult {
  rows: Record<string, string>[]
  errors: string[]
}
