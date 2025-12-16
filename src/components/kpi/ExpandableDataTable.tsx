/**
 * ExpandableDataTable - Tabla con filas expandibles por dimensión
 * Soporta hasta N niveles de drill-down (configurable)
 * Diseño responsive y elegante para móvil/desktop
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  ChevronDown,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  CheckCircle2,
  Sparkles,
  Layers,
  MapPin,
  Building2,
  Package,
  Users,
  AlertCircle,
  Workflow,
  Cog,
  GitBranch,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, DetailLayoutDefinition } from '@/types/kpi-definitions';
import { cn } from '@/utils/ui';

// =====================================================
// TYPES
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonthlyDataRow = Record<string, any>;

interface ExpandableDataTableProps {
  config: KpiDefinition;
  selectedSummaryIndex: number;
  availableYears: number[];
  selectedYear: number;
  monthlyData: MonthlyDataRow[];
  viewType: 'monthly' | 'accumulated';
  formatValue: (value: number) => string;
  higherIsBetter: boolean;
  yearColors: Record<number, string>;
}

interface DimensionConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  priority: number;
}

interface ExpandedRow {
  month: number;
  dimensions: string[]; // Array de valores expandidos por nivel
}

interface DetailDataByMonth {
  [month: number]: Record<string, unknown>[];
}

// Configuración de dimensiones con jerarquía
const DIMENSION_HIERARCHY: Record<string, DimensionConfig> = {
  // Dimensiones geográficas
  entidad: { key: 'entidad', label: 'Entidad', icon: Building2, priority: 1 },
  region: { key: 'region', label: 'Región', icon: MapPin, priority: 2 },
  plaza: { key: 'plaza', label: 'Plaza', icon: Building2, priority: 3 },
  // Dimensiones de producto/servicio
  producto: { key: 'producto', label: 'Producto', icon: Package, priority: 4 },
  servicio: { key: 'servicio', label: 'Servicio', icon: Briefcase, priority: 5 },
  // Dimensiones de proceso (Escalabilidad)
  macro_proceso: { key: 'macro_proceso', label: 'Macro-Proceso', icon: Workflow, priority: 6 },
  proceso: { key: 'proceso', label: 'Proceso', icon: Cog, priority: 7 },
  sub_proceso: { key: 'sub_proceso', label: 'Sub-Proceso', icon: GitBranch, priority: 8 },
  // Dimensiones organizacionales
  puesto: { key: 'puesto', label: 'Puesto', icon: Users, priority: 9 },
  comite: { key: 'comite', label: 'Comité', icon: Users, priority: 10 },
  // Dimensiones generales
  categoria: { key: 'categoria', label: 'Categoría', icon: Layers, priority: 11 },
  tipo: { key: 'tipo', label: 'Tipo', icon: Layers, priority: 12 },
  proyecto: { key: 'proyecto', label: 'Proyecto', icon: Layers, priority: 13 },
  etapa: { key: 'etapa', label: 'Etapa', icon: Layers, priority: 14 },
};

// Colores para niveles de profundidad
const DEPTH_COLORS = [
  'bg-slate-50/80',      // Nivel 1
  'bg-blue-50/60',       // Nivel 2
  'bg-indigo-50/50',     // Nivel 3
  'bg-violet-50/40',     // Nivel 4+
];

const DEPTH_BORDERS = [
  'border-l-emerald-400',
  'border-l-blue-400',
  'border-l-indigo-400',
  'border-l-violet-400',
];

export function ExpandableDataTable({
  config,
  selectedSummaryIndex,
  availableYears,
  selectedYear,
  monthlyData,
  viewType,
  formatValue,
  higherIsBetter,
  yearColors
}: ExpandableDataTableProps) {
  // Estado
  const [expandedRows, setExpandedRows] = useState<Map<string, ExpandedRow>>(new Map());
  const [selectedDimensionKey, setSelectedDimensionKey] = useState<string>('');
  const [detailDataByMonth, setDetailDataByMonth] = useState<DetailDataByMonth>({});
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());
  const [isDimensionSelectorOpen, setIsDimensionSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Click outside para cerrar selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsDimensionSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener definición de detalle correspondiente
  const selectedDetail: DetailLayoutDefinition | undefined = useMemo(() => {
    if (!config.details || config.details.length === 0) return undefined;
    if (config.details.length > selectedSummaryIndex) {
      return config.details[selectedSummaryIndex];
    }
    return config.details[0];
  }, [config.details, selectedSummaryIndex]);

  // Detectar dimensiones disponibles en el detalle
  const availableDimensions = useMemo(() => {
    if (!selectedDetail?.columns) return [];
    const dimensions: DimensionConfig[] = [];
    
    selectedDetail.columns.forEach(col => {
      if (DIMENSION_HIERARCHY[col]) {
        dimensions.push(DIMENSION_HIERARCHY[col]);
      }
    });
    
    return dimensions.sort((a, b) => a.priority - b.priority);
  }, [selectedDetail]);

  // Establecer dimensión por defecto
  useEffect(() => {
    if (availableDimensions.length > 0 && !selectedDimensionKey) {
      setSelectedDimensionKey(availableDimensions[0].key);
    }
  }, [availableDimensions, selectedDimensionKey]);

  // Obtener la jerarquía de dimensiones a partir de la seleccionada
  const dimensionHierarchy = useMemo(() => {
    if (!selectedDimensionKey || availableDimensions.length === 0) return [];
    
    const selectedIndex = availableDimensions.findIndex(d => d.key === selectedDimensionKey);
    if (selectedIndex === -1) return [];
    
    // Retornar desde la dimensión seleccionada hacia abajo en la jerarquía
    return availableDimensions.slice(selectedIndex);
  }, [availableDimensions, selectedDimensionKey]);

  // Detectar campo métrico principal y si es porcentaje
  const { metricKey, isPercentageMetric, weightKey } = useMemo(() => {
    if (!selectedDetail?.columns) return { metricKey: 'valor', isPercentageMetric: false, weightKey: null };
    
    const excludeFields = ['anio', 'mes', 'meta', 'is_current', 'owner_id', 'id', 'created_at',
                          ...Object.keys(DIMENSION_HIERARCHY)];
    // Campos que típicamente son porcentajes/tasas/índices
    const percentagePatterns = ['indice', 'ratio', 'porcentaje', 'tasa', 'roe', 'roa', 'margen', 'nps', 'satisfaccion', 'imor', 'mora', 'crecimiento', 'variacion', 'rendimiento'];
    // Campos que pueden usarse como peso para promedios ponderados
    const weightPatterns = ['total', 'monto', 'cartera', 'creditos', 'clientes', 'operaciones', 'cantidad'];
    
    // Buscar primero campos de porcentaje
    const percentageField = selectedDetail.columns.find(
      col => percentagePatterns.some(pattern => col.toLowerCase().includes(pattern)) &&
             !excludeFields.includes(col)
    );
    
    const metKey = percentageField || selectedDetail.columns.find(
      col => !excludeFields.includes(col) && !col.startsWith('meta')
    ) || 'valor';
    
    const isPctMetric = percentagePatterns.some(pattern => metKey.toLowerCase().includes(pattern));
    
    // Buscar campo de peso
    const wtKey = isPctMetric 
      ? selectedDetail.columns.find(col => weightPatterns.some(pattern => col.toLowerCase().includes(pattern)))
      : null;
    
    return { metricKey: metKey, isPercentageMetric: isPctMetric, weightKey: wtKey || null };
  }, [selectedDetail]);

  // Cargar datos de detalle para un mes
  const loadDetailData = useCallback(async (monthNumber: number) => {
    if (!selectedDetail || loadingMonths.has(monthNumber) || detailDataByMonth[monthNumber]) {
      return;
    }

    setLoadingMonths(prev => new Set(prev).add(monthNumber));

    try {
      let query = supabase
        .from(selectedDetail.tableName)
        .select('*')
        .eq('is_current', true);

      if (viewType === 'monthly') {
        // Para vista mensual, traer todos los años para ese mes
        query = query.eq('mes', monthNumber);
      } else {
        // Para vista acumulada, traer todos los meses hasta el actual para cada año
        query = query.lte('mes', monthNumber);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDetailDataByMonth(prev => ({
        ...prev,
        [monthNumber]: (data || []) as Record<string, unknown>[]
      }));
    } catch (err) {
      console.error('Error loading detail data:', err);
    } finally {
      setLoadingMonths(prev => {
        const next = new Set(prev);
        next.delete(monthNumber);
        return next;
      });
    }
  }, [selectedDetail, viewType, loadingMonths, detailDataByMonth]);

  // Toggle expansión de fila
  const toggleRowExpansion = useCallback((monthNumber: number, level: number = 0, dimensionValue?: string) => {
    const key = `${monthNumber}-${level}-${dimensionValue || 'root'}`;
    
    setExpandedRows(prev => {
      const next = new Map(prev);
      
      if (level === 0) {
        // Expandir/colapsar mes principal
        if (next.has(key)) {
          // Colapsar: eliminar todas las expansiones de este mes
          const keysToDelete = Array.from(next.keys()).filter(k => k.startsWith(`${monthNumber}-`));
          keysToDelete.forEach(k => next.delete(k));
        } else {
          // Expandir: cargar datos y marcar como expandido
          loadDetailData(monthNumber);
          next.set(key, { month: monthNumber, dimensions: [] });
        }
      } else {
        // Expandir/colapsar subdimensión
        if (next.has(key)) {
          // Colapsar: eliminar esta y todas las expansiones hijas
          const keysToDelete = Array.from(next.keys()).filter(k => {
            const [m, l] = k.split('-').map(Number);
            return m === monthNumber && l >= level && k.startsWith(`${monthNumber}-${level}`);
          });
          keysToDelete.forEach(k => next.delete(k));
        } else {
          next.set(key, { month: monthNumber, dimensions: [dimensionValue || ''] });
        }
      }
      
      return next;
    });
  }, [loadDetailData]);

  // Agrupar datos por dimensión
  const groupDataByDimension = useCallback((
    data: Record<string, unknown>[],
    dimensionKey: string,
    year: number,
    monthNumber: number,
    parentFilters: Record<string, string> = {}
  ) => {
    // Filtrar por año y mes (según vista)
    const filtered = data.filter(row => {
      const rowYear = Number(row.anio);
      const rowMonth = Number(row.mes);
      
      if (rowYear !== year) return false;
      if (viewType === 'monthly' && rowMonth !== monthNumber) return false;
      if (viewType === 'accumulated' && rowMonth > monthNumber) return false;
      
      // Aplicar filtros de dimensiones padres
      for (const [key, value] of Object.entries(parentFilters)) {
        if (String(row[key]) !== value) return false;
      }
      return true;
    });

    // Detectar si los valores necesitan escalado (decimal 0-1 vs porcentaje 0-100)
    let scaleFactor = 1;
    if (isPercentageMetric && filtered.length > 0) {
      const metricValues = filtered
        .map(row => Number(row[metricKey]) || 0)
        .filter(v => v > 0);
      if (metricValues.length > 0) {
        const avgValue = metricValues.reduce((a, b) => a + b, 0) / metricValues.length;
        if (avgValue < 2) {
          scaleFactor = 100;
        }
      }
    }

    // Agrupar por dimensión
    const grouped: Record<string, { value: number; weight: number; meta: number | null; count: number }> = {};
    
    filtered.forEach(row => {
      const dimValue = String(row[dimensionKey] || 'Sin clasificar');
      if (!grouped[dimValue]) {
        grouped[dimValue] = { value: 0, weight: 0, meta: null, count: 0 };
      }
      
      const rawValue = (Number(row[metricKey]) || 0) * scaleFactor;
      const weightValue = weightKey ? (Number(row[weightKey]) || 1) : 1;
      // La meta también puede estar en escala decimal
      const metaValue = (Number(row.meta) || 0) * scaleFactor;
      
      if (isPercentageMetric) {
        // Para porcentajes: acumular para promedio ponderado
        grouped[dimValue].value += rawValue * weightValue;
        grouped[dimValue].weight += weightValue;
      } else {
        // Para valores absolutos: sumar directamente
        grouped[dimValue].value += rawValue;
      }
      
      if (row.meta !== null && row.meta !== undefined) {
        grouped[dimValue].meta = (grouped[dimValue].meta || 0) + metaValue;
      }
      grouped[dimValue].count += 1;
    });

    return Object.entries(grouped)
      .map(([name, data]) => {
        // Calcular valor final
        const finalValue = isPercentageMetric && data.weight > 0
          ? data.value / data.weight  // Promedio ponderado
          : data.value;
        
        return { 
          name, 
          value: finalValue,
          meta: isPercentageMetric && data.count > 0 && data.meta !== null
            ? data.meta / data.count  // Promedio de meta para porcentajes
            : data.meta,
          count: data.count 
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [metricKey, viewType, isPercentageMetric, weightKey]);

  // Renderizar icono de tendencia
  const renderTrend = (current: number | null, previous: number | null) => {
    if (current === null || previous === null || previous === 0) return null;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    const isPositive = higherIsBetter ? change > 0 : change < 0;
    
    if (Math.abs(change) < 0.5) {
      return <Minus size={12} className="text-slate-400" />;
    }
    
    return isPositive ? (
      <TrendingUp size={12} className="text-emerald-500" />
    ) : (
      <TrendingDown size={12} className="text-rose-500" />
    );
  };

  // Renderizar fila expandida con subdimensiones
  const renderExpandedContent = (
    monthNumber: number,
    level: number,
    parentFilters: Record<string, string> = {}
  ) => {
    if (level >= dimensionHierarchy.length) return null;
    
    const currentDimension = dimensionHierarchy[level];
    const data = detailDataByMonth[monthNumber];
    
    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={availableYears.length + 2} className="p-4 text-center text-soft-slate text-sm">
            <AlertCircle size={16} className="inline mr-2" />
            Sin datos de detalle disponibles
          </td>
        </tr>
      );
    }

    const sortedYears = [...availableYears].sort((a, b) => a - b);
    const depthColor = DEPTH_COLORS[Math.min(level, DEPTH_COLORS.length - 1)];
    const borderColor = DEPTH_BORDERS[Math.min(level, DEPTH_BORDERS.length - 1)];

    // Obtener valores únicos de esta dimensión para mostrar
    const allDimensionValues = new Set<string>();
    data.forEach(row => {
      const rowYear = Number(row.anio);
      const rowMonth = Number(row.mes);
      
      // Filtrar por año/mes según vista
      if (viewType === 'monthly' && rowMonth !== monthNumber) return;
      if (viewType === 'accumulated' && rowMonth > monthNumber) return;
      
      // Verificar que algún año disponible tenga datos
      if (!availableYears.includes(rowYear)) return;
      
      let matches = true;
      for (const [key, value] of Object.entries(parentFilters)) {
        if (String(row[key]) !== value) matches = false;
      }
      if (matches) {
        allDimensionValues.add(String(row[currentDimension.key] || 'Sin clasificar'));
      }
    });

    const dimensionValues = Array.from(allDimensionValues).sort();

    return (
      <>
        {dimensionValues.map(dimValue => {
          const rowKey = `${monthNumber}-${level + 1}-${dimValue}`;
          const isExpanded = expandedRows.has(rowKey);
          const hasNextLevel = level + 1 < dimensionHierarchy.length;
          const DimIcon = currentDimension.icon;

          // Calcular valores por año
          const valuesByYear: Record<number, number> = {};
          const metaByYear: Record<number, number | null> = {};
          
          sortedYears.forEach(year => {
            const grouped = groupDataByDimension(data, currentDimension.key, year, monthNumber, parentFilters);
            const match = grouped.find(g => g.name === dimValue);
            valuesByYear[year] = match?.value || 0;
            metaByYear[year] = match?.meta || null;
          });

          const selectedYearValue = valuesByYear[selectedYear];
          const selectedYearMeta = metaByYear[selectedYear];
          const metaAchieved = selectedYearMeta !== null && selectedYearMeta > 0 &&
            (higherIsBetter ? selectedYearValue >= selectedYearMeta : selectedYearValue <= selectedYearMeta);

          return (
            <React.Fragment key={rowKey}>
              <motion.tr
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "border-t border-slate-100/80 transition-colors",
                  depthColor,
                  "hover:bg-white/60"
                )}
              >
                {/* Nombre de dimensión */}
                <td className={cn("p-2 md:p-3", `border-l-4 ${borderColor}`)}>
                  <div 
                    className={cn(
                      "flex items-center gap-1.5 md:gap-2",
                      hasNextLevel && "cursor-pointer"
                    )}
                    style={{ paddingLeft: `${(level + 1) * 12}px` }}
                    onClick={() => hasNextLevel && toggleRowExpansion(monthNumber, level + 1, dimValue)}
                  >
                    {hasNextLevel ? (
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <ChevronRight size={14} className="text-slate-400" />
                      </motion.div>
                    ) : (
                      <div className="w-3.5" />
                    )}
                    <DimIcon size={14} className="text-slate-400 flex-shrink-0 hidden sm:block" />
                    <span className="text-vision-ink/80 text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-none">
                      {dimValue}
                    </span>
                  </div>
                </td>

                {/* Valores por año */}
                {sortedYears.map((year) => {
                  const value = valuesByYear[year];
                  const prevYearValue = valuesByYear[year - 1];
                  const isSelected = year === selectedYear;
                  
                  return (
                    <td 
                      key={year} 
                      className={cn(
                        "p-2 md:p-3 text-right text-xs md:text-sm",
                        isSelected ? "font-medium text-vision-ink" : "text-vision-ink/70"
                      )}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {isSelected && renderTrend(value, prevYearValue)}
                        <span className="tabular-nums">{formatValue(value)}</span>
                      </div>
                    </td>
                  );
                })}

                {/* Meta */}
                <td className={cn(
                  "p-2 md:p-3 text-right text-xs md:text-sm font-medium",
                  metaAchieved ? "text-emerald-600" : "text-plasma-blue"
                )}>
                  <div className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md",
                    metaAchieved && "bg-emerald-50 ring-1 ring-emerald-200/50"
                  )}>
                    {metaAchieved && <CheckCircle2 size={12} className="text-emerald-500" />}
                    <span className="tabular-nums">
                      {selectedYearMeta !== null ? formatValue(selectedYearMeta) : '-'}
                    </span>
                  </div>
                </td>
              </motion.tr>

              {/* Subdimensiones (recursivo) */}
              {isExpanded && (
                <AnimatePresence>
                  {renderExpandedContent(
                    monthNumber,
                    level + 1,
                    { ...parentFilters, [currentDimension.key]: dimValue }
                  )}
                </AnimatePresence>
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Si no hay detalles disponibles
  if (!selectedDetail || availableDimensions.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-left text-soft-slate p-3 font-medium">Mes</th>
                {[...availableYears].sort((a, b) => a - b).map((year) => (
                  <th key={year} className="text-right text-soft-slate p-3 font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                        style={{ backgroundColor: yearColors[year] }}
                      />
                      {viewType === 'accumulated' ? `Acum. ${year}` : year}
                    </div>
                  </th>
                ))}
                <th className="text-right text-soft-slate p-3 font-medium">
                  Meta {selectedYear}
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row, index) => (
                <tr key={index} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 text-vision-ink font-medium">{row.mes}</td>
                  {[...availableYears].sort((a, b) => a - b).map((year) => {
                    const key = viewType === 'accumulated' ? `acumulado_${year}` : `valor_${year}`;
                    const value = row[key] as number | null;
                    return (
                      <td key={year} className="p-3 text-right text-vision-ink/80">
                        {value !== null ? formatValue(value) : '-'}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right text-plasma-blue font-medium">
                    {row.meta !== null ? formatValue(row.meta as number) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const sortedYears = [...availableYears].sort((a, b) => a - b);
  const selectedDimension = availableDimensions.find(d => d.key === selectedDimensionKey);

  return (
    <div className="space-y-3">
      {/* Selector de dimensión */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-sm text-soft-slate">
          <Layers size={16} className="text-plasma-blue" />
          <span className="hidden sm:inline">Agrupar por:</span>
        </div>
        
        <div ref={selectorRef} className="relative">
          <button
            onClick={() => setIsDimensionSelectorOpen(!isDimensionSelectorOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white 
                     rounded-lg border border-slate-200 transition-all duration-200 shadow-sm"
          >
            {selectedDimension && (
              <>
                <selectedDimension.icon size={14} className="text-plasma-blue" />
                <span className="text-vision-ink font-medium text-sm">{selectedDimension.label}</span>
              </>
            )}
            <ChevronDown 
              size={14} 
              className={cn(
                "text-soft-slate transition-transform duration-200",
                isDimensionSelectorOpen && "rotate-180"
              )} 
            />
          </button>

          <AnimatePresence>
            {isDimensionSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 min-w-[160px] bg-white rounded-xl 
                         border border-slate-200 shadow-xl z-50 overflow-hidden"
              >
                {availableDimensions.map((dim) => (
                  <button
                    key={dim.key}
                    onClick={() => {
                      setSelectedDimensionKey(dim.key);
                      setIsDimensionSelectorOpen(false);
                      setExpandedRows(new Map()); // Reset expansiones
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-2.5 text-left transition-all",
                      selectedDimensionKey === dim.key
                        ? "bg-plasma-blue/10 text-plasma-blue"
                        : "text-vision-ink hover:bg-slate-50"
                    )}
                  >
                    <dim.icon size={16} />
                    <span className="font-medium text-sm">{dim.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabla principal */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50/90 to-slate-100/70">
                <th className="text-left text-soft-slate p-2 md:p-3 font-medium sticky left-0 bg-slate-50/95 z-10">
                  <span className="text-xs md:text-sm">Mes</span>
                </th>
                {sortedYears.map((year) => (
                  <th key={year} className="text-right text-soft-slate p-2 md:p-3 font-medium min-w-[90px] md:min-w-[110px]">
                    <div className="flex items-center justify-end gap-1.5 md:gap-2">
                      <div 
                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ring-2 ring-white shadow-sm flex-shrink-0" 
                        style={{ backgroundColor: yearColors[year] }}
                      />
                      <span className="text-xs md:text-sm">
                        {viewType === 'accumulated' ? (
                          <span className="hidden sm:inline">Acum. </span>
                        ) : null}
                        {year}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="text-right text-soft-slate p-2 md:p-3 font-medium min-w-[90px] md:min-w-[110px]">
                  <div className="flex items-center justify-end gap-1.5">
                    <Trophy size={14} className="text-amber-500 hidden sm:block" />
                    <span className="text-xs md:text-sm">Meta {selectedYear}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row, index) => {
                // Soportar tanto mesNum como monthNumber
                const monthNumber = (row.mesNum ?? row.monthNumber ?? index + 1) as number;
                const rowKey = `${monthNumber}-0-root`;
                const isExpanded = expandedRows.has(rowKey);
                const isLoading = loadingMonths.has(monthNumber);

                // Determinar si se cumplió la meta
                const valueKey = viewType === 'accumulated' ? `acumulado_${selectedYear}` : `valor_${selectedYear}`;
                const metaKey = viewType === 'accumulated' ? 'meta_acumulada' : 'meta';
                const selectedYearValue = row[valueKey] as number | null;
                const metaValue = row[metaKey] as number | null;
                const metaAchieved = selectedYearValue !== null && metaValue !== null && metaValue > 0 &&
                  (higherIsBetter ? selectedYearValue >= metaValue : selectedYearValue <= metaValue);

                return (
                  <React.Fragment key={index}>
                    <tr 
                      className={cn(
                        "border-t border-slate-100 transition-all duration-200",
                        isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50/30",
                        "cursor-pointer"
                      )}
                      onClick={() => toggleRowExpansion(monthNumber)}
                    >
                      {/* Mes */}
                      <td className="p-2 md:p-3 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="text-plasma-blue animate-spin" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-400" />
                            )}
                          </motion.div>
                          <span className="text-vision-ink font-medium text-xs md:text-sm">{row.mes}</span>
                        </div>
                      </td>

                      {/* Valores por año */}
                      {sortedYears.map((year) => {
                        const key = viewType === 'accumulated' ? `acumulado_${year}` : `valor_${year}`;
                        const value = row[key] as number | null;
                        const isSelectedYear = year === selectedYear;
                        const achieved = isSelectedYear && metaAchieved;

                        return (
                          <td 
                            key={year} 
                            className={cn(
                              "p-2 md:p-3 text-right transition-all duration-300",
                              achieved ? "text-emerald-700 font-semibold" : "text-vision-ink/80",
                              isSelectedYear && "font-medium"
                            )}
                          >
                            <div className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-all duration-300",
                              achieved && "bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm ring-1 ring-emerald-200/50"
                            )}>
                              {achieved && (
                                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
                              )}
                              <span className="tabular-nums text-xs md:text-sm">
                                {value !== null ? formatValue(value) : '-'}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Meta */}
                      <td className={cn(
                        "p-2 md:p-3 text-right font-medium transition-all duration-300",
                        metaAchieved ? "text-emerald-600" : "text-plasma-blue"
                      )}>
                        <div className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-all duration-300",
                          metaAchieved && "bg-gradient-to-r from-emerald-100 to-green-100 shadow-sm ring-1 ring-emerald-300/60"
                        )}>
                          {metaAchieved && (
                            <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500" />
                          )}
                          <span className="tabular-nums text-xs md:text-sm">
                            {metaValue !== null ? formatValue(metaValue) : '-'}
                          </span>
                          {metaAchieved && (
                            <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Contenido expandido */}
                    <AnimatePresence>
                      {isExpanded && detailDataByMonth[monthNumber] && (
                        renderExpandedContent(monthNumber, 0)
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-soft-slate">
        <span className="flex items-center gap-1">
          <ChevronRight size={12} />
          Click en fila para expandir
        </span>
        <span className="hidden sm:flex items-center gap-1">
          <Sparkles size={12} className="text-emerald-500" />
          Meta alcanzada
        </span>
        {dimensionHierarchy.length > 1 && (
          <span className="flex items-center gap-1">
            <Layers size={12} className="text-plasma-blue" />
            {dimensionHierarchy.length} niveles de detalle
          </span>
        )}
      </div>
    </div>
  );
}

export default ExpandableDataTable;
