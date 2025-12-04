import type { KpiViewDefinition, KpiViewId } from '@/types/kpi'
import type { AppViewId } from '@/types/views'
import type { PermissionViewDefinition } from '@/types/permissions'

export const KPI_VIEWS: KpiViewDefinition[] = [
  {
    id: 'colocacion',
    name: 'Colocación',
    description: 'Mide la originación de créditos y su velocidad.',
    table: 'kpi_colocacion',
    icon: 'Send',
    accent: 'from-rose-50/80 via-white/60 to-amber-100/60',
    fields: [
      { id: 'nuevos_creditos', label: 'Nuevos Créditos', type: 'number', placeholder: '125' },
      { id: 'monto_colocado', label: 'Monto Colocado', type: 'currency', placeholder: '$12,800,000' },
      { id: 'ticket_promedio', label: 'Ticket Promedio', type: 'currency', placeholder: '$102,400' },
      { id: 'comentarios', label: 'Insight Comercial', type: 'long-text', placeholder: '¿Qué destaca del periodo?' },
    ],
  },
  {
    id: 'indice-renovacion-creditos',
    name: 'Índice de Renovación de Créditos',
    description: 'Seguimiento del ratio de renovación vs. cartera total.',
    table: 'kpi_indice_renovacion_creditos',
    icon: 'RefreshCcw',
    accent: 'from-cyan-50/80 via-white/60 to-lime-100/60',
    fields: [
      { id: 'cartera_total', label: 'Cartera Total', type: 'currency', placeholder: '$25,000,000' },
      { id: 'renovado', label: 'Monto Renovado', type: 'currency', placeholder: '$7,500,000' },
      { id: 'indice', label: 'Índice (%)', type: 'percentage', placeholder: '30%' },
      { id: 'acciones', label: 'Acciones Sugeridas', type: 'long-text', placeholder: 'Planes para optimizar.' },
    ],
  },
  {
    id: 'margen-financiero',
    name: 'Margen Financiero',
    description: 'Monitorea la eficiencia del margen y su tendencia mensual.',
    table: 'kpi_margen_financiero',
    icon: 'LineChart',
    accent: 'from-sky-50/80 via-white/60 to-blue-100/60',
    fields: [
      { id: 'ingresos', label: 'Ingresos Financieros', type: 'currency', placeholder: '$3,500,000', required: true },
      { id: 'costos', label: 'Costos Financieros', type: 'currency', placeholder: '$1,125,000', required: true },
      { id: 'margen', label: 'Margen (%)', type: 'percentage', placeholder: '38%', description: 'Resultado neto / Ingresos.' },
      { id: 'comentarios', label: 'Insight Clave', type: 'long-text', placeholder: 'Detalle hallazgos o acciones.' },
    ],
  },
  {
    id: 'posicionamiento-marca',
    name: 'Posicionamiento de Marca',
    description: 'Salud de marca y recordación.',
    table: 'kpi_posicionamiento_marca',
    icon: 'Sparkles',
    accent: 'from-yellow-50/80 via-white/60 to-orange-100/60',
    fields: [
      { id: 'top_of_mind', label: 'Top of Mind (%)', type: 'percentage', placeholder: '17%' },
      { id: 'nps', label: 'NPS', type: 'number', placeholder: '54' },
      { id: 'share_voz', label: 'Share of Voice (%)', type: 'percentage', placeholder: '12%' },
      { id: 'campanas', label: 'Campañas Clave', type: 'long-text' },
    ],
  },
  {
    id: 'rotacion-personal',
    name: 'Rotación de Personal',
    description: 'Controla el churn de talento crítico.',
    table: 'kpi_rotacion_personal',
    icon: 'Users2',
    accent: 'from-purple-50/80 via-white/60 to-fuchsia-100/60',
    fields: [
      { id: 'colaboradores', label: 'Colaboradores Totales', type: 'number', placeholder: '420' },
      { id: 'bajas', label: 'Bajas del Periodo', type: 'number', placeholder: '18' },
      { id: 'rotacion', label: 'Rotación (%)', type: 'percentage', placeholder: '4.3%' },
      { id: 'plan_retencion', label: 'Plan de Retención', type: 'long-text', placeholder: 'Describe iniciativas clave.' },
    ],
  },
  {
    id: 'satisfaccion-cliente',
    name: 'Satisfacción Cliente',
    description: 'CSAT, NPS y tiempos de respuesta.',
    table: 'kpi_satisfaccion_cliente',
    icon: 'Smile',
    accent: 'from-pink-50/80 via-white/60 to-red-100/60',
    fields: [
      { id: 'csat', label: 'CSAT', type: 'number', placeholder: '92' },
      { id: 'nps', label: 'NPS', type: 'number', placeholder: '68' },
      { id: 'tiempo_respuesta', label: 'Tiempo de Respuesta (hrs)', type: 'number', placeholder: '2.5' },
      { id: 'voz_cliente', label: 'Voz del Cliente', type: 'long-text' },
    ],
  },
  {
    id: 'escalabilidad',
    name: 'Escalabilidad',
    description: 'Capacidad operativa para crecer sin fricciones.',
    table: 'kpi_escalabilidad',
    icon: 'Layers',
    accent: 'from-slate-50/80 via-white/60 to-slate-200/60',
    fields: [
      { id: 'capacidad_actual', label: 'Capacidad Actual (%)', type: 'percentage', placeholder: '68%' },
      { id: 'capacidad_meta', label: 'Capacidad Meta (%)', type: 'percentage', placeholder: '85%' },
      { id: 'cuellos_botella', label: 'Cuellos de Botella', type: 'long-text' },
      { id: 'recursos', label: 'Recursos Clave', type: 'text', placeholder: 'Equipo, tooling, etc.' },
    ],
  },
  {
    id: 'rentabilidad-operativa',
    name: 'Rentabilidad Operativa (ROE)',
    description: 'Evalúa el rendimiento sobre capital contable.',
    table: 'kpi_rentabilidad_operativa',
    icon: 'GaugeCircle',
    accent: 'from-indigo-50/80 via-white/60 to-slate-100/60',
    fields: [
      { id: 'utilidad_neta', label: 'Utilidad Neta', type: 'currency', placeholder: '$950,000' },
      { id: 'patrimonio', label: 'Patrimonio Promedio', type: 'currency', placeholder: '$4,100,000' },
      { id: 'roe', label: 'ROE (%)', type: 'percentage', placeholder: '23%' },
      { id: 'drivers', label: 'Drivers Principales', type: 'long-text', placeholder: '¿Qué impulsó el cambio?' },
    ],
  },
  {
    id: 'rentabilidad',
    name: 'Rentabilidad',
    description: 'Margen neto total considerando costos y provisiones.',
    table: 'kpi_rentabilidad',
    icon: 'PiggyBank',
    accent: 'from-emerald-50/80 via-white/60 to-green-100/60',
    fields: [
      { id: 'ingresos_totales', label: 'Ingresos Totales', type: 'currency', placeholder: '$18,200,000' },
      { id: 'egresos_totales', label: 'Egresos Totales', type: 'currency', placeholder: '$9,450,000' },
      { id: 'rentabilidad_pct', label: 'Rentabilidad (%)', type: 'percentage', placeholder: '51%' },
      { id: 'notas', label: 'Notas Financieras', type: 'long-text' },
    ],
  },
  {
    id: 'innovacion-incremental',
    name: 'Innovación Incremental',
    description: 'Pipeline de mejoras y releases.',
    table: 'kpi_innovacion_incremental',
    icon: 'FlaskRound',
    accent: 'from-cyan-50/80 via-white/60 to-cyan-100/60',
    fields: [
      { id: 'ideas', label: 'Ideas Registradas', type: 'number', placeholder: '32' },
      { id: 'proyectos_activos', label: 'Proyectos Activos', type: 'number', placeholder: '8' },
      { id: 'impacto', label: 'Impacto Esperado', type: 'text', placeholder: 'Ahorro 10% OPEX' },
      { id: 'aprendizajes', label: 'Aprendizajes', type: 'long-text' },
    ],
  },
  {
    id: 'gestion-riesgos',
    name: 'Gestión de Riesgos',
    description: 'Mapa de riesgos críticos y mitigación.',
    table: 'kpi_gestion_riesgos',
    icon: 'Radar',
    accent: 'from-slate-50/80 via-white/60 to-slate-200/60',
    fields: [
      { id: 'riesgos_activos', label: 'Riesgos Activos', type: 'number', placeholder: '14' },
      { id: 'riesgos_mitigados', label: 'Riesgos Mitigados', type: 'number', placeholder: '9' },
      { id: 'exposicion', label: 'Exposición (%)', type: 'percentage', placeholder: '12%' },
      { id: 'acciones', label: 'Acciones Clave', type: 'long-text' },
    ],
  },
  {
    id: 'cumplimiento-regulatorio',
    name: 'Cumplimiento Regulatorio',
    description: 'Obligaciones, auditorías y hallazgos.',
    table: 'kpi_cumplimiento_regulatorio',
    icon: 'ShieldCheck',
    accent: 'from-teal-50/80 via-white/60 to-blue-100/60',
    fields: [
      { id: 'obligaciones', label: 'Obligaciones Cubiertas (%)', type: 'percentage', placeholder: '98%' },
      { id: 'auditorias', label: 'Auditorías Abiertas', type: 'number', placeholder: '2' },
      { id: 'riesgo', label: 'Nivel de Riesgo', type: 'text', placeholder: 'Bajo / Medio / Alto' },
      { id: 'planes_accion', label: 'Planes de Acción', type: 'long-text' },
    ],
  },
  {
    id: 'gobierno-corporativo',
    name: 'Gobierno Corporativo',
    description: 'Sesiones, acuerdos y cumplimiento de políticas.',
    table: 'kpi_gobierno_corporativo',
    icon: 'Gem',
    accent: 'from-white/80 via-slate-50/60 to-slate-200/60',
    fields: [
      { id: 'reuniones', label: 'Reuniones de Consejo', type: 'number', placeholder: '4' },
      { id: 'acuerdos', label: '% Acuerdos Cumplidos', type: 'percentage', placeholder: '92%' },
      { id: 'policy_updates', label: 'Actualizaciones de Política', type: 'number', placeholder: '3' },
      { id: 'observaciones', label: 'Observaciones', type: 'long-text' },
    ],
  },
]

