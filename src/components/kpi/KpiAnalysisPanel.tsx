import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend } from 'recharts';
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
  Layers
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, SectionDefinition } from '@/types/kpi-definitions';

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

  // Determinar si es porcentaje o moneda (para saber si promediar o sumar)
  const isPercentage = useMemo(() => {
    if (!selectedSummary?.fields) return false;
    const metricField = selectedSummary.fields.find(f => f.id === metricKey);
    return metricField?.type === 'percentage';
  }, [selectedSummary, metricKey]);

  const formatValue = useCallback((v: number): string => {
    if (v === null || v === undefined) return '-';
    if (isPercentage) return `${v.toFixed(2)}%`;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
  }, [isPercentage]);

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
      
      return entry;
    });
  }, [dataByYear, availableYears, metricKey]);

  // Función para calcular acumulado (suma para moneda, promedio para porcentaje)
  const calculateAccumulated = useCallback((data: SummaryRecord[], upToMonth: number): number => {
    const filtered = data.filter((d: SummaryRecord) => Number(d.mes) <= upToMonth);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc: number, d: SummaryRecord) => acc + (Number(d[metricKey]) || 0), 0);
    
    // Para porcentajes: promedio; para moneda: suma
    return isPercentage ? sum / filtered.length : sum;
  }, [metricKey, isPercentage]);

  // Datos acumulados por año (suma para moneda, promedio para porcentaje)
  const accumulatedChartData = useMemo(() => {
    return MONTH_NAMES.map((month, index) => {
      const monthNum = index + 1;
      const entry: Record<string, unknown> = { mes: month, mesNum: monthNum };
      
      availableYears.forEach((year: number) => {
        const yearData = dataByYear[year] || [];
        const accumulated = calculateAccumulated(yearData, monthNum);
        entry[`acumulado_${year}`] = accumulated || null;
      });
      
      // Agregar meta anual como línea de referencia
      if (metaAnual) {
        entry['meta_anual'] = metaAnual;
      }
      
      return entry;
    });
  }, [dataByYear, availableYears, calculateAccumulated, metaAnual]);

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
      // Para porcentajes: el acumulado ya es el promedio, comparar directamente con meta
      // Para moneda: proyectar al año completo
      const percent = (currentAccumulated / metaAnual) * 100;
      const projectedAnnual = isPercentage 
        ? currentAccumulated  // Para porcentajes, el promedio actual es la proyección
        : (latestMonth > 0 ? (currentAccumulated / latestMonth) * 12 : 0);
      
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
  }, [currentYearData, dataByYear, availableYears, selectedYear, metricKey, metaAnual, calculateAccumulated, isPercentage]);

  // Colores para años en gráficas
  const yearColors: Record<number, string> = useMemo(() => {
    const palette = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
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
    const isOnTrack = projectedAnnual >= target;
    const progressColor = percent >= 100 ? '#10b981' : percent >= 75 ? '#f59e0b' : percent >= 50 ? '#6366f1' : '#ef4444';
    const progressBg = percent >= 100 ? 'from-emerald-500 to-teal-500' : percent >= 75 ? 'from-amber-500 to-orange-500' : percent >= 50 ? 'from-indigo-500 to-purple-500' : 'from-rose-500 to-red-500';
    
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
                Faltan {formatValue(remaining)} en {monthsRemaining} meses restantes
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
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
            <BarChart2 size={32} className="text-slate-400" />
          </div>
          <h4 className="text-vision-ink font-semibold text-lg mb-2">Sin datos disponibles</h4>
          <p className="text-soft-slate text-sm">
            Captura datos en la pestaña de Resumen para ver el análisis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass overflow-hidden"
    >
      {/* Header con selector de resumen, año y vistas */}
      <div className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-plasma-blue/10 to-plasma-indigo/10 border border-plasma-blue/20">
              <BarChart2 className="text-plasma-blue" size={20} />
            </div>
            <div>
              <h3 className="text-vision-ink font-semibold text-base">Panel de Análisis</h3>
              <p className="text-soft-slate text-sm">{metricLabel}</p>
            </div>
          </div>
          
          {/* Selectores de resumen y año */}
          <div className="flex items-center gap-2">
            {/* Selector de resumen (solo si hay más de uno) */}
            {config.summaries.length > 1 && (
              <div className="relative z-50">
                <button
                  onClick={() => setIsSummaryDropdownOpen(!isSummaryDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                           rounded-xl border border-slate-200 transition-all duration-200 min-w-[140px] shadow-soft"
                >
                  <Layers size={15} className="text-plasma-indigo" />
                  <span className="text-vision-ink font-medium text-sm truncate max-w-[100px]">
                    {selectedSummary?.title?.replace(/^\d+\.\s*/, '') || 'Resumen'}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`text-soft-slate ml-auto transition-transform duration-200 ${isSummaryDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                <AnimatePresence>
                  {isSummaryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-full min-w-[180px] bg-white/95 backdrop-blur-xl 
                               rounded-xl border border-slate-200 shadow-xl overflow-hidden z-[100]"
                    >
                      {config.summaries.map((summary, index) => (
                        <button
                          key={summary.id}
                          onClick={() => {
                            setSelectedSummaryIndex(index);
                            setIsSummaryDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left transition-all duration-150
                                    ${selectedSummaryIndex === index 
                                      ? 'bg-plasma-blue/10 text-plasma-blue' 
                                      : 'text-vision-ink hover:bg-slate-50'}`}
                        >
                          <span className="text-sm font-medium">{summary.title}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Selector de año */}
            <div className="relative z-50">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                         rounded-xl border border-slate-200 transition-all duration-200 min-w-[100px] shadow-soft"
              >
                <Calendar size={15} className="text-plasma-blue" />
                <span className="text-vision-ink font-medium text-sm">{selectedYear || 'Año'}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-soft-slate ml-auto transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-full min-w-[100px] bg-white/95 backdrop-blur-xl 
                             rounded-xl border border-slate-200 shadow-xl overflow-hidden z-[100]"
                  >
                    {availableYears.map((year: number) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left transition-all duration-150
                                  ${selectedYear === year 
                                    ? 'bg-plasma-blue/10 text-plasma-blue' 
                                    : 'text-vision-ink hover:bg-slate-50'}`}
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
                  </motion.div>
                )}
              </AnimatePresence>
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
                        {availableYears.map((year: number) => (
                          <linearGradient key={year} id={`gradient-${year}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={yearColors[year]} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={yearColors[year]} stopOpacity={0.05} />
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
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 500 }}>{year}</span>;
                        }}
                      />
                      {[...availableYears].sort((a, b) => a - b).map((year: number) => (
                        <Area
                          key={year}
                          type="monotone"
                          dataKey={`valor_${year}`}
                          stroke={yearColors[year]}
                          fill={`url(#gradient-${year})`}
                          strokeWidth={year === selectedYear ? 3 : 1.5}
                          dot={year === selectedYear}
                          activeDot={{ r: 6, strokeWidth: 2, fill: yearColors[year] }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
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

              {/* Tabla de comparación */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="text-left text-soft-slate p-3 font-medium">Mes</th>
                        {[...availableYears].sort((a, b) => b - a).map((year: number) => (
                          <th key={year} className="text-right text-soft-slate p-3 font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <div 
                                className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                                style={{ backgroundColor: yearColors[year] }}
                              />
                              {year}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyChartData.map((row, index) => (
                        <tr key={index} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-vision-ink font-medium">{String(row.mes)}</td>
                          {[...availableYears].sort((a, b) => b - a).map((year: number) => {
                            const value = row[`valor_${year}`] as number | null;
                            return (
                              <td key={year} className="p-3 text-right text-vision-ink/80">
                                {value !== null ? formatValue(value) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                    <LineChart data={accumulatedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                          if (name === 'meta_anual') return [formatValue(value), 'Meta Anual'];
                          const year = name.split('_')[1];
                          return [formatValue(value), `Acumulado ${year}`];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          if (value === 'meta_anual') return <span style={{ color: '#f59e0b' }}>Meta Anual</span>;
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 500 }}>Acumulado {year}</span>;
                        }}
                      />
                      {metaAnual && (
                        <Line
                          type="monotone"
                          dataKey="meta_anual"
                          stroke="#f59e0b"
                          strokeWidth={2}
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
                          strokeWidth={year === selectedYear ? 3 : 1.5}
                          dot={year === selectedYear}
                          activeDot={{ r: 6, strokeWidth: 2, fill: yearColors[year] }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de acumulados */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="text-left text-soft-slate p-3 font-medium">Mes</th>
                        {[...availableYears].sort((a, b) => b - a).map((year: number) => (
                          <th key={year} className="text-right text-soft-slate p-3 font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <div 
                                className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                                style={{ backgroundColor: yearColors[year] }}
                              />
                              Acum. {year}
                            </div>
                          </th>
                        ))}
                        {metaAnual && (
                          <th className="text-right text-amber-600 p-3 font-medium">Meta Anual</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {accumulatedChartData.map((row, index) => (
                        <tr key={index} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-vision-ink font-medium">{String(row.mes)}</td>
                          {[...availableYears].sort((a, b) => b - a).map((year: number) => {
                            const value = row[`acumulado_${year}`] as number | null;
                            return (
                              <td key={year} className="p-3 text-right text-vision-ink/80">
                                {value !== null ? formatValue(value) : '-'}
                              </td>
                            );
                          })}
                          {metaAnual && (
                            <td className="p-3 text-right text-amber-600 font-medium">
                              {formatValue(metaAnual)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h4 className="text-white/80 text-sm mb-4">Proyección vs Meta</h4>
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { 
                            name: 'Acumulado Actual', 
                            valor: latestMetrics.metaProgress.current,
                            fill: '#10b981'
                          },
                          { 
                            name: 'Proyección Anual', 
                            valor: latestMetrics.metaProgress.projectedAnnual,
                            fill: '#6366f1'
                          },
                          { 
                            name: 'Meta Anual', 
                            valor: latestMetrics.metaProgress.target,
                            fill: '#f59e0b'
                          }
                        ]} 
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v: number) => formatValue(v)} />
                        <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} width={120} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                          }}
                          labelStyle={{ color: 'white', fontWeight: 'bold' }}
                          formatter={(value: number) => [formatValue(value), 'Valor']}
                        />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
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
  );
}

export default KpiAnalysisPanel;
