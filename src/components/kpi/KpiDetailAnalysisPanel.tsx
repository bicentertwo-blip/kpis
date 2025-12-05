import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  MapPin,
  Building2,
  Package,
  Users,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Trophy,
  AlertCircle,
  Database,
  Loader2,
  Info
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, SectionDefinition, DetailLayoutDefinition } from '@/types/kpi-definitions';
import { cn } from '@/utils/ui';

interface KpiDetailAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
  selectedSummaryIndex: number;
  summaryData: Record<string, unknown>[];
}

type DetailRecord = Record<string, unknown>;

// Configuración de dimensiones por tipo de campo
const DIMENSION_CONFIG: Record<string, { icon: React.ElementType; label: string; priority: number }> = {
  region: { icon: MapPin, label: 'Región', priority: 1 },
  plaza: { icon: Building2, label: 'Plaza', priority: 2 },
  entidad: { icon: Building2, label: 'Entidad', priority: 3 },
  producto: { icon: Package, label: 'Producto', priority: 4 },
  puesto: { icon: Users, label: 'Puesto', priority: 5 },
  comite: { icon: Users, label: 'Comité', priority: 6 },
  categoria: { icon: Layers, label: 'Categoría', priority: 7 },
  tipo: { icon: Layers, label: 'Tipo', priority: 8 },
  proyecto: { icon: Layers, label: 'Proyecto', priority: 9 },
  etapa: { icon: Layers, label: 'Etapa', priority: 10 },
};

// Colores para gráficas
const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#22c55e', '#eab308', '#0ea5e9'
];

// Umbrales para validación de consistencia
const CONSISTENCY_THRESHOLDS = {
  exact: 0.001,      // < 0.1% = redondeo
  minor: 0.01,       // < 1% = diferencia menor
  acceptable: 0.05,  // < 5% = aceptable
  major: 0.10        // > 10% = inconsistencia mayor
};

