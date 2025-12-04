/**
 * Definiciones de tipos para la arquitectura de KPIs
 * Soporta formularios de resumen (manual) y carga masiva Excel (detalle)
 */

// =====================================================
// TIPOS BASE
// =====================================================

export type KpiId =
  | 'margen-financiero'
  | 'indice-renovacion'
  | 'roe-roa'
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

export type FieldType = 'number' | 'currency' | 'percentage' | 'text' | 'long-text' | 'select'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  required?: boolean
  options?: FieldOption[] // Para campos tipo select
  min?: number
  max?: number
  step?: number
}

export interface SectionDefinition {
  id: string
  title: string
  description?: string
  fields: FieldDefinition[]
  tableName: string // Nombre de tabla en Supabase para este resumen
  aggregationType?: 'sum' | 'avg' // Para acumulados: 'sum' suma, 'avg' promedia (default según tipo de campo)
  higherIsBetter?: boolean // true = superar meta es positivo, false = estar debajo es positivo (default: true)
}

export interface DetailLayoutDefinition {
  id: string
  title: string
  description?: string
  columns: string[] // Columnas del Excel en snake_case
  tableName: string // Nombre de tabla en Supabase para este detalle
}

export interface KpiDefinition {
  id: KpiId
  name: string
  shortName: string
  description: string
  icon: string
  accent: string
  summaries: SectionDefinition[] // Múltiples formularios de resumen
  details: DetailLayoutDefinition[] // Múltiples layouts Excel de detalle
}

// =====================================================
// KPI 1: MARGEN FINANCIERO
// =====================================================

export interface MargenFinancieroResumen {
  id?: string
  owner_id: string
  anio: number
  mes: number
  monto_margen_financiero: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface MargenFinancieroDetalle {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  region: string
  plaza: string
  producto: string
  ingresos: number
  costo_financiero: number
  margen_financiero: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 2: ÍNDICE DE RENOVACIÓN
// =====================================================

export interface IndiceRenovacionResumen {
  id?: string
  owner_id: string
  anio: number
  mes: number
  indice_renovacion: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface IndiceRenovacionDetalle {
  id?: string
  owner_id: string
  anio: number
  mes: number
  plaza: string
  total: number
  renovaciones: number
  nuevas: number
  indice_renovacion: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 3: ROE y ROA
// =====================================================

export interface RoeRoaResumen {
  id?: string
  owner_id: string
  anio: number
  mes: number
  roe: number
  roa: number
  meta_roe: number
  meta_roa: number
  created_at?: string
  updated_at?: string
}

export interface RoeRoaDetalle {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  capital_contable: number
  utilidad_operativa: number
  utilidad_neta: number
  activo_total: number
  roe_operativo: number
  roa_operativo: number
  roe_neto: number
  roa_neto: number
  meta_roe_operativo: number
  meta_roa_operativo: number
  meta_roe_neto: number
  meta_roa_neto: number
  created_at?: string
}

// =====================================================
// KPI 4: COLOCACIÓN (3 resúmenes, 3 detalles)
// =====================================================

export interface ColocacionResumen1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  monto_colocacion: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface ColocacionResumen2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  imor: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface ColocacionResumen3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  cartera_inicial: number
  cartera_final: number
  crecimiento: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface ColocacionDetalle1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  producto: string
  monto_colocacion: number
  meta: number
  created_at?: string
}

export interface ColocacionDetalle2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  producto: string
  cartera_total: number
  cartera_vencida: number
  imor: number
  meta: number
  created_at?: string
}

export interface ColocacionDetalle3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  producto: string
  cartera_inicial: number
  cartera_final: number
  crecimiento: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 5: RENTABILIDAD (4 resúmenes, 4 detalles)
// =====================================================

export interface RentabilidadResumen1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  ebitda: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RentabilidadResumen2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  flujo_libre: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RentabilidadResumen3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  flujo_operativo: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RentabilidadResumen4 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  gasto_por_credito: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RentabilidadDetalle1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  ebitda: number
  meta: number
  created_at?: string
}

export interface RentabilidadDetalle2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  flujo_libre: number
  meta: number
  created_at?: string
}

export interface RentabilidadDetalle3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  flujo_operativo: number
  meta: number
  created_at?: string
}

export interface RentabilidadDetalle4 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  producto: string
  gasto_por_credito: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 6: ROTACIÓN DE PERSONAL (4 resúmenes, 4 detalles)
// =====================================================

export interface RotacionResumen1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  puesto: string
  indice_rotacion: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RotacionResumen2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  dias_sin_cubrir: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RotacionResumen3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  ausentismo: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RotacionResumen4 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  permanencia_12m: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface RotacionDetalle1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  puesto: string
  hc: number
  ingresos: number
  bajas: number
  indice_rotacion: number
  meta: number
  created_at?: string
}

export interface RotacionDetalle2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  dias_sin_cubrir: number
  meta: number
  created_at?: string
}

export interface RotacionDetalle3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  ausentismo: number
  meta: number
  created_at?: string
}

export interface RotacionDetalle4 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  permanencia_12m: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 7: ESCALABILIDAD (3 resúmenes, 3 detalles)
// =====================================================

export interface EscalabilidadResumen1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  procesos_digitalizados: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface EscalabilidadResumen2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  transacciones_automaticas: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface EscalabilidadResumen3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  cost_to_serve: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface EscalabilidadDetalle1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  procesos_digitalizados: number
  meta: number
  created_at?: string
}

export interface EscalabilidadDetalle2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  transacciones_automaticas: number
  meta: number
  created_at?: string
}

export interface EscalabilidadDetalle3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  entidad: string
  plaza: string
  cost_to_serve: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 8: POSICIONAMIENTO DE MARCA (3 resúmenes, 3 detalles)
