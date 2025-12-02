/**
 * Utilidades para manejo de archivos Excel (.xlsx)
 * Usa ExcelJS para generar plantillas con estilos corporativos
 */

import ExcelJS from 'exceljs'
import type { DetailLayoutDefinition } from '@/types/kpi-definitions'

// Colores corporativos
const COLORS = {
  primaryBlue: '4F46E5',      // plasma-blue
  primaryIndigo: '6366F1',    // plasma-indigo
  headerBg: '4F46E5',
  headerText: 'FFFFFF',
  subHeaderBg: 'EEF2FF',
  subHeaderText: '1E293B',
  borderColor: 'E2E8F0',
  alternateRowBg: 'F8FAFC',
}

// Nombres amigables para columnas
export const COLUMN_LABELS: Record<string, string> = {
  anio: 'Año',
  mes: 'Mes',
  entidad: 'Entidad',
  region: 'Región',
  plaza: 'Plaza',
  producto: 'Producto',
  concepto: 'Concepto',
  categoria: 'Categoría',
  valor: 'Valor',
  meta: 'Meta',
  monto: 'Monto',
  monto_colocacion: 'Monto Colocación',
  monto_margen_financiero: 'Margen Financiero',
  total: 'Total',
  renovaciones: 'Renovaciones',
  nuevas: 'Nuevas',
  indice_renovacion: 'Índice Renovación',
  capital_contable: 'Capital Contable',
  utilidad_operativa: 'Utilidad Operativa',
  utilidad_neta: 'Utilidad Neta',
  activo_total: 'Activo Total',
  roe: 'ROE',
  roa: 'ROA',
  meta_roe: 'Meta ROE',
  meta_roa: 'Meta ROA',
  imor: 'IMOR',
  cartera_inicial: 'Cartera Inicial',
  cartera_final: 'Cartera Final',
  cartera_total: 'Cartera Total',
  cartera_vencida: 'Cartera Vencida',
  crecimiento: 'Crecimiento',
  ebitda: 'EBITDA',
  flujo_libre: 'Flujo Libre',
  flujo_operativo: 'Flujo Operativo',
  gasto_por_credito: 'Gasto por Crédito',
  puesto: 'Puesto',
  hc: 'Headcount',
  ingresos: 'Ingresos',
  bajas: 'Bajas',
  dias_sin_cubrir: 'Días sin Cubrir',
  ausentismo: 'Ausentismo',
  permanencia_12m: 'Permanencia 12M',
  procesos_digitalizados: 'Procesos Digitalizados',
  transacciones_automaticas: 'Transacciones Automáticas',
  cost_to_serve: 'Cost to Serve',
  recordacion_marca: 'Recordación de Marca',
  alcance_campanas: 'Alcance Campañas',
  nps: 'NPS',
  quejas_72h: 'Quejas 72h',
  clima_laboral: 'Clima Laboral',
  reportes_a_tiempo: 'Reportes a Tiempo',
  observaciones_cnbv_condusef: 'Observaciones CNBV/CONDUSEF',
  riesgos_activos: 'Riesgos Activos',
  riesgos_mitigados: 'Riesgos Mitigados',
  riesgos_nuevos: 'Riesgos Nuevos',
  exposicion: 'Exposición',
  incidentes_criticos: 'Incidentes Críticos',
  cumplimiento_planes: 'Cumplimiento Planes',
  reuniones_consejo: 'Reuniones Consejo',
  acuerdos_cumplidos: 'Acuerdos Cumplidos',
  actualizaciones_politica: 'Actualizaciones Política',
  comite: 'Comité',
  sesiones: 'Sesiones',
  acuerdos_por_area: 'Acuerdos por Área',
  kpis_reportados: 'KPIs Reportados',
  seguimiento_politicas: 'Seguimiento Políticas',
  proyecto: 'Proyecto',
  etapa: 'Etapa',
  indicador_implementacion: 'Indicador Implementación',
  riesgo: 'Riesgo',
  estimacion_ahorro: 'Estimación Ahorro',
  responsable: 'Responsable',
  tipo: 'Tipo',
  descripcion: 'Descripción',
  observaciones: 'Observaciones',
  acciones_clave: 'Acciones Clave',
  ideas_registradas: 'Ideas Registradas',
  proyectos_activos: 'Proyectos Activos',
  impacto_esperado: 'Impacto Esperado',
  aprendizajes: 'Aprendizajes',
}

/**
 * Genera un archivo Excel vacío con formato corporativo
 */