export function KpiDetailAnalysisPanel({
  config,
  filters,
  selectedSummaryIndex,
  summaryData
}: KpiDetailAnalysisPanelProps) {
  const [detailData, setDetailData] = useState<DetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'validation' | 'distribution' | 'ranking' | 'comparison'>('validation');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [isDimensionDropdownOpen, setIsDimensionDropdownOpen] = useState(false);
  
  const dimensionDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dimensionDropdownRef.current && !dimensionDropdownRef.current.contains(event.target as Node)) {
        setIsDimensionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
    };
  }, []);

  // Obtener el detalle correspondiente al resumen seleccionado
  const selectedDetail: DetailLayoutDefinition | undefined = useMemo(() => {
    if (!config.details || config.details.length === 0) return undefined;
    // Si hay múltiples detalles, intentar mapear por índice o buscar coincidencia
    if (config.details.length > selectedSummaryIndex) {
      return config.details[selectedSummaryIndex];
    }
    return config.details[0];
  }, [config.details, selectedSummaryIndex]);

  // Obtener el resumen seleccionado
  const selectedSummary: SectionDefinition | undefined = config.summaries[selectedSummaryIndex];

  // Detectar campo métrico principal del detalle
  const detailMetricKey = useMemo(() => {
    if (!selectedDetail?.columns) return 'valor';
    // Buscar el campo principal que no sea dimensión ni meta
    const excludeFields = ['anio', 'mes', 'meta', 'region', 'plaza', 'entidad', 'producto', 'puesto', 
                          'comite', 'categoria', 'tipo', 'proyecto', 'etapa', 'responsable', 'descripcion',
                          'riesgo', 'observaciones'];
    const metricField = selectedDetail.columns.find(
      col => !excludeFields.includes(col) && !col.startsWith('meta')
    );
    return metricField || 'valor';
  }, [selectedDetail]);

  // Detectar campo métrico del resumen para comparación
  const summaryMetricKey = useMemo(() => {
    if (!selectedSummary?.fields) return 'valor';
    const metricField = selectedSummary.fields.find(
      f => !['anio', 'mes', 'meta'].includes(f.id) && !f.id.startsWith('meta_anual') && !f.id.startsWith('meta_')
    );
    return metricField?.id || 'valor';
  }, [selectedSummary]);

  // Determinar si es porcentaje
  const isPercentage = useMemo(() => {
    if (!selectedSummary?.fields) return false;
    const metricField = selectedSummary.fields.find(f => f.id === summaryMetricKey);
    return metricField?.type === 'percentage';
  }, [selectedSummary, summaryMetricKey]);

  // Detectar dimensiones disponibles en el detalle
  const availableDimensions = useMemo(() => {
    if (!selectedDetail?.columns) return [];
    const dimensionFields = selectedDetail.columns.filter(col => DIMENSION_CONFIG[col]);
    return dimensionFields.sort((a, b) => 
      (DIMENSION_CONFIG[a]?.priority || 99) - (DIMENSION_CONFIG[b]?.priority || 99)
    );
  }, [selectedDetail]);

  // Establecer dimensión por defecto
  useEffect(() => {
    if (availableDimensions.length > 0 && !selectedDimension) {
      // Priorizar plaza y región
      const preferred = availableDimensions.find(d => d === 'plaza' || d === 'region');
      setSelectedDimension(preferred || availableDimensions[0]);
    }
  }, [availableDimensions, selectedDimension]);

  // Cargar datos del detalle
  useEffect(() => {
    const loadDetailData = async () => {
      if (!selectedDetail?.tableName) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(selectedDetail.tableName)
          .select('*')
          .eq('anio', filters.anio)
          .eq('mes', filters.mes)
          .eq('is_current', true);

        if (error) throw error;
        setDetailData((data || []) as DetailRecord[]);
      } catch (err) {
        console.error('Error loading detail data:', err);
        setDetailData([]);
      } finally {
        setLoading(false);
      }
    };

    loadDetailData();
  }, [selectedDetail, filters]);

  // Formatear valor
  const formatValue = useCallback((v: number | null | undefined, short = false): string => {
    if (v === null || v === undefined) return '-';
    if (isPercentage) return `${v.toFixed(2)}%`;
    if (short && Math.abs(v) >= 1000000) {
      return `$${(v / 1000000).toFixed(1)}M`;
    }
    if (short && Math.abs(v) >= 1000) {
      return `$${(v / 1000).toFixed(0)}K`;
    }
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
  }, [isPercentage]);

  // =====================================================
  // CÁLCULOS DE VALIDACIÓN
  // =====================================================

  // Obtener valor del resumen para el mes/año seleccionado
  const summaryValue = useMemo(() => {
    const record = summaryData.find(
      d => Number(d.anio) === filters.anio && Number(d.mes) === filters.mes
    );
    if (!record) return null;
    return Number(record[summaryMetricKey]) || 0;
  }, [summaryData, filters, summaryMetricKey]);

  // Obtener meta del resumen
  const summaryMeta = useMemo(() => {
    const record = summaryData.find(
      d => Number(d.anio) === filters.anio && Number(d.mes) === filters.mes
    );
    if (!record || record.meta === null || record.meta === undefined) return null;
    return Number(record.meta);
  }, [summaryData, filters]);

  // Calcular suma/promedio de detalle
  const detailTotals = useMemo(() => {
    if (detailData.length === 0) return { value: null, meta: null, count: 0 };
    
    const values = detailData.map(d => Number(d[detailMetricKey]) || 0);
    const metas = detailData.map(d => Number(d.meta) || 0).filter(m => m > 0);
    
    // Para porcentajes: promedio ponderado o simple
    // Para moneda/número: suma
    const totalValue = isPercentage 
      ? values.reduce((a, b) => a + b, 0) / values.length
      : values.reduce((a, b) => a + b, 0);
    
    const totalMeta = isPercentage && metas.length > 0
      ? metas.reduce((a, b) => a + b, 0) / metas.length
      : metas.reduce((a, b) => a + b, 0);

    return {
      value: totalValue,
      meta: totalMeta > 0 ? totalMeta : null,
      count: detailData.length
    };
  }, [detailData, detailMetricKey, isPercentage]);

  // Validación de consistencia
  const consistencyValidation = useMemo(() => {
    if (summaryValue === null || detailTotals.value === null) {
      return { status: 'no-data', message: 'Sin datos para comparar', difference: 0, percentDiff: 0 };
    }

    const difference = detailTotals.value - summaryValue;
    const percentDiff = summaryValue !== 0 ? Math.abs(difference / summaryValue) : 0;

    if (percentDiff <= CONSISTENCY_THRESHOLDS.exact) {
      return { status: 'exact', message: 'Coincidencia exacta', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.minor) {
      return { status: 'rounding', message: 'Diferencia por redondeo', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.acceptable) {
      return { status: 'minor', message: 'Diferencia menor', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.major) {
      return { status: 'warning', message: 'Diferencia significativa', difference, percentDiff };
    } else {
      return { status: 'error', message: 'Inconsistencia mayor', difference, percentDiff };
    }
  }, [summaryValue, detailTotals.value]);

  // Validación de meta
  const metaValidation = useMemo(() => {
    if (summaryMeta === null || detailTotals.meta === null) {
      return { status: 'no-data', message: 'Sin meta para comparar', difference: 0, percentDiff: 0 };
    }

    const difference = detailTotals.meta - summaryMeta;
    const percentDiff = summaryMeta !== 0 ? Math.abs(difference / summaryMeta) : 0;

    if (percentDiff <= CONSISTENCY_THRESHOLDS.exact) {
      return { status: 'exact', message: 'Coincidencia exacta', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.minor) {
      return { status: 'rounding', message: 'Diferencia por redondeo', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.acceptable) {
      return { status: 'minor', message: 'Diferencia menor', difference, percentDiff };
    } else {
      return { status: 'error', message: 'Inconsistencia en meta', difference, percentDiff };
    }
  }, [summaryMeta, detailTotals.meta]);

  // =====================================================
  // ANÁLISIS POR DIMENSIÓN
  // =====================================================

  // Agrupar datos por dimensión seleccionada
  const groupedByDimension = useMemo(() => {
    if (!selectedDimension || detailData.length === 0) return [];

    const grouped: Record<string, { value: number; meta: number | null; count: number; items: DetailRecord[] }> = {};
    
    detailData.forEach(record => {
      const key = String(record[selectedDimension] || 'Sin clasificar');
      if (!grouped[key]) {
        grouped[key] = { value: 0, meta: null, count: 0, items: [] };
      }
      grouped[key].value += Number(record[detailMetricKey]) || 0;
      if (record.meta !== null && record.meta !== undefined) {
        grouped[key].meta = (grouped[key].meta || 0) + Number(record.meta);
      }
      grouped[key].count += 1;
      grouped[key].items.push(record);
    });

    // Para porcentajes, promediar
    if (isPercentage) {
      Object.keys(grouped).forEach(key => {
        grouped[key].value = grouped[key].value / grouped[key].count;
        if (grouped[key].meta !== null) {
          grouped[key].meta = grouped[key].meta! / grouped[key].count;
        }
      });
    }

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      value: data.value,
      meta: data.meta,
      count: data.count,
      items: data.items,
      compliance: data.meta ? (data.value / data.meta) * 100 : null,
      vsMetaDiff: data.meta ? data.value - data.meta : null
    })).sort((a, b) => b.value - a.value);
  }, [detailData, selectedDimension, detailMetricKey, isPercentage]);

  // Top 5 y Bottom 5
  const rankings = useMemo(() => {
    if (groupedByDimension.length === 0) return { top5: [], bottom5: [] };
    
    const sorted = [...groupedByDimension].sort((a, b) => b.value - a.value);
    return {
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse()
    };
  }, [groupedByDimension]);

  // Datos para gráfica de distribución (pie)
  const distributionData = useMemo(() => {
    const total = groupedByDimension.reduce((sum, item) => sum + Math.abs(item.value), 0);
    return groupedByDimension.slice(0, 8).map((item, index) => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      fullName: item.name,
      value: Math.abs(item.value),
      percentage: total > 0 ? (Math.abs(item.value) / total) * 100 : 0,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [groupedByDimension]);

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exact':
      case 'rounding':
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'minor':
        return <Info className="text-blue-500" size={18} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={18} />;
      case 'error':
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <AlertCircle className="text-slate-400" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exact':
      case 'rounding':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'minor':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  // Si no hay detalles configurados para este KPI
  if (!selectedDetail || config.details?.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass overflow-visible mt-6"
      >
        <div className="p-6 md:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Database className="text-slate-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-vision-ink mb-2">Sin Detalle Disponible</h3>
          <p className="text-soft-slate text-sm max-w-md mx-auto">
            Este indicador no tiene una sección de detalle configurada para importación de Excel.
            Los datos mostrados corresponden únicamente al resumen capturado manualmente.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass overflow-visible mt-6"
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200/50">
              <Layers className="text-indigo-600" size={18} />
            </div>
            <div>
              <h3 className="text-vision-ink font-semibold text-sm md:text-base">Análisis de Detalle</h3>
              <p className="text-soft-slate text-xs md:text-sm">
                {selectedDetail.title} • {detailData.length} registros
              </p>
            </div>
          </div>

          {/* Selector de dimensión */}
          {availableDimensions.length > 0 && (
            <div ref={dimensionDropdownRef} className="relative z-50 flex-shrink-0">
              <button
                onClick={() => setIsDimensionDropdownOpen(!isDimensionDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                         rounded-xl border border-slate-200 transition-all duration-200 min-w-[130px] shadow-soft"
              >
                {selectedDimension && DIMENSION_CONFIG[selectedDimension] && (
                  <>
                    {(() => {
                      const Icon = DIMENSION_CONFIG[selectedDimension].icon;
                      return <Icon size={14} className="text-indigo-500 flex-shrink-0" />;
                    })()}
                    <span className="text-vision-ink font-medium text-sm">
                      {DIMENSION_CONFIG[selectedDimension].label}
                    </span>
                  </>
                )}
                <ChevronDown 
                  size={14} 
                  className={`text-soft-slate ml-auto transition-transform duration-200 ${isDimensionDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isDimensionDropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-1 w-max min-w-[160px] bg-white 
                           rounded-xl border border-slate-200 shadow-2xl z-[9999]"
                >
                  {availableDimensions.map((dim) => {
                    const DimIcon = DIMENSION_CONFIG[dim]?.icon || Layers;
                    return (
                      <button
                        key={dim}
                        onClick={() => {
                          setSelectedDimension(dim);
                          setIsDimensionDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-all duration-150 flex items-center gap-2",
                          "first:rounded-t-xl last:rounded-b-xl",
                          selectedDimension === dim 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : 'text-vision-ink hover:bg-slate-50 active:bg-slate-100'
                        )}
                      >
                        <DimIcon size={14} />
                        <span className="text-sm font-medium">{DIMENSION_CONFIG[dim]?.label || dim}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs de vista */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {[
            { id: 'validation', label: 'Validación', icon: CheckCircle2 },
            { id: 'distribution', label: 'Distribución', icon: PieChartIcon },
            { id: 'ranking', label: 'Ranking', icon: Trophy },
            { id: 'comparison', label: 'Comparativo', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as typeof activeView)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200",
                activeView === tab.id
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/60 text-soft-slate hover:bg-white hover:text-vision-ink border border-slate-200/50'
              )}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : detailData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
              <AlertCircle className="text-amber-500" size={28} />
            </div>
            <h4 className="text-lg font-semibold text-vision-ink mb-2">Sin Datos Importados</h4>
            <p className="text-soft-slate text-sm max-w-md mx-auto">
              No hay datos de detalle importados para {filters.anio} - Mes {filters.mes}.
              Importa un archivo Excel en la sección de detalle para ver el análisis.
            </p>
          </div>
        ) : (
          <>
            {/* Vista: Validación */}
            {activeView === 'validation' && (
              <div className="space-y-4">
                {/* Card de validación principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Validación de Valor */}
                  <div className={cn(
                    "rounded-2xl border p-4",
                    getStatusColor(consistencyValidation.status)
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(consistencyValidation.status)}
                        <span className="font-semibold text-sm">Valor Principal</span>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        consistencyValidation.status === 'exact' || consistencyValidation.status === 'rounding'
                          ? 'bg-emerald-100 text-emerald-700'
                          : consistencyValidation.status === 'minor'
                          ? 'bg-blue-100 text-blue-700'
                          : consistencyValidation.status === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : consistencyValidation.status === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      )}>
                        {consistencyValidation.message}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs opacity-75">Resumen:</span>
                        <span className="font-bold">{formatValue(summaryValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs opacity-75">Σ Detalle:</span>
                        <span className="font-bold">{formatValue(detailTotals.value)}</span>
                      </div>
                      <div className="border-t border-current/20 pt-2 flex justify-between items-center">
                        <span className="text-xs opacity-75">Diferencia:</span>
                        <span className="font-semibold flex items-center gap-1">
                          {consistencyValidation.difference > 0 ? '+' : ''}
                          {formatValue(consistencyValidation.difference)}
                          <span className="text-xs">
                            ({(consistencyValidation.percentDiff * 100).toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Validación de Meta */}
                  <div className={cn(
                    "rounded-2xl border p-4",
                    getStatusColor(metaValidation.status)
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(metaValidation.status)}
                        <span className="font-semibold text-sm">Meta</span>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        metaValidation.status === 'exact' || metaValidation.status === 'rounding'
                          ? 'bg-emerald-100 text-emerald-700'
                          : metaValidation.status === 'minor'
                          ? 'bg-blue-100 text-blue-700'
                          : metaValidation.status === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      )}>
                        {metaValidation.message}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs opacity-75">Resumen:</span>
                        <span className="font-bold">{formatValue(summaryMeta)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs opacity-75">Σ Detalle:</span>
                        <span className="font-bold">{formatValue(detailTotals.meta)}</span>
                      </div>
                      <div className="border-t border-current/20 pt-2 flex justify-between items-center">
                        <span className="text-xs opacity-75">Diferencia:</span>
                        <span className="font-semibold flex items-center gap-1">
                          {metaValidation.difference > 0 ? '+' : ''}
                          {formatValue(metaValidation.difference)}
                          <span className="text-xs">
                            ({(metaValidation.percentDiff * 100).toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumen de registros */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={16} className="text-slate-500" />
                    <span className="font-semibold text-sm text-vision-ink">Resumen de Datos</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-soft-slate">Registros</p>
                      <p className="text-lg font-bold text-vision-ink">{detailTotals.count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-soft-slate">Dimensión</p>
                      <p className="text-lg font-bold text-vision-ink">
                        {groupedByDimension.length} {DIMENSION_CONFIG[selectedDimension]?.label || selectedDimension}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-soft-slate">Período</p>
                      <p className="text-lg font-bold text-vision-ink">{filters.mes}/{filters.anio}</p>
                    </div>
                    <div>
                      <p className="text-xs text-soft-slate">Tabla</p>
                      <p className="text-sm font-medium text-vision-ink truncate">{selectedDetail.tableName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vista: Distribución */}
            {activeView === 'distribution' && (
              <div className="space-y-4">
                {distributionData.length > 0 ? (
                  <>
                    {/* Gráfica de Pie */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4">
                      <h4 className="text-sm font-semibold text-vision-ink mb-4 flex items-center gap-2">
                        <PieChartIcon size={16} className="text-indigo-500" />
                        Distribución por {DIMENSION_CONFIG[selectedDimension]?.label || selectedDimension}
                      </h4>
                      <div className="h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, payload }) => `${name}: ${(payload?.percentage || 0).toFixed(1)}%`}
                              labelLine={false}
                            >
                              {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => formatValue(value)}
                              contentStyle={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Leyenda detallada */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {distributionData.map((item, index) => (
                        <div 
                          key={index}
                          className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-2"
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: item.fill }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-soft-slate truncate" title={item.fullName}>{item.name}</p>
                            <p className="text-sm font-semibold text-vision-ink">{item.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-soft-slate">
                    No hay datos suficientes para mostrar la distribución
                  </div>
                )}
              </div>
            )}

            {/* Vista: Ranking */}
            {activeView === 'ranking' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top 5 */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-4">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Top 5 - Mejores
                  </h4>
                  <div className="space-y-2">
                    {rankings.top5.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-white/80 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            index === 0 ? 'bg-amber-400 text-white' :
                            index === 1 ? 'bg-slate-300 text-slate-700' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-slate-100 text-slate-600'
                          )}>
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-vision-ink truncate">{item.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-bold text-emerald-700">{formatValue(item.value, true)}</p>
                          {item.compliance !== null && (
                            <p className="text-xs text-emerald-600">{item.compliance.toFixed(1)}% meta</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {rankings.top5.length === 0 && (
                      <p className="text-sm text-emerald-600 text-center py-4">Sin datos disponibles</p>
                    )}
                  </div>
                </div>

                {/* Bottom 5 */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <TrendingDown size={16} />
                    Bottom 5 - A Mejorar
                  </h4>
                  <div className="space-y-2">
                    {rankings.bottom5.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-white/80 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                            {groupedByDimension.length - rankings.bottom5.length + index + 1}
                          </span>
                          <span className="text-sm font-medium text-vision-ink truncate">{item.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-bold text-red-700">{formatValue(item.value, true)}</p>
                          {item.compliance !== null && (
                            <p className="text-xs text-red-600">{item.compliance.toFixed(1)}% meta</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {rankings.bottom5.length === 0 && (
                      <p className="text-sm text-red-600 text-center py-4">Sin datos disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Vista: Comparativo */}
            {activeView === 'comparison' && (
              <div className="space-y-4">
                {/* Gráfica de barras */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                  <h4 className="text-sm font-semibold text-vision-ink mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-500" />
                    Comparativo por {DIMENSION_CONFIG[selectedDimension]?.label || selectedDimension}
                  </h4>
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={groupedByDimension.slice(0, 10)} 
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis 
                          type="number" 
                          tickFormatter={(v) => formatValue(v, true)}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => v.length > 12 ? v.substring(0, 12) + '...' : v}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatValue(value), name === 'value' ? 'Valor' : 'Meta']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="meta" name="Meta" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla comparativa */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-vision-ink">
                            {DIMENSION_CONFIG[selectedDimension]?.label || selectedDimension}
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-vision-ink">Valor</th>
                          <th className="text-right px-4 py-3 font-semibold text-vision-ink">Meta</th>
                          <th className="text-right px-4 py-3 font-semibold text-vision-ink">Cumplimiento</th>
                          <th className="text-right px-4 py-3 font-semibold text-vision-ink">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {groupedByDimension.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-vision-ink">{item.name}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatValue(item.value, true)}</td>
                            <td className="px-4 py-3 text-right text-soft-slate">
                              {item.meta !== null ? formatValue(item.meta, true) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.compliance !== null ? (
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                  item.compliance >= 100 ? 'bg-emerald-100 text-emerald-700' :
                                  item.compliance >= 80 ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                )}>
                                  {item.compliance >= 100 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {item.compliance.toFixed(1)}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.vsMetaDiff !== null ? (
                                <span className={cn(
                                  "font-medium",
                                  item.vsMetaDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                                )}>
                                  {item.vsMetaDiff >= 0 ? '+' : ''}{formatValue(item.vsMetaDiff, true)}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