export const KPI_TABLES = KPI_VIEWS.reduce<Record<KpiViewId, string>>((acc, view) => {
  acc[view.id as KpiViewId] = view.table
  return acc
}, {} as Record<KpiViewId, string>)

export const KPI_VIEW_MAP = KPI_VIEWS.reduce<Record<KpiViewId, KpiViewDefinition>>((acc, view) => {
  acc[view.id as KpiViewId] = view
  return acc
}, {} as Record<KpiViewId, KpiViewDefinition>)

export const KPI_IDS: KpiViewId[] = KPI_VIEWS.map((view) => view.id as KpiViewId)

export const CORE_PERMISSION_VIEWS: PermissionViewDefinition[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Resumen ejecutivo con widgets clave.',
    category: 'core',
  },
  {
    id: 'configuracion',
    name: 'Configuración',
    description: 'Asigna permisos por usuario y administra vistas.',
    category: 'core',
  },
  {
    id: 'supervision',
    name: 'Supervisión',
    description: 'Monitorea el avance por usuario en cada KPI.',
    category: 'core',
  },
]

const KPI_PERMISSION_VIEWS: PermissionViewDefinition[] = KPI_VIEWS.map((view) => ({
  id: view.id,
  name: view.name,
  description: view.description,
  category: 'kpi',
}))

export const PERMISSION_VIEWS: PermissionViewDefinition[] = [...CORE_PERMISSION_VIEWS, ...KPI_PERMISSION_VIEWS]

export const PERMISSION_VIEW_MAP = PERMISSION_VIEWS.reduce<Record<AppViewId, PermissionViewDefinition>>((acc, view) => {
  acc[view.id as AppViewId] = view
  return acc
}, {} as Record<AppViewId, PermissionViewDefinition>)

export const ALL_VIEW_IDS: AppViewId[] = PERMISSION_VIEWS.map((view) => view.id as AppViewId)

export const FIRST_USER_DEFAULT_VIEWS: AppViewId[] = ['configuracion']

export const AUTOSAVE_DEBOUNCE = 1200