export const generateExcelTemplate = async (
  layout: DetailLayoutDefinition,
  includeExampleData = false
): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'KPIs - Inteligencia de Negocios'
  workbook.created = new Date()
  
  // Crear hoja principal
  const worksheet = workbook.addWorksheet('Datos', {
    properties: { defaultColWidth: 15 }
  })

  // Mapeo de tableName a nombre del KPI
  const KPI_NAMES: Record<string, string> = {
    'kpi_margen_financiero': 'Margen Financiero',
    'kpi_indice_renovacion': 'Índice de Renovación',
    'kpi_roe_roa': 'ROE y ROA',
    'kpi_colocacion': 'Colocación',
    'kpi_rentabilidad': 'Rentabilidad',
    'kpi_rentabilidad_operativa': 'Rentabilidad Operativa',
    'kpi_rotacion': 'Rotación de Personal',
    'kpi_escalabilidad': 'Escalabilidad',
    'kpi_posicionamiento': 'Posicionamiento de Marca',
    'kpi_innovacion': 'Innovación Incremental',
    'kpi_satisfaccion': 'Satisfacción del Cliente',
    'kpi_cumplimiento': 'Cumplimiento Regulatorio',
    'kpi_gestion_riesgos': 'Gestión de Riesgos',
    'kpi_gobierno_corporativo': 'Gobierno Corporativo',
  }
  
  // Extraer nombre del KPI desde tableName (quitar sufijos _resumen_N, _detalle_N, _resumen, _detalle)
  const tablePrefix = layout.tableName
    .replace(/_resumen_\d+$/, '')
    .replace(/_detalle_\d+$/, '')
    .replace(/_resumen$/, '')
    .replace(/_detalle$/, '')
  const kpiName = KPI_NAMES[tablePrefix] || layout.title

  // === FILA 1: Título del reporte ===
  const titleRow = worksheet.getRow(1)
  titleRow.height = 40
  worksheet.mergeCells('A1', `${getColumnLetter(layout.columns.length)}1`)
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `  📊  KPIs - Inteligencia de Negocios | ${kpiName}`
  titleCell.font = { 
    name: 'Calibri', 
    size: 14, 
    bold: true, 
    color: { argb: COLORS.headerText } 
  }
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg }
  }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // === FILA 2: Descripción ===
  const descRow = worksheet.getRow(2)
  descRow.height = 22
  worksheet.mergeCells('A2', `${getColumnLetter(layout.columns.length)}2`)
  const descCell = worksheet.getCell('A2')
  // Reemplazar 'CSV' por 'Excel' en la descripción
  const cleanDescription = (layout.description || 'Plantilla de importación de datos').replace(/CSV/gi, 'Excel')
  descCell.value = cleanDescription
  descCell.font = { 
    name: 'Calibri', 
    size: 10, 
    italic: true, 
    color: { argb: '64748B' } 
  }
  descCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.subHeaderBg }
  }
  descCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // === FILA 3: Encabezados de columnas ===
  const headerRow = worksheet.getRow(3)
  headerRow.height = 25
  
  layout.columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = COLUMN_LABELS[col] || col
    cell.font = { 
      name: 'Calibri', 
      size: 11, 
      bold: true, 
      color: { argb: COLORS.subHeaderText } 
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.subHeaderBg }
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.borderColor } },
      bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
      left: { style: 'thin', color: { argb: COLORS.borderColor } },
      right: { style: 'thin', color: { argb: COLORS.borderColor } }
    }
  })

  // === Configurar columnas ===
  // Los datos empiezan en fila 4 (después del header en fila 3)
  const dataStartRow = 4

  layout.columns.forEach((col, index) => {
    const column = worksheet.getColumn(index + 1)
    
    // Ajustar ancho según tipo de columna
    if (['descripcion', 'observaciones', 'acciones_clave', 'aprendizajes', 'impacto_esperado'].includes(col)) {
      column.width = 40
    } else if (['entidad', 'producto', 'plaza', 'region', 'proyecto', 'responsable'].includes(col)) {
      column.width = 20
    } else if (['monto', 'monto_colocacion', 'cartera_total', 'cartera_inicial', 'cartera_final', 'capital_contable', 'activo_total', 'ebitda', 'monto_margen_financiero'].includes(col)) {
      column.width = 18
    } else if (['imor', 'roe', 'roa', 'indice_renovacion', 'ausentismo', 'permanencia_12m', 'nps', 'clima_laboral'].includes(col)) {
      column.width = 12
    } else {
      column.width = 15
    }
  })

  // === Agregar datos de ejemplo si se solicitan ===
  if (includeExampleData) {
    const exampleRows = generateSampleData(layout.columns, 5)
    exampleRows.forEach((rowData, rowIndex) => {
      const row = worksheet.getRow(dataStartRow + rowIndex)
      layout.columns.forEach((col, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = rowData[col]
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.borderColor } },
          bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
          left: { style: 'thin', color: { argb: COLORS.borderColor } },
          right: { style: 'thin', color: { argb: COLORS.borderColor } }
        }
        // Alternar color de fondo
        if (rowIndex % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.alternateRowBg }
          }
        }
      })
    })
  }

  // === Crear hoja de instrucciones ===
  const instructionsSheet = workbook.addWorksheet('Instrucciones')
  instructionsSheet.getColumn(1).width = 80
  
  const instructions = [
    [`INSTRUCCIONES - ${kpiName}`],
    [''],
    ['1. Complete los datos en la hoja "Datos" a partir de la fila 4'],
    ['2. No modifique las filas 1-3 (encabezados del sistema)'],
    ['3. Respete los formatos de cada columna:'],
    ['   • Año: Número entre 2020 y 2050'],
    ['   • Mes: Número del 1 al 12'],
    ['   • Montos: Valores numéricos sin símbolos de moneda'],
    ['   • Porcentajes: Valores decimales (ej: 3.5 para 3.5%)'],
    ['4. Guarde el archivo manteniendo el formato .xlsx'],
    ['5. Importe el archivo desde la aplicación'],
    [''],
    ['COLUMNAS:'],
    ...layout.columns.map(col => [`   • ${COLUMN_LABELS[col] || col}`]),
    [''],
    [`Generado: ${new Date().toLocaleString('es-MX')}`],
    ['KPIs - Inteligencia de Negocios © Credicer']
  ]

  instructions.forEach((row, index) => {
    const cell = instructionsSheet.getCell(index + 1, 1)
    cell.value = row[0]
    if (index === 0) {
      cell.font = { bold: true, size: 14, color: { argb: COLORS.headerBg } }
    } else if (row[0]?.startsWith('   •')) {
      cell.font = { size: 10, color: { argb: '64748B' } }
    }
  })

  // Generar blob
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
}

