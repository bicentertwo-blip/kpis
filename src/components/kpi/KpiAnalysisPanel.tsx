import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend, LabelList, Cell } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart2, 
  Activity,
  Target,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Layers,
  Lightbulb,
  Calculator
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, SectionDefinition } from '@/types/kpi-definitions';
import { KpiValidationPanel } from './KpiValidationPanel';
import { InsightsPanel } from './InsightsPanel';
import { ExpandableDataTable } from './ExpandableDataTable';
import { ProjectionTable } from './ProjectionTable';
import { CarteraCrecimientoAnalysisPanel } from './CarteraCrecimientoAnalysisPanel';

interface KpiAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type SummaryRecord = Record<string, unknown>;

export function KpiAnalysisPanel({
  config,
  filters: initialFilters
}: KpiAnalysisPanelProps) {
  const [activeView, setActiveView] = useState<'overview' | 'monthly' | 'accumulated' | 'annual'>('overview');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSummaryDropdownOpen, setIsSummaryDropdownOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(initialFilters.anio);
  const [selectedSummaryIndex, setSelectedSummaryIndex] = useState(0);
  
  // Refs para click-outside detection en móvil
  const summaryDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer click fuera (importante para móvil)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (summaryDropdownRef.current && !summaryDropdownRef.current.contains(event.target as Node)) {
        setIsSummaryDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
    };
  }, []);

  // Resumen seleccionado
  const selectedSummary: SectionDefinition | undefined = config.summaries[selectedSummaryIndex];

  // Detectar la clave de métrica principal del resumen seleccionado
  const metricKey = useMemo(() => {
    if (!selectedSummary?.fields) return 'valor';
    // Buscar el primer campo que no sea anio, mes, meta, meta_anual ni empiece con meta_anual
    const metricField = selectedSummary.fields.find(
      f => !['anio', 'mes', 'meta'].includes(f.id) && !f.id.startsWith('meta_anual') && !f.id.startsWith('meta_')
    );
    return metricField?.id || 'valor';
  }, [selectedSummary]);

  const metricLabel = useMemo(() => {
    if (!selectedSummary?.fields) return 'Valor';
    const metricField = selectedSummary.fields.find(f => f.id === metricKey);
    return metricField?.label || 'Valor';
  }, [selectedSummary, metricKey]);

  // Determinar el tipo de campo para formato y agregación
  const fieldType = useMemo(() => {
    if (!selectedSummary?.fields) return 'currency';
    const metricField = selectedSummary.fields.find(f => f.id === metricKey);
    return metricField?.type || 'currency';
  }, [selectedSummary, metricKey]);

  // Determinar si es porcentaje o índice (para saber si promediar o sumar)
  const isPercentage = fieldType === 'percentage';
  const isIndex = fieldType === 'index';
  const isNumber = fieldType === 'number'; // Números simples (personas, cantidad, etc.)
  const shouldAverage = isPercentage || isIndex;

  // Determinar tipo de agregación: si tiene aggregationType explícito, usarlo; sino, avg para porcentaje/index, sum para el resto
  const shouldSum = useMemo(() => {
    if (selectedSummary?.aggregationType) {
      return selectedSummary.aggregationType === 'sum';
    }
    // Default: sumar para moneda/número, promediar para porcentaje/index
    return !shouldAverage;
  }, [selectedSummary, shouldAverage]);

  // Determinar si mayor es mejor (para semáforos y progreso)
  const higherIsBetter = useMemo(() => {
    return selectedSummary?.higherIsBetter !== false; // Default: true
  }, [selectedSummary]);

  const formatValue = useCallback((v: number): string => {
    if (v === null || v === undefined) return '-';
    if (isPercentage) return `${v.toFixed(2)}%`;
    if (isIndex) return v.toFixed(1); // Formato de índice: número con 1 decimal
    if (isNumber) return Math.round(v).toLocaleString('es-MX'); // Número entero con separadores de miles
    // Default: moneda
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
  }, [isPercentage, isIndex, isNumber]);

  // Cargar datos del resumen seleccionado
  useEffect(() => {
    const loadData = async () => {
      const tableName = selectedSummary?.tableName;
      if (!tableName) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('is_current', true)
          .order('anio', { ascending: true })
          .order('mes', { ascending: true });

        if (error) throw error;
        setSummaryData((data || []) as SummaryRecord[]);
      } catch (err) {
        console.error('Error loading summary data:', err);
        setSummaryData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSummary]);

  // Años disponibles
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    summaryData.forEach((item: SummaryRecord) => {
      const year = Number(item.anio);
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [summaryData]);

  // Seleccionar año más reciente si no hay seleccionado
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Agrupar datos por año
  const dataByYear = useMemo(() => {
    const grouped: Record<number, SummaryRecord[]> = {};
    summaryData.forEach((item: SummaryRecord) => {
      const year = Number(item.anio);
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(item);
    });
    // Ordenar cada año por mes
    Object.keys(grouped).forEach(year => {
      grouped[Number(year)].sort((a, b) => Number(a.mes) - Number(b.mes));
    });
    return grouped;
  }, [summaryData]);

  // Datos del año seleccionado
  const currentYearData = useMemo(() => {
    if (!selectedYear || !dataByYear[selectedYear]) return [];
    return dataByYear[selectedYear];
  }, [selectedYear, dataByYear]);

  // Obtener meta anual del año seleccionado (busca cualquier campo que empiece con meta_anual)
  const metaAnual = useMemo(() => {
    for (const item of currentYearData) {
      // Buscar cualquier campo que empiece con meta_anual y tenga valor
      const metaAnualField = Object.keys(item).find(
        key => key.startsWith('meta_anual') && item[key] !== null && item[key] !== undefined
      );
      if (metaAnualField) {
        return Number(item[metaAnualField]);
      }
    }
    return null;
  }, [currentYearData]);

  // Datos para gráfica mensual
  const monthlyChartData = useMemo(() => {
    return MONTH_NAMES.map((month, index) => {
      const monthNum = index + 1;
      const entry: Record<string, unknown> = { mes: month, mesNum: monthNum };
      
      // Agregar datos de cada año disponible
      availableYears.forEach((year: number) => {
        const yearData = dataByYear[year]?.find((d: SummaryRecord) => Number(d.mes) === monthNum);
        entry[`valor_${year}`] = yearData ? Number(yearData[metricKey]) || 0 : null;
      });
      
      // Agregar meta mensual del año seleccionado
      const selectedYearData = dataByYear[selectedYear]?.find((d: SummaryRecord) => Number(d.mes) === monthNum);
      if (selectedYearData && selectedYearData.meta !== undefined && selectedYearData.meta !== null) {
        entry['meta'] = Number(selectedYearData.meta);
      } else {
        entry['meta'] = null;
      }
      
      return entry;
    });
  }, [dataByYear, availableYears, metricKey, selectedYear]);

  // Función para calcular acumulado (suma o promedio según configuración)
  const calculateAccumulated = useCallback((data: SummaryRecord[], upToMonth: number): number => {
    const filtered = data.filter((d: SummaryRecord) => Number(d.mes) <= upToMonth);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc: number, d: SummaryRecord) => acc + (Number(d[metricKey]) || 0), 0);
    
    // Usar shouldSum para determinar si sumar o promediar
    return shouldSum ? sum : sum / filtered.length;
  }, [metricKey, shouldSum]);

  // Función para calcular meta acumulada (suma para moneda, promedio para porcentaje)
  const calculateAccumulatedMeta = useCallback((data: SummaryRecord[], upToMonth: number): number | null => {
    const filtered = data.filter((d: SummaryRecord) => Number(d.mes) <= upToMonth && d.meta !== null && d.meta !== undefined);
    if (filtered.length === 0) return null;
    
    const sum = filtered.reduce((acc: number, d: SummaryRecord) => acc + (Number(d.meta) || 0), 0);
    
    // Sumar para moneda, promediar para porcentaje
    return shouldSum ? sum : sum / filtered.length;
  }, [shouldSum]);

  // Datos acumulados por año (suma o promedio según configuración)
  const accumulatedChartData = useMemo(() => {
    return MONTH_NAMES.map((month, index) => {
      const monthNum = index + 1;
      const entry: Record<string, unknown> = { mes: month, mesNum: monthNum };
      
      availableYears.forEach((year: number) => {
        const yearData = dataByYear[year] || [];
        const accumulated = calculateAccumulated(yearData, monthNum);
        entry[`acumulado_${year}`] = accumulated || null;
      });
      
      // Agregar meta anual como línea de referencia (para gráfica)
      if (metaAnual) {
        entry['meta_anual'] = metaAnual;
      }
      
      // Agregar meta acumulada (suma o promedio de metas mensuales hasta este mes)
      const selectedYearData = dataByYear[selectedYear] || [];
      const metaAcumulada = calculateAccumulatedMeta(selectedYearData, monthNum);
      entry['meta_acumulada'] = metaAcumulada;
      
      return entry;
    });
  }, [dataByYear, availableYears, calculateAccumulated, metaAnual, selectedYear, calculateAccumulatedMeta]);

  // Métricas del mes más reciente
  const latestMetrics = useMemo(() => {
    if (currentYearData.length === 0) return null;
    const latest = currentYearData[currentYearData.length - 1];
    const latestMonth = Number(latest.mes);
    
    // Buscar mismo mes en años anteriores
    const previousYearComparisons: Record<number, { value: number; change: number; changePercent: number }> = {};
    
    availableYears.filter((y: number) => y !== selectedYear).forEach((year: number) => {
      const sameMonthData = dataByYear[year]?.find((d: SummaryRecord) => Number(d.mes) === latestMonth);
      if (sameMonthData) {
        const prevValue = Number(sameMonthData[metricKey]) || 0;
        const currentValue = Number(latest[metricKey]) || 0;
        previousYearComparisons[year] = {
          value: prevValue,
          change: currentValue - prevValue,
          changePercent: prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0
        };
      }
    });

    // Calcular acumulado actual (suma para moneda, promedio para porcentaje)
    const currentAccumulated = calculateAccumulated(currentYearData, latestMonth);
    
    // Comparar acumulado con años anteriores
    const accumulatedComparisons: Record<number, { value: number; change: number; changePercent: number }> = {};
    
    availableYears.filter((y: number) => y !== selectedYear).forEach((year: number) => {
      const yearData = dataByYear[year] || [];
      const prevAccumulated = calculateAccumulated(yearData, latestMonth);
      
      if (prevAccumulated > 0) {
        accumulatedComparisons[year] = {
          value: prevAccumulated,
          change: currentAccumulated - prevAccumulated,
          changePercent: ((currentAccumulated - prevAccumulated) / prevAccumulated) * 100
        };
      }
    });

    // Progreso hacia meta anual
    let metaProgress = null;
    if (metaAnual && metaAnual > 0) {
      // Para valores que se promedian: el acumulado ya es el promedio, comparar directamente con meta
      // Para valores que se suman: proyectar al año completo
      const percent = (currentAccumulated / metaAnual) * 100;
      const projectedAnnual = shouldSum 
        ? (latestMonth > 0 ? (currentAccumulated / latestMonth) * 12 : 0)  // Proyectar proporcionalmente
        : currentAccumulated;  // Para promedios, el valor actual es la proyección
      
      metaProgress = {
        current: currentAccumulated,
        target: metaAnual,
        percent,
        remaining: metaAnual - currentAccumulated,
        monthsRemaining: 12 - latestMonth,
        projectedAnnual
      };
    }

    return {
      current: Number(latest[metricKey]) || 0,
      month: latestMonth,
      monthName: FULL_MONTH_NAMES[latestMonth - 1],
      accumulated: currentAccumulated,
      previousYearComparisons,
      accumulatedComparisons,
      metaProgress
    };
  }, [currentYearData, dataByYear, availableYears, selectedYear, metricKey, metaAnual, calculateAccumulated, shouldSum]);

  // Colores para años en gráficas - paleta distintiva y vibrante
  const yearColors: Record<number, string> = useMemo(() => {
    // Colores bien diferenciados que no se oscurecen al superponerse
    const palette = [
      '#059669', // Emerald 600 - año más reciente
      '#2563eb', // Blue 600
      '#d97706', // Amber 600
      '#dc2626', // Red 600
      '#7c3aed', // Violet 600
      '#db2777', // Pink 600
      '#0891b2', // Cyan 600
      '#65a30d', // Lime 600
    ];
    const colors: Record<number, string> = {};
    [...availableYears].sort((a, b) => b - a).forEach((year: number, index: number) => {
      colors[year] = palette[index % palette.length];
    });
    return colors;
  }, [availableYears]);

  const renderTrend = (value: number, size: 'sm' | 'md' = 'sm') => {
    const isPositive = value >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-emerald-600' : 'text-rose-500';
    const iconSize = size === 'sm' ? 14 : 18;
    
    return (
      <span className={`inline-flex items-center gap-1 ${colorClass}`}>
        <Icon size={iconSize} />
        <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
      </span>
    );
  };

  const renderComparisonCard = (
    title: string,
    comparisons: Record<number, { value: number; change: number; changePercent: number }>,
    format: (v: number) => string
  ) => {
    const years = Object.keys(comparisons).map(Number).sort((a, b) => b - a);
    
    if (years.length === 0) {
      return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
          <h4 className="text-soft-slate text-sm mb-2">{title}</h4>
          <p className="text-slate-400 text-xs">Sin datos de años anteriores</p>
        </div>
      );
    }

    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
        <h4 className="text-soft-slate text-sm font-medium mb-3">{title}</h4>
        <div className="space-y-2.5">
          {years.slice(0, 3).map(year => {
            const comp = comparisons[year];
            return (
              <div key={year} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                    style={{ backgroundColor: yearColors[year] }}
                  />
                  <span className="text-vision-ink font-medium text-sm">{year}</span>
                  <span className="text-soft-slate text-xs">({format(comp.value)})</span>
                </div>
                {renderTrend(comp.changePercent)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMetaProgress = () => {
    if (!latestMetrics?.metaProgress) return null;
    
    const { current, target, percent, remaining, monthsRemaining, projectedAnnual } = latestMetrics.metaProgress;
    
    // isOnTrack depende de si mayor es mejor o no
    const isOnTrack = higherIsBetter 
      ? projectedAnnual >= target  // Mayor es mejor: proyección >= meta
      : projectedAnnual <= target; // Menor es mejor: proyección <= meta
    
    // Colores según el avance (invertidos si menor es mejor)
    const effectivePercent = higherIsBetter ? percent : (target > 0 ? (target / current) * 100 : 0);
    const progressColor = isOnTrack ? '#10b981' : effectivePercent >= 75 ? '#f59e0b' : '#ef4444';
    const progressBg = isOnTrack ? 'from-emerald-500 to-teal-500' : effectivePercent >= 75 ? 'from-amber-500 to-orange-500' : 'from-rose-500 to-red-500';
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/80 shadow-glass"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 border border-amber-200/50">
            <Target className="text-amber-600" size={18} />
          </div>
          <h4 className="text-vision-ink font-semibold">Progreso hacia Meta Anual</h4>
        </div>
        
        {/* Barra de progreso elegante */}
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-5 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${progressBg} shadow-lg`}
          />
          {percent > 100 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percent - 100, 100)}%` }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute inset-y-0 right-0 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-r-full"
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-slate-50/80 rounded-xl">
            <p className="text-soft-slate text-xs mb-1">Acumulado</p>
            <p className="text-vision-ink font-bold text-sm">{formatValue(current)}</p>
          </div>
          <div className="text-center p-3 bg-slate-50/80 rounded-xl">
            <p className="text-soft-slate text-xs mb-1">Meta Anual</p>
            <p className="text-vision-ink font-bold text-sm">{formatValue(target)}</p>
          </div>
          <div className="text-center p-3 bg-slate-50/80 rounded-xl">
            <p className="text-soft-slate text-xs mb-1">Avance</p>
            <p className="font-bold text-sm" style={{ color: progressColor }}>
              {percent.toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50/80 rounded-xl">
            <p className="text-soft-slate text-xs mb-1">Proyección</p>
            <p className={`font-bold text-sm ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
              {formatValue(projectedAnnual)}
            </p>
          </div>
        </div>
        
        {/* Estado del avance */}
        <div className={`mt-4 flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${isOnTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {isOnTrack ? (
            <>
              <CheckCircle2 size={16} />
              <span className="font-medium">En camino a cumplir la meta</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} />
              <span className="font-medium">
                {higherIsBetter 
                  ? `Faltan ${formatValue(Math.abs(remaining))} en ${monthsRemaining} meses restantes`
                  : `Excede la meta en ${formatValue(Math.abs(remaining))}`
                }
              </span>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass p-8">
        <div className="flex items-center justify-center gap-3 text-soft-slate">
          <Loader2 className="animate-spin text-plasma-blue" size={24} />
          <span>Cargando datos de análisis...</span>
        </div>
      </div>
    );
  }

  if (summaryData.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass p-8">
        {/* Si hay múltiples resúmenes, mostrar selector para poder cambiar */}
        {config.summaries.length > 1 && (
          <div className="flex justify-center mb-6">
            <div ref={summaryDropdownRef} className="relative z-50">
              <button
                onClick={() => setIsSummaryDropdownOpen(!isSummaryDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 
                         rounded-xl border border-slate-200 transition-all duration-200 shadow-soft"
              >
                <Layers size={16} className="text-plasma-indigo" />
                <span className="text-vision-ink font-medium text-sm">
                  {selectedSummary?.title || 'Seleccionar resumen'}
                </span>
                <ChevronDown 
                  size={14} 
                  className={`text-soft-slate transition-transform duration-200 ${isSummaryDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isSummaryDropdownOpen && (
                <div className="absolute left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto top-full mt-1 
                              min-w-full sm:min-w-[220px] sm:w-max bg-white 
                              rounded-xl border border-slate-200 shadow-2xl z-[9999]">
                  {config.summaries.map((summary, index) => (
                    <button
                      key={summary.id}
                      onClick={() => {
                        setSelectedSummaryIndex(index);
                        setIsSummaryDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-all duration-150 first:rounded-t-xl last:rounded-b-xl
                                ${selectedSummaryIndex === index 
                                  ? 'bg-plasma-blue/10 text-plasma-blue' 
                                  : 'text-vision-ink hover:bg-slate-50'}`}
                    >
                      <span className="text-sm font-medium">{summary.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
            <BarChart2 size={32} className="text-slate-400" />
          </div>
          <h4 className="text-vision-ink font-semibold text-lg mb-2">Sin datos disponibles</h4>
          <p className="text-soft-slate text-sm">
            {config.summaries.length > 1 
              ? `Captura datos en "${selectedSummary?.title || 'este resumen'}" o selecciona otro resumen arriba.`
              : 'Captura datos en la pestaña de Resumen para ver el análisis.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Panel especializado para Crecimiento de Cartera - reemplaza completamente el panel estándar
  if (selectedSummary?.id === 'resumen-crecimiento') {
    return (
      <CarteraCrecimientoAnalysisPanel 
        config={config}
        filters={initialFilters}
        selectedSummaryIndex={selectedSummaryIndex}
        onSummaryChange={setSelectedSummaryIndex}
      />
    );
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass overflow-visible"
    >
      {/* Header con selector de resumen, año y vistas */}
      <div className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-plasma-blue/10 to-plasma-indigo/10 border border-plasma-blue/20 flex-shrink-0">
              <BarChart2 className="text-plasma-blue" size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-vision-ink font-semibold text-sm md:text-base">Panel de Análisis</h3>
              <p className="text-soft-slate text-xs md:text-sm truncate">{metricLabel}</p>
            </div>
          </div>
          
          {/* Selectores de resumen y año */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Selector de resumen (solo si hay más de uno) */}
            {config.summaries.length > 1 && (
              <div ref={summaryDropdownRef} className="relative z-50 flex-shrink-0">
                <button
                  onClick={() => setIsSummaryDropdownOpen(!isSummaryDropdownOpen)}
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-2 bg-white/80 hover:bg-white 
                           rounded-xl border border-slate-200 transition-all duration-200 min-w-[200px] md:min-w-[220px] shadow-soft"
                >
                  <Layers size={14} className="text-plasma-indigo flex-shrink-0" />
                  <span className="text-vision-ink font-medium text-xs md:text-sm truncate max-w-[160px] md:max-w-[180px]">
                    {selectedSummary?.title?.replace(/^\d+\.\s*/, '') || 'Resumen'}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`text-soft-slate ml-auto transition-transform duration-200 flex-shrink-0 ${isSummaryDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {isSummaryDropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-1 w-max min-w-[200px] bg-white 
                             rounded-xl border border-slate-200 shadow-2xl z-[9999]"
                    style={{ position: 'absolute' }}
                    >
                    {config.summaries.map((summary, index) => (
                      <button
                        key={summary.id}
                        onClick={() => {
                          setSelectedSummaryIndex(index);
                          setIsSummaryDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left transition-all duration-150 first:rounded-t-xl last:rounded-b-xl
                                  ${selectedSummaryIndex === index 
                                    ? 'bg-plasma-blue/10 text-plasma-blue' 
                                    : 'text-vision-ink hover:bg-slate-50 active:bg-slate-100'}`}
                      >
                        <span className="text-sm font-medium">{summary.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selector de año */}
            <div ref={yearDropdownRef} className="relative z-50 flex-shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-2 bg-white/80 hover:bg-white 
                         rounded-xl border border-slate-200 transition-all duration-200 min-w-[85px] md:min-w-[100px] shadow-soft"
              >
                <Calendar size={14} className="text-plasma-blue flex-shrink-0" />
                <span className="text-vision-ink font-medium text-sm">{selectedYear || 'Año'}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-soft-slate ml-auto transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isDropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-1 w-max min-w-[120px] bg-white 
                           rounded-xl border border-slate-200 shadow-2xl z-[9999]"
                  style={{ position: 'absolute' }}
                  >
                    {availableYears.map((year: number) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left transition-all duration-150 first:rounded-t-xl last:rounded-b-xl
                                  ${selectedYear === year 
                                    ? 'bg-plasma-blue/10 text-plasma-blue' 
                                    : 'text-vision-ink hover:bg-slate-50 active:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                            style={{ backgroundColor: yearColors[year] }}
                          />
                          <span className="font-medium">{year}</span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs de vista - estilo elegante */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {[
            { id: 'overview', label: 'Resumen', icon: Activity },
            { id: 'monthly', label: 'Mensual', icon: Calendar },
            { id: 'accumulated', label: 'Acumulado', icon: TrendingUp },
            { id: 'annual', label: 'Meta Anual', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as typeof activeView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${activeView === tab.id 
                          ? 'bg-plasma-blue text-white shadow-md shadow-plasma-blue/25' 
                          : 'text-soft-slate hover:text-vision-ink hover:bg-slate-100'}`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4 md:p-5">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && latestMetrics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Valor actual */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-4 border border-emerald-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">{metricLabel} - {latestMetrics.monthName}</span>
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <Clock size={14} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-vision-ink mb-1">{formatValue(latestMetrics.current)}</p>
                  {Object.keys(latestMetrics.previousYearComparisons).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-soft-slate text-xs">vs año anterior:</span>
                      {renderTrend(Object.values(latestMetrics.previousYearComparisons)[0].changePercent)}
                    </div>
                  )}
                </div>

                {/* Acumulado */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 rounded-2xl p-4 border border-indigo-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Acumulado {selectedYear}</span>
                    <div className="p-1.5 rounded-lg bg-indigo-100">
                      <TrendingUp size={14} className="text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-vision-ink mb-1">{formatValue(latestMetrics.accumulated)}</p>
                  {Object.keys(latestMetrics.accumulatedComparisons).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-soft-slate text-xs">vs año anterior:</span>
                      {renderTrend(Object.values(latestMetrics.accumulatedComparisons)[0].changePercent)}
                    </div>
                  )}
                </div>

                {/* Meta anual */}
                {latestMetrics.metaProgress && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-100 shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-soft-slate text-sm">Avance Meta Anual</span>
                      <div className="p-1.5 rounded-lg bg-amber-100">
                        <Target size={14} className="text-amber-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-vision-ink mb-1">
                      {latestMetrics.metaProgress.percent.toFixed(1)}%
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-soft-slate text-xs">Meta:</span>
                      <span className="text-vision-ink/80 text-sm font-medium">{formatValue(latestMetrics.metaProgress.target)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Comparativas con años anteriores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderComparisonCard(
                  `Comparativa Mensual (${latestMetrics.monthName})`,
                  latestMetrics.previousYearComparisons,
                  formatValue
                )}
                {renderComparisonCard(
                  'Comparativa Acumulado',
                  latestMetrics.accumulatedComparisons,
                  formatValue
                )}
              </div>

              {/* Gráfica de tendencia */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Tendencia Mensual por Año</h4>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {availableYears.map((year: number, idx: number) => (
                          <linearGradient key={year} id={`gradient-${year}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={yearColors[year]} stopOpacity={idx === 0 ? 0.25 : 0.08} />
                            <stop offset="95%" stopColor={yearColors[year]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v: number) => formatValue(v)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => {
                          const year = name.split('_')[1];
                          return [formatValue(value), year];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 600 }}>{year}</span>;
                        }}
                      />
                      {[...availableYears].sort((a, b) => a - b).map((year: number) => (
                        <Area
                          key={year}
                          type="monotone"
                          dataKey={`valor_${year}`}
                          stroke={yearColors[year]}
                          fill={`url(#gradient-${year})`}
                          strokeWidth={year === selectedYear ? 3 : 2}
                          dot={year === selectedYear}
                          activeDot={{ r: 6, strokeWidth: 2, fill: yearColors[year] }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Panel de Insights Ejecutivos */}
              <InsightsPanel
                config={config}
                selectedSummaryIndex={selectedSummaryIndex}
                selectedYear={selectedYear}
                currentMonth={latestMetrics?.month || initialFilters.mes}
                accumulatedValue={latestMetrics?.accumulated || 0}
                metaAnual={metaAnual}
                formatValue={formatValue}
                higherIsBetter={higherIsBetter}
              />

              {/* Panel de Validación Resumen vs Detalle (solo en overview) */}
              <KpiValidationPanel
                config={config}
                selectedYear={selectedYear}
                currentMonth={latestMetrics?.month || initialFilters.mes}
                selectedSummaryIndex={selectedSummaryIndex}
                summaryAccumulated={latestMetrics?.accumulated || 0}
                summaryMetaAnual={metaAnual}
                metricLabel={metricLabel}
              />
            </motion.div>
          )}

          {activeView === 'monthly' && (
            <motion.div
              key="monthly"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Comparativa Mensual por Año</h4>
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v: number) => formatValue(v)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => {
                          const year = name.split('_')[1];
                          return [formatValue(value), year];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 500 }}>{year}</span>;
                        }}
                      />
                      {[...availableYears].sort((a, b) => a - b).map((year: number) => (
                        <Bar
                          key={year}
                          dataKey={`valor_${year}`}
                          fill={yearColors[year]}
                          radius={[4, 4, 0, 0]}
                          opacity={year === selectedYear ? 1 : 0.7}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla con Drill-Down por Dimensión - Vista Mensual */}
              <ExpandableDataTable
                config={config}
                selectedSummaryIndex={selectedSummaryIndex}
                availableYears={availableYears}
                selectedYear={selectedYear}
                monthlyData={monthlyChartData}
                viewType="monthly"
                formatValue={formatValue}
                higherIsBetter={higherIsBetter}
                yearColors={yearColors}
              />
            </motion.div>
          )}

          {activeView === 'accumulated' && (
            <motion.div
              key="accumulated"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Acumulado Anual por Mes</h4>
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accumulatedChartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickFormatter={(v: number) => formatValue(v)}
                        domain={['auto', 'auto']}
                        padding={{ top: 20, bottom: 20 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                          padding: '12px 16px'
                        }}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'meta_anual') return [formatValue(value), 'Meta Anual'];
                          const year = name.split('_')[1];
                          return [formatValue(value), `${year}`];
                        }}
                        itemStyle={{ padding: '2px 0' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '16px' }}
                        formatter={(value: string) => {
                          if (value === 'meta_anual') return <span style={{ color: '#d97706', fontWeight: 600 }}>Meta Anual</span>;
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 600 }}>{year}</span>;
                        }}
                      />
                      {metaAnual && (
                        <Line
                          type="monotone"
                          dataKey="meta_anual"
                          stroke="#d97706"
                          strokeWidth={2.5}
                          strokeDasharray="8 4"
                          dot={false}
                        />
                      )}
                      {[...availableYears].sort((a, b) => a - b).map((year: number) => (
                        <Line
                          key={year}
                          type="monotone"
                          dataKey={`acumulado_${year}`}
                          stroke={yearColors[year]}
                          strokeWidth={year === selectedYear ? 3.5 : 2.5}
                          dot={{ r: year === selectedYear ? 4 : 3, fill: yearColors[year], strokeWidth: 0 }}
                          activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: yearColors[year] }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla con Drill-Down por Dimensión - Vista Acumulado */}
              <ExpandableDataTable
                config={config}
                selectedSummaryIndex={selectedSummaryIndex}
                availableYears={availableYears}
                selectedYear={selectedYear}
                monthlyData={accumulatedChartData}
                viewType="accumulated"
                formatValue={formatValue}
                higherIsBetter={higherIsBetter}
                yearColors={yearColors}
              />
            </motion.div>
          )}

          {activeView === 'annual' && (
            <motion.div
              key="annual"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {renderMetaProgress()}
              
              {!latestMetrics?.metaProgress && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/80 shadow-soft text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Target size={24} className="text-soft-slate" />
                  </div>
                  <h4 className="text-vision-ink text-lg font-semibold mb-2">Sin Meta Anual Definida</h4>
                  <p className="text-soft-slate text-sm max-w-sm mx-auto">
                    Configura la meta anual en el formulario de resumen para ver el progreso.
                  </p>
                </div>
              )}

              {latestMetrics?.metaProgress && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/80 shadow-soft">
                  <h4 className="text-vision-ink font-medium text-sm mb-4">Proyección vs Meta</h4>
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { 
                            name: 'Acumulado', 
                            valor: latestMetrics.metaProgress.current,
                            fill: '#059669'
                          },
                          { 
                            name: 'Proyección', 
                            valor: latestMetrics.metaProgress.projectedAnnual,
                            fill: '#2563eb'
                          },
                          { 
                            name: 'Meta Anual', 
                            valor: latestMetrics.metaProgress.target,
                            fill: '#d97706'
                          }
                        ]} 
                        margin={{ top: 20, right: 80, left: 20, bottom: 20 }}
                        layout="vertical"
                        barSize={45}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" horizontal={true} vertical={false} />
                        <XAxis 
                          type="number" 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickFormatter={(v: number) => formatValue(v)}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={13}
                          fontWeight={500}
                          width={90}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '1px solid rgba(148,163,184,0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            padding: '12px 16px'
                          }}
                          labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                          formatter={(value: number) => [formatValue(value), 'Valor']}
                        />
                        <Bar 
                          dataKey="valor" 
                          radius={[0, 8, 8, 0]}
                        >
                          {[
                            { fill: '#059669' },
                            { fill: '#2563eb' },
                            { fill: '#d97706' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <LabelList 
                            dataKey="valor" 
                            position="right" 
                            formatter={(value) => formatValue(Number(value ?? 0))}
                            style={{ 
                              fill: '#334155', 
                              fontSize: '12px', 
                              fontWeight: 600 
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Explicación elegante de la proyección */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-5 p-4 rounded-xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-violet-50/40 border border-blue-100/60 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                          <span>¿Cómo se calcula la proyección?</span>
                          <Calculator className="w-3.5 h-3.5 text-blue-500" />
                        </h5>
                        {shouldSum ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 leading-relaxed">
                              La proyección estima el resultado anual basándose en el <span className="font-semibold text-emerald-600">ritmo actual de acumulación</span>.
                            </p>
                            <div className="p-2 bg-white/70 rounded-lg border border-slate-200/60 overflow-hidden">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs justify-center sm:justify-start">
                                <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium break-all max-w-full text-center">
                                  {formatValue(latestMetrics.metaProgress.current)}
                                </span>
                                <span className="text-slate-400">÷</span>
                                <span className="px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                                  {latestMetrics.month}m
                                </span>
                                <span className="text-slate-400">×</span>
                                <span className="px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                                  12
                                </span>
                                <span className="text-slate-400">=</span>
                                <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold break-all max-w-full text-center">
                                  {formatValue(latestMetrics.metaProgress.projectedAnnual)}
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 italic break-all">
                              Promedio mensual: {formatValue(latestMetrics.metaProgress.current / latestMetrics.month)}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Para métricas de <span className="font-semibold text-blue-600">porcentaje</span>, la proyección = <span className="font-semibold text-emerald-600">promedio acumulado</span>.
                            </p>
                            <div className="p-2 bg-white/70 rounded-lg border border-slate-200/60 overflow-x-auto">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-slate-500">Promedio:</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">
                                  {formatValue(latestMetrics.metaProgress.projectedAnnual)}
                                </span>
                                <span className="text-slate-400">=</span>
                                <span className="text-slate-500">Proyección</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Tabla de Proyección por Dimensión - Vista Meta Anual */}
              <ProjectionTable
                config={config}
                selectedSummaryIndex={selectedSummaryIndex}
                selectedYear={selectedYear}
                currentMonth={latestMetrics?.month || initialFilters.mes}
                totalAccumulated={latestMetrics?.metaProgress?.current || latestMetrics?.accumulated || 0}
                totalProjection={latestMetrics?.metaProgress?.projectedAnnual || 0}
                metaAnual={metaAnual}
                formatValue={formatValue}
                higherIsBetter={higherIsBetter}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estado vacío */}
        {!latestMetrics && activeView === 'overview' && (
          <div className="text-center py-12">
            <BarChart2 size={48} className="text-white/20 mx-auto mb-4" />
            <h4 className="text-white/60 text-lg mb-2">Sin datos disponibles</h4>
            <p className="text-white/40 text-sm">
              Selecciona un año con datos para ver el análisis.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  </>
  );
}

export default KpiAnalysisPanel;
