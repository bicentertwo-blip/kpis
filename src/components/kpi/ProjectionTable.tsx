/**
 * ProjectionTable - Tabla de proyección por dimensión
 * Para la vista Meta Anual
 * Muestra Acumulado, Proyección y Meta por cada dimensión
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  ChevronDown,
  Loader2,
  Target,
  TrendingUp,
  Trophy,
  Sparkles,
  Layers,
  MapPin,
  Building2,
  Package,
  Users,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, DetailLayoutDefinition } from '@/types/kpi-definitions';
import { cn } from '@/utils/ui';

interface ProjectionTableProps {
  config: KpiDefinition;
  selectedSummaryIndex: number;
  selectedYear: number;
  currentMonth: number;
  totalAccumulated: number;
  totalProjection: number;
  metaAnual: number | null;
  formatValue: (value: number, short?: boolean) => string;
  higherIsBetter: boolean;
}

interface DimensionConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  priority: number;
}

interface DimensionProjection {
  name: string;
  accumulated: number;
  projection: number;
  meta: number | null;
  compliance: number | null;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

// Configuración de dimensiones
const DIMENSION_HIERARCHY: Record<string, DimensionConfig> = {
  entidad: { key: 'entidad', label: 'Entidad', icon: Building2, priority: 1 },
  region: { key: 'region', label: 'Región', icon: MapPin, priority: 2 },
  plaza: { key: 'plaza', label: 'Plaza', icon: Building2, priority: 3 },
  producto: { key: 'producto', label: 'Producto', icon: Package, priority: 4 },
  puesto: { key: 'puesto', label: 'Puesto', icon: Users, priority: 5 },
  comite: { key: 'comite', label: 'Comité', icon: Users, priority: 6 },
  categoria: { key: 'categoria', label: 'Categoría', icon: Layers, priority: 7 },
  tipo: { key: 'tipo', label: 'Tipo', icon: Layers, priority: 8 },
  proyecto: { key: 'proyecto', label: 'Proyecto', icon: Layers, priority: 9 },
  etapa: { key: 'etapa', label: 'Etapa', icon: Layers, priority: 10 },
};

// Colores por nivel
const DEPTH_COLORS = [
  'bg-slate-50/80',
  'bg-blue-50/60',
  'bg-indigo-50/50',
  'bg-violet-50/40',
];

const DEPTH_BORDERS = [
  'border-l-emerald-400',
  'border-l-blue-400',
  'border-l-indigo-400',
  'border-l-violet-400',
];

export function ProjectionTable({
  config,
  selectedSummaryIndex,
  selectedYear,
  currentMonth,
  totalAccumulated,
  totalProjection,
  metaAnual,
  formatValue,
  higherIsBetter
}: ProjectionTableProps) {
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());
  const [detailData, setDetailData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDimensionKey, setSelectedDimensionKey] = useState<string>('');
  const [isDimensionSelectorOpen, setIsDimensionSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsDimensionSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener detalle
  const selectedDetail: DetailLayoutDefinition | undefined = useMemo(() => {
    if (!config.details || config.details.length === 0) return undefined;
    if (config.details.length > selectedSummaryIndex) {
      return config.details[selectedSummaryIndex];
    }
    return config.details[0];
  }, [config.details, selectedSummaryIndex]);

  // Dimensiones disponibles
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

  // Jerarquía de dimensiones
  const dimensionHierarchy = useMemo(() => {
    if (!selectedDimensionKey || availableDimensions.length === 0) return [];
    const selectedIndex = availableDimensions.findIndex(d => d.key === selectedDimensionKey);
    if (selectedIndex === -1) return [];
    return availableDimensions.slice(selectedIndex);
  }, [availableDimensions, selectedDimensionKey]);

  // Establecer dimensión por defecto
  useEffect(() => {
    if (availableDimensions.length > 0 && !selectedDimensionKey) {
      setSelectedDimensionKey(availableDimensions[0].key);
    }
  }, [availableDimensions, selectedDimensionKey]);

  // Campo métrico
  const metricKey = useMemo(() => {
    if (!selectedDetail?.columns) return 'valor';
    const excludeFields = ['anio', 'mes', 'meta', 'is_current', 'owner_id', 'id', 'created_at',
                          ...Object.keys(DIMENSION_HIERARCHY)];
    const metricField = selectedDetail.columns.find(
      col => !excludeFields.includes(col) && !col.startsWith('meta')
    );
    return metricField || 'valor';
  }, [selectedDetail]);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!selectedDetail) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(selectedDetail.tableName)
          .select('*')
          .eq('anio', selectedYear)
          .eq('is_current', true)
          .lte('mes', currentMonth);

        if (error) throw error;
        setDetailData((data || []) as Record<string, unknown>[]);
      } catch (err) {
        console.error('Error loading projection data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDetail, selectedYear, currentMonth]);

  // Agrupar datos por dimensión y calcular proyección
  const getProjectionsByDimension = useCallback((
    dimensionKey: string,
    parentFilters: Record<string, string> = {}
  ): DimensionProjection[] => {
    if (detailData.length === 0 || currentMonth === 0) return [];

    const grouped: Record<string, { accumulated: number; meta: number }> = {};
    
    detailData.forEach(row => {
      // Aplicar filtros padre
      let matches = true;
      for (const [key, value] of Object.entries(parentFilters)) {
        if (row[key] !== value) matches = false;
      }
      if (!matches) return;

      const dimValue = String(row[dimensionKey] || 'Sin clasificar');
      if (!grouped[dimValue]) {
        grouped[dimValue] = { accumulated: 0, meta: 0 };
      }
      grouped[dimValue].accumulated += Number(row[metricKey]) || 0;
      grouped[dimValue].meta += Number(row.meta) || 0;
    });

    return Object.entries(grouped)
      .map(([name, data]) => {
        // Calcular proyección anual
        const monthlyAvg = data.accumulated / currentMonth;
        const projection = monthlyAvg * 12;
        
        // Meta anual (si hay meta mensual, multiplicar por 12)
        const annualMeta = data.meta > 0 ? (data.meta / currentMonth) * 12 : null;
        
        // Cumplimiento proyectado
        const compliance = annualMeta ? (projection / annualMeta) * 100 : null;
        
        // Estado
        let status: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (compliance !== null) {
          if (higherIsBetter) {
            status = compliance >= 100 ? 'success' : compliance >= 85 ? 'warning' : 'danger';
          } else {
            status = compliance <= 100 ? 'success' : compliance <= 115 ? 'warning' : 'danger';
          }
        }

        return {
          name,
          accumulated: data.accumulated,
          projection,
          meta: annualMeta,
          compliance,
          status
        };
      })
      .sort((a, b) => b.projection - a.projection);
  }, [detailData, currentMonth, metricKey, higherIsBetter]);

  // Toggle expansión
  const toggleDimension = (key: string) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Colapsar: eliminar este y todos los hijos
        const keysToDelete = Array.from(next).filter(k => k.startsWith(key));
        keysToDelete.forEach(k => next.delete(k));
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Renderizar icono de estado
  const renderStatusIcon = (status: DimensionProjection['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'warning':
        return <AlertCircle size={14} className="text-amber-500" />;
      case 'danger':
        return <AlertCircle size={14} className="text-rose-500" />;
      default:
        return null;
    }
  };

  // Renderizar filas de dimensión (recursivo)
  const renderDimensionRows = (
    level: number = 0,
    parentFilters: Record<string, string> = {},
    parentKey: string = ''
  ): React.ReactNode => {
    if (level >= dimensionHierarchy.length) return null;

    const currentDimension = dimensionHierarchy[level];
    const projections = getProjectionsByDimension(currentDimension.key, parentFilters);
    const depthColor = DEPTH_COLORS[Math.min(level, DEPTH_COLORS.length - 1)];
    const borderColor = DEPTH_BORDERS[Math.min(level, DEPTH_BORDERS.length - 1)];
    const hasNextLevel = level + 1 < dimensionHierarchy.length;
    const DimIcon = currentDimension.icon;

    return (
      <>
        {projections.map((item) => {
          const rowKey = `${parentKey}${currentDimension.key}-${item.name}`;
          const isExpanded = expandedDimensions.has(rowKey);

          return (
            <React.Fragment key={rowKey}>
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "border-t border-slate-100/80 transition-colors",
                  depthColor,
                  "hover:bg-white/60",
                  hasNextLevel && "cursor-pointer"
                )}
                onClick={() => hasNextLevel && toggleDimension(rowKey)}
              >
                {/* Nombre */}
                <td className={cn("p-2 md:p-3", `border-l-4 ${borderColor}`)}>
                  <div 
                    className="flex items-center gap-1.5 md:gap-2"
                    style={{ paddingLeft: `${level * 16}px` }}
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
                    <span className="text-vision-ink/80 text-xs md:text-sm font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                </td>

                {/* Acumulado */}
                <td className="p-2 md:p-3 text-right">
                  <span className="text-vision-ink text-xs md:text-sm tabular-nums">
                    {formatValue(item.accumulated)}
                  </span>
                </td>

                {/* Proyección */}
                <td className="p-2 md:p-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {item.projection > item.accumulated && (
                      <TrendingUp size={12} className="text-plasma-blue hidden sm:block" />
                    )}
                    <span className="text-plasma-blue font-medium text-xs md:text-sm tabular-nums">
                      {formatValue(item.projection)}
                    </span>
                  </div>
                </td>

                {/* Meta */}
                <td className="p-2 md:p-3 text-right">
                  <span className="text-amber-600 text-xs md:text-sm tabular-nums">
                    {item.meta !== null ? formatValue(item.meta) : '-'}
                  </span>
                </td>

                {/* Cumplimiento */}
                <td className="p-2 md:p-3 text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    item.status === 'success' && "bg-emerald-50 text-emerald-700",
                    item.status === 'warning' && "bg-amber-50 text-amber-700",
                    item.status === 'danger' && "bg-rose-50 text-rose-700",
                    item.status === 'neutral' && "bg-slate-50 text-slate-600"
                  )}>
                    {renderStatusIcon(item.status)}
                    <span className="tabular-nums">
                      {item.compliance !== null ? `${item.compliance.toFixed(0)}%` : '-'}
                    </span>
                  </div>
                </td>
              </motion.tr>

              {/* Subdimensiones */}
              <AnimatePresence>
                {isExpanded && renderDimensionRows(
                  level + 1,
                  { ...parentFilters, [currentDimension.key]: item.name },
                  `${rowKey}/`
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Si no hay detalle
  if (!selectedDetail || availableDimensions.length === 0) {
    return null;
  }

  const totalCompliance = metaAnual ? (totalProjection / metaAnual) * 100 : null;
  const totalStatus = totalCompliance !== null 
    ? (higherIsBetter 
        ? (totalCompliance >= 100 ? 'success' : totalCompliance >= 85 ? 'warning' : 'danger')
        : (totalCompliance <= 100 ? 'success' : totalCompliance <= 115 ? 'warning' : 'danger'))
    : 'neutral';

  const selectedDimension = availableDimensions.find(d => d.key === selectedDimensionKey);

  return (
    <div className="space-y-3">
      {/* Selector de dimensión */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-sm text-soft-slate">
          <Target size={16} className="text-amber-500" />
          <span className="hidden sm:inline">Proyección por:</span>
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
                      setExpandedDimensions(new Set());
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

      {/* Tabla de proyección */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-amber-50/80 to-orange-50/60">
                <th className="text-left text-soft-slate p-2 md:p-3 font-medium">
                  <span className="text-xs md:text-sm">Concepto</span>
                </th>
                <th className="text-right text-soft-slate p-2 md:p-3 font-medium min-w-[90px]">
                  <span className="text-xs md:text-sm">Acumulado</span>
                </th>
                <th className="text-right text-soft-slate p-2 md:p-3 font-medium min-w-[90px]">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp size={12} className="text-plasma-blue hidden sm:block" />
                    <span className="text-xs md:text-sm">Proyección</span>
                  </div>
                </th>
                <th className="text-right text-soft-slate p-2 md:p-3 font-medium min-w-[90px]">
                  <div className="flex items-center justify-end gap-1">
                    <Trophy size={12} className="text-amber-500 hidden sm:block" />
                    <span className="text-xs md:text-sm">Meta Anual</span>
                  </div>
                </th>
                <th className="text-right text-soft-slate p-2 md:p-3 font-medium min-w-[80px]">
                  <span className="text-xs md:text-sm">Estado</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Fila Total */}
              <tr className="bg-gradient-to-r from-slate-100/80 to-slate-50/60 font-semibold">
                <td className="p-2 md:p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-plasma-blue" />
                    <span className="text-vision-ink text-xs md:text-sm">TOTAL</span>
                  </div>
                </td>
                <td className="p-2 md:p-3 text-right">
                  <span className="text-vision-ink text-xs md:text-sm tabular-nums">
                    {formatValue(totalAccumulated)}
                  </span>
                </td>
                <td className="p-2 md:p-3 text-right">
                  <span className="text-plasma-blue text-xs md:text-sm tabular-nums">
                    {formatValue(totalProjection)}
                  </span>
                </td>
                <td className="p-2 md:p-3 text-right">
                  <span className="text-amber-600 text-xs md:text-sm tabular-nums">
                    {metaAnual !== null ? formatValue(metaAnual) : '-'}
                  </span>
                </td>
                <td className="p-2 md:p-3 text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    totalStatus === 'success' && "bg-emerald-100 text-emerald-700",
                    totalStatus === 'warning' && "bg-amber-100 text-amber-700",
                    totalStatus === 'danger' && "bg-rose-100 text-rose-700",
                    totalStatus === 'neutral' && "bg-slate-100 text-slate-600"
                  )}>
                    {totalStatus === 'success' && <CheckCircle2 size={14} />}
                    {totalStatus === 'warning' && <AlertCircle size={14} />}
                    {totalStatus === 'danger' && <AlertCircle size={14} />}
                    <span className="tabular-nums">
                      {totalCompliance !== null ? `${totalCompliance.toFixed(0)}%` : '-'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Filas de dimensión */}
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-plasma-blue mx-auto" />
                    <p className="text-soft-slate text-sm mt-2">Calculando proyecciones...</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {renderDimensionRows()}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-soft-slate">
        <span className="flex items-center gap-1">
          <ChevronRight size={12} />
          Click para expandir
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          ≥100%
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          85-99%
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          &lt;85%
        </span>
      </div>
    </div>
  );
}

export default ProjectionTable;
