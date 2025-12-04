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
    const colorClass = isPositive ? 'text-emerald-400' : 'text-rose-400';
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
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h4 className="text-white/60 text-sm mb-2">{title}</h4>
          <p className="text-white/40 text-xs">Sin datos de años anteriores</p>
        </div>
      );
    }

    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <h4 className="text-white/60 text-sm mb-3">{title}</h4>
        <div className="space-y-2">
          {years.slice(0, 3).map(year => {
            const comp = comparisons[year];
            return (
              <div key={year} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: yearColors[year] }}
                  />
                  <span className="text-white/70 text-sm">{year}</span>
                  <span className="text-white/40 text-xs">({format(comp.value)})</span>
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
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="text-amber-400" size={20} />
          <h4 className="text-white font-medium">Progreso hacia Meta Anual</h4>
        </div>
        
        {/* Barra de progreso */}
        <div className="relative h-4 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: progressColor }}
          />
          {percent > 100 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percent - 100, 100)}%` }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute inset-y-0 right-0 bg-emerald-500/50 rounded-r-full"
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-white/50 text-xs mb-1">Acumulado</p>
            <p className="text-white font-semibold">{formatValue(current)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">Meta Anual</p>
            <p className="text-white font-semibold">{formatValue(target)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">Avance</p>
            <p className="font-semibold" style={{ color: progressColor }}>
              {percent.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">Proyección Anual</p>
            <p className={`font-semibold ${isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
              {formatValue(projectedAnnual)}
            </p>
          </div>
        </div>
        
        {/* Estado del avance */}
        <div className={`mt-4 flex items-center gap-2 text-sm ${isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isOnTrack ? (
            <>
              <CheckCircle2 size={16} />
              <span>En camino a cumplir la meta</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} />
              <span>
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
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="flex items-center justify-center gap-3 text-white/60">
          <Loader2 className="animate-spin" size={24} />
          <span>Cargando datos de análisis...</span>
        </div>
      </div>
    );
  }

  if (summaryData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="text-center">
          <BarChart2 size={48} className="text-white/20 mx-auto mb-4" />
          <h4 className="text-white/60 text-lg mb-2">Sin datos disponibles</h4>
          <p className="text-white/40 text-sm">
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
      className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Header con selector de resumen, año y vistas */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
              <BarChart2 className="text-emerald-400" size={22} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Panel de Análisis</h3>
              <p className="text-white/50 text-sm">{metricLabel}</p>
            </div>
          </div>
          
          {/* Selectores de resumen y año */}
          <div className="flex items-center gap-3">
            {/* Selector de resumen (solo si hay más de uno) */}
            {config.summaries.length > 1 && (
              <div className="relative z-50">
                <button
                  onClick={() => setIsSummaryDropdownOpen(!isSummaryDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 
                           rounded-xl border border-white/20 transition-all duration-200 min-w-[160px]"
                >
                  <Layers size={16} className="text-indigo-400" />
                  <span className="text-white font-medium text-sm truncate max-w-[120px]">
                    {selectedSummary?.title?.replace(/^\d+\.\s*/, '') || 'Resumen'}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-white/60 ml-auto transition-transform duration-200 ${isSummaryDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                <AnimatePresence>
                  {isSummaryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-full min-w-[200px] bg-slate-800/95 backdrop-blur-xl 
                               rounded-xl border border-white/20 shadow-2xl overflow-hidden z-[100]"
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
                                      ? 'bg-indigo-500/20 text-indigo-400' 
                                      : 'text-white/80 hover:bg-white/10'}`}
                        >
                          <span className="text-sm">{summary.title}</span>
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 
                         rounded-xl border border-white/20 transition-all duration-200 min-w-[120px]"
              >
                <Calendar size={16} className="text-emerald-400" />
                <span className="text-white font-medium">{selectedYear || 'Año'}</span>
                <ChevronDown 
                  size={16} 
                  className={`text-white/60 ml-auto transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-full min-w-[120px] bg-slate-800/95 backdrop-blur-xl 
                             rounded-xl border border-white/20 shadow-2xl overflow-hidden z-[100]"
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
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : 'text-white/80 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: yearColors[year] }}
                          />
                          {year}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tabs de vista */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { id: 'overview', label: 'Resumen', icon: Activity },
            { id: 'monthly', label: 'Mensual', icon: Calendar },
            { id: 'accumulated', label: 'Acumulado', icon: TrendingUp },
            { id: 'annual', label: 'Meta Anual', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as typeof activeView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${activeView === tab.id 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'}`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && latestMetrics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Valor actual */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-sm rounded-xl p-5 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">{metricLabel} - {latestMetrics.monthName}</span>
                    <Clock size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-2">{formatValue(latestMetrics.current)}</p>
                  {Object.keys(latestMetrics.previousYearComparisons).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">vs año anterior:</span>
                      {renderTrend(Object.values(latestMetrics.previousYearComparisons)[0].changePercent)}
                    </div>
                  )}
                </div>

                {/* Acumulado */}
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 backdrop-blur-sm rounded-xl p-5 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Acumulado {selectedYear}</span>
                    <TrendingUp size={16} className="text-indigo-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-2">{formatValue(latestMetrics.accumulated)}</p>
                  {Object.keys(latestMetrics.accumulatedComparisons).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">vs año anterior:</span>
                      {renderTrend(Object.values(latestMetrics.accumulatedComparisons)[0].changePercent)}
                    </div>
                  )}
                </div>

                {/* Meta anual */}
                {latestMetrics.metaProgress && (
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-sm rounded-xl p-5 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Avance Meta Anual</span>
                      <Target size={16} className="text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">
                      {latestMetrics.metaProgress.percent.toFixed(1)}%
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">Meta:</span>
                      <span className="text-white/70 text-sm">{formatValue(latestMetrics.metaProgress.target)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Comparativas con años anteriores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h4 className="text-white/80 text-sm mb-4">Tendencia Mensual por Año</h4>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {availableYears.map((year: number) => (
                          <linearGradient key={year} id={`gradient-${year}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={yearColors[year]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={yearColors[year]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v: number) => formatValue(v)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                        labelStyle={{ color: 'white', fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => {
                          const year = name.split('_')[1];
                          return [formatValue(value), year];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)] }}>{year}</span>;
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
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h4 className="text-white/80 text-sm mb-4">Comparativa Mensual por Año</h4>
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v: number) => formatValue(v)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                        labelStyle={{ color: 'white', fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => {
                          const year = name.split('_')[1];
                          return [formatValue(value), year];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)] }}>{year}</span>;
                        }}
                      />
                      {[...availableYears].sort((a, b) => a - b).map((year: number) => (
                        <Bar
                          key={year}
                          dataKey={`valor_${year}`}
                          fill={yearColors[year]}
                          radius={[4, 4, 0, 0]}
                          opacity={year === selectedYear ? 1 : 0.6}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de comparación */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="text-left text-white/60 p-3 font-medium">Mes</th>
                        {[...availableYears].sort((a, b) => b - a).map((year: number) => (
                          <th key={year} className="text-right text-white/60 p-3 font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
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
                        <tr key={index} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white/80">{String(row.mes)}</td>
                          {[...availableYears].sort((a, b) => b - a).map((year: number) => {
                            const value = row[`valor_${year}`] as number | null;
                            return (
                              <td key={year} className="p-3 text-right text-white/70">
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
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h4 className="text-white/80 text-sm mb-4">Acumulado Anual por Mes</h4>
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accumulatedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v: number) => formatValue(v)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                        labelStyle={{ color: 'white', fontWeight: 'bold' }}
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
                          return <span style={{ color: yearColors[Number(year)] }}>Acumulado {year}</span>;
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
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="text-left text-white/60 p-3 font-medium">Mes</th>
                        {[...availableYears].sort((a, b) => b - a).map((year: number) => (
                          <th key={year} className="text-right text-white/60 p-3 font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: yearColors[year] }}
                              />
                              Acum. {year}
                            </div>
                          </th>
                        ))}
                        {metaAnual && (
                          <th className="text-right text-amber-400/80 p-3 font-medium">Meta Anual</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {accumulatedChartData.map((row, index) => (
                        <tr key={index} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white/80">{String(row.mes)}</td>
                          {[...availableYears].sort((a, b) => b - a).map((year: number) => {
                            const value = row[`acumulado_${year}`] as number | null;
                            return (
                              <td key={year} className="p-3 text-right text-white/70">
                                {value !== null ? formatValue(value) : '-'}
                              </td>
                            );
                          })}
                          {metaAnual && (
                            <td className="p-3 text-right text-amber-400/70">
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
              className="space-y-6"
            >
              {renderMetaProgress()}
              
              {!latestMetrics?.metaProgress && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
                  <Target size={48} className="text-white/20 mx-auto mb-4" />
                  <h4 className="text-white/60 text-lg mb-2">Sin Meta Anual Definida</h4>
                  <p className="text-white/40 text-sm">
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