// =====================================================

export interface PosicionamientoResumen1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  recordacion_marca: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface PosicionamientoResumen2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  alcance_campanas: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface PosicionamientoResumen3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  nps: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface PosicionamientoDetalle1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  recordacion_marca: number
  meta: number
  created_at?: string
}

export interface PosicionamientoDetalle2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  alcance_campanas: number
  meta: number
  created_at?: string
}

export interface PosicionamientoDetalle3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  nps: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 9: INNOVACIÓN INCREMENTAL (1 resumen, 1 detalle)
// =====================================================

export interface InnovacionResumen {
  id?: string
  owner_id: string
  anio: number
  mes: number
  ideas_registradas: number
  proyectos_activos: number
  impacto_esperado: string
  aprendizajes: string
  created_at?: string
  updated_at?: string
}

export interface InnovacionDetalle {
  id?: string
  owner_id: string
  anio: number
  mes: number
  proyecto: string
  etapa: string
  indicador_implementacion: number
  riesgo: string
  estimacion_ahorro: number
  responsable: string
  meta: number
  created_at?: string
}

// =====================================================
// KPI 10: SATISFACCIÓN CLIENTE (3 resúmenes, 3 detalles)
// =====================================================

export interface SatisfaccionResumen1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  categoria: string
  nps: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface SatisfaccionResumen2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  quejas_72h: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface SatisfaccionResumen3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  clima_laboral: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface SatisfaccionDetalle1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  categoria: string
  nps: number
  meta: number
  created_at?: string
}

export interface SatisfaccionDetalle2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  quejas_72h: number
  meta: number
  created_at?: string
}

export interface SatisfaccionDetalle3 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  region: string
  plaza: string
  clima_laboral: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 11: CUMPLIMIENTO REGULATORIO (2 resúmenes, sin detalle)
// =====================================================

export interface CumplimientoResumen1 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  reportes_a_tiempo: number
  meta: number
  created_at?: string
  updated_at?: string
}

export interface CumplimientoResumen2 {
  id?: string
  owner_id: string
  anio: number
  mes: number
  observaciones_cnbv_condusef: number
  meta: number
  created_at?: string
  updated_at?: string
}

// =====================================================
// KPI 12: GESTIÓN DE RIESGOS (1 resumen, 1 detalle)
// =====================================================

export interface GestionRiesgosResumen {
  id?: string
  owner_id: string
  anio: number
  mes: number
  riesgos_activos: number
  riesgos_mitigados: number
  exposicion: number
  acciones_clave: string
  created_at?: string
  updated_at?: string
}

export interface GestionRiesgosDetalle {
  id?: string
  owner_id: string
  anio: number
  mes: number
  tipo: string
  descripcion: string
  incidentes_criticos: number
  riesgos_nuevos: number
  riesgos_mitigados: number
  cumplimiento_planes: number
  meta: number
  created_at?: string
}

// =====================================================
// KPI 13: GOBIERNO CORPORATIVO (1 resumen, 1 detalle)
// =====================================================

export interface GobiernoCorporativoResumen {
  id?: string
  owner_id: string
  anio: number
  mes: number
  reuniones_consejo: number
  acuerdos_cumplidos: number
  actualizaciones_politica: number
  observaciones: string
  created_at?: string
  updated_at?: string
}

export interface GobiernoCorporativoDetalle {
  id?: string
  owner_id: string
  anio: number
  mes: number
  comite: string
  sesiones: number
  acuerdos_por_area: number
  kpis_reportados: number
  seguimiento_politicas: number
  acuerdos_cumplidos: number
  meta: number
  created_at?: string
}

// =====================================================
// TIPOS UTILITARIOS
// =====================================================

export type AnyKpiResumen =
  | MargenFinancieroResumen
  | IndiceRenovacionResumen
  | RoeRoaResumen
  | ColocacionResumen1 | ColocacionResumen2 | ColocacionResumen3
  | RentabilidadResumen1 | RentabilidadResumen2 | RentabilidadResumen3 | RentabilidadResumen4
  | RotacionResumen1 | RotacionResumen2 | RotacionResumen3 | RotacionResumen4
  | EscalabilidadResumen1 | EscalabilidadResumen2 | EscalabilidadResumen3
  | PosicionamientoResumen1 | PosicionamientoResumen2 | PosicionamientoResumen3
  | InnovacionResumen
  | SatisfaccionResumen1 | SatisfaccionResumen2 | SatisfaccionResumen3
  | CumplimientoResumen1 | CumplimientoResumen2
  | GestionRiesgosResumen
  | GobiernoCorporativoResumen

export type AnyKpiDetalle =
  | MargenFinancieroDetalle
  | IndiceRenovacionDetalle
  | RoeRoaDetalle
  | ColocacionDetalle1 | ColocacionDetalle2 | ColocacionDetalle3
  | RentabilidadDetalle1 | RentabilidadDetalle2 | RentabilidadDetalle3 | RentabilidadDetalle4
  | RotacionDetalle1 | RotacionDetalle2 | RotacionDetalle3 | RotacionDetalle4
  | EscalabilidadDetalle1 | EscalabilidadDetalle2 | EscalabilidadDetalle3
  | PosicionamientoDetalle1 | PosicionamientoDetalle2 | PosicionamientoDetalle3
  | InnovacionDetalle
  | SatisfaccionDetalle1 | SatisfaccionDetalle2 | SatisfaccionDetalle3
  | GestionRiesgosDetalle
  | GobiernoCorporativoDetalle

export interface ImportValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  rowCount: number
}

export interface ImportProgress {
  total: number
  processed: number
  success: number
  failed: number
  errors: Array<{ row: number; message: string }>
}
