import type { KpiViewId } from './kpi'

export type CoreViewId = 'dashboard' | 'configuracion' | 'supervision'

export type AppViewId = CoreViewId | KpiViewId