/**
 * Lee un archivo Excel y extrae los datos
 */
export const parseExcelFile = async (file: File): Promise<{
  data: Record<string, string | number | null>[]
  errors: string[]
  columns: string[]
}> => {
  const errors: string[] = []
  const data: Record<string, string | number | null>[] = []
  let columns: string[] = []

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    // Buscar hoja de datos
    const worksheet = workbook.getWorksheet('Datos') || workbook.worksheets[0]
    
    if (!worksheet) {
      return { data: [], errors: ['No se encontró una hoja de datos válida'], columns: [] }
    }

    // Crear mapeo inverso de nombres amigables a IDs técnicos
    const reverseLabelMap: Record<string, string> = {}
    Object.entries(COLUMN_LABELS).forEach(([id, label]) => {
      reverseLabelMap[label.toLowerCase().replace(/\s+/g, '_')] = id
    })

    // La fila 3 contiene los headers (nombres amigables)
    const headerRow = 3
    const headerRowData = worksheet.getRow(headerRow)
    const columnMap: Map<number, string> = new Map()
    
    headerRowData.eachCell((cell, colNumber) => {
      const rawValue = cell.value?.toString().trim()
      if (rawValue) {
        // Convertir nombre amigable a ID técnico
        const normalizedValue = rawValue.toLowerCase().replace(/\s+/g, '_')
        const technicalId = reverseLabelMap[normalizedValue] || normalizedValue
        columnMap.set(colNumber, technicalId)
        columns.push(technicalId)
      }
    })

    if (columns.length === 0) {
      return { data: [], errors: ['No se encontraron columnas válidas'], columns: [] }
    }

    // Los datos empiezan en fila 4 (después del header en fila 3)
    const dataStartRow = 4

    // Leer datos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return

      // Verificar si la fila tiene datos
      let hasData = false
      columnMap.forEach((_, colNumber) => {
        const cellValue = row.getCell(colNumber).value
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          hasData = true
        }
      })

      if (!hasData) return

      const rowData: Record<string, string | number | null> = {}
      
      columnMap.forEach((colName, colNumber) => {
        const cell = row.getCell(colNumber)
        let value = cell.value

        // Manejar diferentes tipos de valores
        if (value === null || value === undefined) {
          rowData[colName] = null
        } else if (typeof value === 'object' && 'result' in value) {
          // Fórmula
          rowData[colName] = value.result as string | number
        } else if (typeof value === 'object' && 'richText' in value) {
          // Texto enriquecido
          rowData[colName] = (value.richText as { text: string }[]).map(t => t.text).join('')
        } else if (value instanceof Date) {
          rowData[colName] = value.toISOString()
        } else {
          rowData[colName] = value as string | number
        }
      })

      data.push(rowData)
    })

    if (data.length === 0) {
      errors.push('El archivo no contiene datos')
    }

  } catch (err) {
    errors.push(`Error al leer el archivo: ${(err as Error).message}`)
  }

  return { data, errors, columns }
}

/**
 * Descarga un blob como archivo
 */
export const downloadExcelFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Obtiene la letra de columna para un índice (1 = A, 2 = B, etc.)
 */
function getColumnLetter(index: number): string {
  let result = ''
  while (index > 0) {
    const remainder = (index - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    index = Math.floor((index - 1) / 26)
  }
  return result
}

/**
 * Genera datos de ejemplo para una plantilla
 */
function generateSampleData(columns: string[], rowCount: number): Record<string, string | number>[] {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const data: Record<string, string | number>[] = []

  const sampleValues: Record<string, (i: number) => string | number> = {
    anio: () => currentYear,
    mes: (i) => Math.max(1, currentMonth - i),
    entidad: () => 'SOFOM Principal',
    region: (i) => ['Centro', 'Norte', 'Sur', 'Occidente', 'Oriente'][i % 5],
    plaza: (i) => ['CDMX Norte', 'CDMX Sur', 'Guadalajara', 'Monterrey', 'Puebla'][i % 5],
    producto: (i) => ['Crédito Personal', 'Crédito Grupal', 'Microcrédito'][i % 3],
    concepto: () => 'Intereses',
    categoria: () => 'General',
    valor: () => 50000,
    meta: () => 100,
    monto: () => 100000,
    monto_colocacion: () => 15000000,
    monto_margen_financiero: () => 5000000,
    total: () => 1000,
    renovaciones: () => 325,
    nuevas: () => 150,
    indice_renovacion: () => 32.5,
    capital_contable: () => 25000000,
    utilidad_operativa: () => 2500000,
    utilidad_neta: () => 3500000,
    activo_total: () => 100000000,
    roe: () => 15.5,
    roa: () => 2.8,
    imor: () => 3.0,
    cartera_inicial: () => 48000000,
    cartera_final: () => 52000000,
    cartera_total: () => 50000000,
    cartera_vencida: () => 1500000,
    crecimiento: () => 10,
    ebitda: () => 8500000,
    flujo_libre: () => 3200000,
    flujo_operativo: () => 5800000,
    gasto_por_credito: () => 1250,
    puesto: (i) => ['Asesor de Crédito', 'Gerente de Plaza', 'Analista'][i % 3],
    hc: () => 50,
    ingresos: () => 8,
    bajas: () => 3,
    dias_sin_cubrir: () => 15,
    ausentismo: () => 2.3,
    permanencia_12m: () => 85,
    procesos_digitalizados: () => 68,
    transacciones_automaticas: () => 75,
    cost_to_serve: () => 125,
    recordacion_marca: () => 18,
    alcance_campanas: () => 500000,
    nps: () => 45,
    quejas_72h: () => 92,
    clima_laboral: () => 78,
    reportes_a_tiempo: () => 98,
    observaciones_cnbv_condusef: () => 0,
    riesgos_activos: () => 12,
    riesgos_mitigados: () => 8,
    riesgos_nuevos: () => 2,
    exposicion: () => 15,
    incidentes_criticos: () => 1,
    cumplimiento_planes: () => 90,
    reuniones_consejo: () => 2,
    acuerdos_cumplidos: () => 95,
    actualizaciones_politica: () => 3,
    comite: (i) => ['Comité de Riesgos', 'Comité de Crédito', 'Consejo'][i % 3],
    sesiones: () => 4,
    acuerdos_por_area: () => 12,
    kpis_reportados: () => 8,
    seguimiento_politicas: () => 95,
    proyecto: (i) => ['Digitalización', 'Automatización', 'Optimización'][i % 3],
    etapa: (i) => ['Planeación', 'Implementación', 'Evaluación'][i % 3],
    indicador_implementacion: () => 75,
    riesgo: (i) => ['Bajo', 'Medio', 'Alto'][i % 3],
    estimacion_ahorro: () => 500000,
    responsable: () => 'Juan Pérez',
    tipo: () => 'Operativo',
    descripcion: () => 'Descripción del registro',
    observaciones: () => 'Sin observaciones',
  }

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, string | number> = {}
    columns.forEach(col => {
      const generator = sampleValues[col]
      row[col] = generator ? generator(i) : ''
    })
    data.push(row)
  }

  return data
}
