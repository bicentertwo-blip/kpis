/**
 * Panel de Análisis Especializado para IMOR (Índice de Morosidad)
 * El IMOR es un índice/saldo mensual - menor es mejor
 * No se acumula sino que es el valor actual del mes
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Calendar, 
  Activity,
  Target,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition } from '@/types/kpi-definitions';
import { ExpandableDataTable } from './ExpandableDataTable';

interface IMORAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
  selectedSummaryIndex: number;
  onSummaryChange: (index: number) => void;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type IMORRecord = {
  anio: number;
  mes: number;
  imor: number;
  meta: number;
  meta_anual?: number;
};

type ViewType = 'overview' | 'monthly' | 'tendencia' | 'meta';

export function IMORAnalysisPanel({
  config,
  filters,
  selectedSummaryIndex,
  onSummaryChange
}: IMORAnalysisPanelProps) {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [data, setData] = useState<IMORRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(filters.anio);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSummaryDropdownOpen, setIsSummaryDropdownOpen] = useState(false);
  
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const summaryDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (summaryDropdownRef.current && !summaryDropdownRef.current.contains(event.target as Node)) {
        setIsSummaryDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
    };
  }, []);

  // Cargar datos de resumen y detalle
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar datos de resumen
        const { data: resumenResult, error: resumenError } = await supabase
          .from('kpi_colocacion_resumen_2')
          .select('*')
          .eq('is_current', true)
          .order('anio', { ascending: true })
          .order('mes', { ascending: true });

        if (resumenError) throw resumenError;
        setData((resumenResult || []) as IMORRecord[]);
      } catch (err) {
        console.error('Error loading IMOR data:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Años disponibles
  const availableYears = useMemo(() => {
    return Array.from(new Set(data.map(r => r.anio))).sort((a, b) => b - a);
  }, [data]);

  // Colores para años
  const yearColors: Record<number, string> = useMemo(() => {
    const palette = ['#4F46E5', '#2563eb', '#d97706', '#059669', '#7c3aed'];
    const colors: Record<number, string> = {};
    availableYears.forEach((year, index) => {
      colors[year] = palette[index % palette.length];
    });
    return colors;
  }, [availableYears]);

  // Datos del año seleccionado
  const currentYearData = useMemo(() => {
    return data.filter(r => r.anio === selectedYear).sort((a, b) => a.mes - b.mes);
  }, [data, selectedYear]);

  // Métricas calculadas - IMOR: menor es mejor
  const metrics = useMemo(() => {
    if (currentYearData.length === 0) return null;

    const ultimoMes = Math.max(...currentYearData.map(r => r.mes));
    const ultimoRegistro = currentYearData.find(r => r.mes === ultimoMes);
    
    if (!ultimoRegistro) return null;

    // IMOR actual (es un saldo/corte, no se acumula)
    const imorActual = ultimoRegistro.imor;
    
    // Meta mensual
    const metaMensual = ultimoRegistro.meta;
    
    // Meta anual
    const metaAnual = ultimoRegistro.meta_anual || metaMensual;
    
    // Promedio del año (para referencia, pero el valor actual es el importante)
    const imorPromedio = currentYearData.reduce((sum, r) => sum + (r.imor || 0), 0) / currentYearData.length;
    
    // IMOR mínimo y máximo del año
    const imorMinimo = Math.min(...currentYearData.map(r => r.imor));
    const imorMaximo = Math.max(...currentYearData.map(r => r.imor));
    
    // Tendencia: comparar último mes con el anterior
    const mesAnterior = currentYearData.find(r => r.mes === ultimoMes - 1);
    const tendencia = mesAnterior ? imorActual - mesAnterior.imor : 0;

    // Comparar con año anterior
    const yearAnterior = selectedYear - 1;
    const datosAnterior = data.filter(r => r.anio === yearAnterior);
    const ultimoMesAnterior = datosAnterior.find(r => r.mes === ultimoMes);
    const imorAnterior = ultimoMesAnterior?.imor || null;
    const cambioVsAnterior = imorAnterior !== null ? imorActual - imorAnterior : null;

    // Cumplimiento de meta - MENOR es mejor para IMOR
    const cumpleMetaMensual = imorActual <= metaMensual;
    const cumpleMetaAnual = imorActual <= metaAnual;
    
    // Diferencia con meta (negativo = mejor que meta)
    const diferenciaMetaMensual = imorActual - metaMensual;
    const diferenciaMetaAnual = imorActual - metaAnual;

    // Meses que cumplen meta
    const mesesCumplenMeta = currentYearData.filter(r => r.imor <= r.meta).length;
    const porcentajeCumplimiento = (mesesCumplenMeta / currentYearData.length) * 100;

    return {
      ultimoMes,
      imorActual,
      metaMensual,
      metaAnual,
      imorPromedio,
      imorMinimo,
      imorMaximo,
      tendencia,
      imorAnterior,
      cambioVsAnterior,
      cumpleMetaMensual,
      cumpleMetaAnual,
      diferenciaMetaMensual,
      diferenciaMetaAnual,
      mesesCumplenMeta,
      porcentajeCumplimiento,
      totalMeses: currentYearData.length
    };
  }, [currentYearData, data, selectedYear]);

  // Datos para gráfica de tendencia IMOR
  const tendenciaChartData = useMemo(() => {
    return MONTH_NAMES.map((mes, index) => {
      const monthNum = index + 1;
      const point: Record<string, string | number | null> = { mes };
      
      availableYears.forEach(year => {
        const record = data.find(r => r.anio === year && r.mes === monthNum);
        point[`imor_${year}`] = record ? record.imor : null;
      });
      
      // Meta del año seleccionado
      const currentRecord = data.find(r => r.anio === selectedYear && r.mes === monthNum);
      point['meta'] = currentRecord ? currentRecord.meta : null;
      
      return point;
    });
  }, [availableYears, data, selectedYear]);

  // Datos para gráfica mensual con drill-down (formato ExpandableDataTable)
  const monthlyChartData = useMemo(() => {
    return MONTH_NAMES.map((month, index) => {
      const monthNum = index + 1;
      const entry: Record<string, unknown> = { mes: month, mesNum: monthNum };
      
      // Agregar datos de cada año disponible
      availableYears.forEach((year: number) => {
        const record = data.find(r => r.anio === year && r.mes === monthNum);
        entry[`valor_${year}`] = record ? record.imor : null;
      });
      
      // Agregar meta mensual del año seleccionado
      const currentRecord = data.find(r => r.anio === selectedYear && r.mes === monthNum);
      entry['meta'] = currentRecord ? currentRecord.meta : null;
      
      return entry;
    });
  }, [availableYears, data, selectedYear]);

  // Datos para gráfica de cumplimiento mensual
  const cumplimientoChartData = useMemo(() => {
    return currentYearData.map(record => ({
      mes: MONTH_NAMES[record.mes - 1],
      imor: record.imor,
      meta: record.meta,
      cumple: record.imor <= record.meta
    }));
  }, [currentYearData]);

  // Comparativas mensuales con años anteriores
  const monthlyComparison = useMemo(() => {
    if (!metrics) return null;
    const currentMonth = metrics.ultimoMes;
    const currentValue = metrics.imorActual;
    
    const comparisons: { year: number; value: number; change: number }[] = [];
    
    availableYears.filter(y => y !== selectedYear).forEach(year => {
      const record = data.find(r => r.anio === year && r.mes === currentMonth);
      if (record) {
        comparisons.push({
          year,
          value: record.imor,
          change: currentValue - record.imor // Positivo = empeoró, Negativo = mejoró
        });
      }
    });
    
    return comparisons;
  }, [metrics, availableYears, data, selectedYear]);

  // Formato de valor IMOR (porcentaje)
  const formatValue = (value: number) => `${value.toFixed(2)}%`;

  // Vista de loading
  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass">
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-soft-slate">
            <Loader2 className="animate-spin" size={24} />
            <span>Cargando análisis de morosidad...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass overflow-visible"
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex-shrink-0">
              <ShieldAlert className="text-indigo-600" size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-vision-ink font-semibold text-sm md:text-base">Panel de Análisis</h3>
              <p className="text-soft-slate text-xs md:text-sm truncate">IMOR - Índice de Morosidad</p>
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
                    {config.summaries[selectedSummaryIndex]?.title?.replace(/^\d+\.\s*/, '') || 'Resumen'}
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
                          onSummaryChange(index);
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
                <div className="absolute right-0 top-full mt-1 w-max min-w-[120px] bg-white rounded-xl border border-slate-200 shadow-2xl z-[9999]">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-all duration-150 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2
                                ${selectedYear === year 
                                  ? 'bg-plasma-blue/10 text-plasma-blue' 
                                  : 'text-vision-ink hover:bg-slate-50'}`}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                        style={{ backgroundColor: yearColors[year] }}
                      />
                      <span className="font-medium">{year}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {[
            { id: 'overview', label: 'Resumen', icon: Activity },
            { id: 'monthly', label: 'Mensual', icon: Calendar },
            { id: 'tendencia', label: 'Tendencia', icon: TrendingDown },
            { id: 'meta', label: 'Meta Anual', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as ViewType)}
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

      {/* Contenido */}
      <div className="p-4 md:p-5">
        <AnimatePresence mode="wait">
          {/* Vista Resumen */}
          {activeView === 'overview' && metrics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Indicador de que menor es mejor */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-3 border border-slate-200 flex items-center gap-2">
                <AlertCircle size={16} className="text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-600">
                  <strong>IMOR:</strong> Un valor más bajo indica mejor desempeño en control de morosidad
                </span>
              </div>

              {/* Métricas principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* IMOR Actual */}
                <div className={`rounded-2xl p-4 border shadow-soft ${
                  metrics.cumpleMetaMensual
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100'
                    : 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-xs sm:text-sm">IMOR {FULL_MONTH_NAMES[metrics.ultimoMes - 1]}</span>
                    <div className={`p-1.5 rounded-lg ${metrics.cumpleMetaMensual ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      <ShieldAlert size={14} className={metrics.cumpleMetaMensual ? 'text-emerald-600' : 'text-rose-600'} />
                    </div>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                    metrics.cumpleMetaMensual ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {metrics.imorActual.toFixed(2)}%
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-soft-slate text-xs">Meta:</span>
                    <span className={`text-xs font-medium ${metrics.cumpleMetaMensual ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ≤ {metrics.metaMensual.toFixed(2)}%
                    </span>
                    {metrics.cumpleMetaMensual ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={12} className="text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Tendencia */}
                <div className={`rounded-2xl p-4 border shadow-soft ${
                  metrics.tendencia <= 0
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-xs sm:text-sm">Tendencia vs Mes Anterior</span>
                    <div className={`p-1.5 rounded-lg ${metrics.tendencia <= 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
                      {metrics.tendencia <= 0 ? (
                        <TrendingDown size={14} className="text-blue-600" />
                      ) : (
                        <TrendingUp size={14} className="text-amber-600" />
                      )}
                    </div>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                    metrics.tendencia <= 0 ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {metrics.tendencia > 0 ? '+' : ''}{metrics.tendencia.toFixed(2)}%
                  </p>
                  <span className={`text-xs ${metrics.tendencia <= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {metrics.tendencia <= 0 ? '↓ Morosidad en descenso' : '↑ Morosidad en aumento'}
                  </span>
                </div>

                {/* Cumplimiento Anual */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 rounded-2xl p-4 border border-violet-100 shadow-soft sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-xs sm:text-sm">Meses Cumpliendo Meta</span>
                    <div className="p-1.5 rounded-lg bg-violet-100">
                      <Target size={14} className="text-violet-600" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mb-1">
                    {metrics.mesesCumplenMeta} / {metrics.totalMeses}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${metrics.porcentajeCumplimiento}%` }}
                      />
                    </div>
                    <span className="text-violet-600 text-xs font-medium">{metrics.porcentajeCumplimiento.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Comparativas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Rangos del año */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                  <h4 className="text-soft-slate text-sm mb-3 flex items-center gap-2">
                    <BarChart2 size={14} className="text-plasma-blue" />
                    Rangos de IMOR ({selectedYear})
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-vision-ink text-sm">Mínimo</span>
                      <span className="text-emerald-600 font-bold">{metrics.imorMinimo.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-vision-ink text-sm">Promedio</span>
                      <span className="text-vision-ink font-bold">{metrics.imorPromedio.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-vision-ink text-sm">Máximo</span>
                      <span className="text-rose-600 font-bold">{metrics.imorMaximo.toFixed(2)}%</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-vision-ink text-sm font-medium">Actual</span>
                      <span className={`font-bold ${metrics.cumpleMetaMensual ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {metrics.imorActual.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparativa Años Anteriores */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                  <h4 className="text-soft-slate text-sm mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-plasma-blue" />
                    Comparativa Años Anteriores
                  </h4>
                  {monthlyComparison && monthlyComparison.length > 0 ? (
                    <div className="space-y-2">
                      {monthlyComparison.map(comp => (
                        <div key={comp.year} className="flex items-center justify-between">
                          <span className="text-vision-ink text-sm">{comp.year}: {comp.value.toFixed(2)}%</span>
                          <div className="flex items-center gap-1.5">
                            {comp.change <= 0 ? (
                              <ArrowDownRight size={14} className="text-emerald-500" />
                            ) : (
                              <ArrowUpRight size={14} className="text-rose-500" />
                            )}
                            <span className={`text-sm font-medium ${comp.change <= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {comp.change > 0 ? '+' : ''}{comp.change.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-soft-slate/60 text-sm">Sin datos de años anteriores</p>
                  )}
                </div>
              </div>

              {/* Gráfica de IMOR vs Meta */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">IMOR Mensual vs Meta</h4>
                <div className="h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cumplimientoChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value?.toFixed(2) || '-'}%`, 
                          name === 'imor' ? 'IMOR' : 'IMOR'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="imor" 
                        name="IMOR" 
                        fill="#4F46E5" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.85}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="meta" 
                        name="Meta (máx)"
                        stroke="#059669" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Vista Mensual con ExpandableDataTable */}
          {activeView === 'monthly' && metrics && (
            <motion.div
              key="monthly"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Gráfica de barras mensual */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">IMOR por Mes - {selectedYear}</h4>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'meta') return [`${value?.toFixed(2)}%`, 'Meta'];
                          const year = name.split('_')[1];
                          return [`${value?.toFixed(2)}%`, year];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          if (value === 'meta') return <span style={{ color: '#059669', fontWeight: 600 }}>Meta</span>;
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 600 }}>{year}</span>;
                        }}
                      />
                      {availableYears.map((year) => (
                        <Bar
                          key={year}
                          dataKey={`valor_${year}`}
                          name={`valor_${year}`}
                          fill={yearColors[year]}
                          radius={[4, 4, 0, 0]}
                          opacity={year === selectedYear ? 1 : 0.5}
                        />
                      ))}
                      <ReferenceLine 
                        y={metrics.metaMensual} 
                        stroke="#059669" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla con Drill-Down por Dimensión */}
              <ExpandableDataTable
                config={config}
                selectedSummaryIndex={selectedSummaryIndex}
                availableYears={availableYears}
                selectedYear={selectedYear}
                monthlyData={monthlyChartData}
                viewType="monthly"
                formatValue={formatValue}
                higherIsBetter={false}
                yearColors={yearColors}
              />
            </motion.div>
          )}

          {/* Vista Tendencia */}
          {activeView === 'tendencia' && metrics && (
            <motion.div
              key="tendencia"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Indicador de tendencia */}
              <div className={`rounded-2xl p-4 border ${
                metrics.tendencia <= 0
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-100/60 border-emerald-200'
                  : 'bg-gradient-to-br from-amber-50 to-orange-100/60 border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl shadow-lg flex-shrink-0 ${
                    metrics.tendencia <= 0
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}>
                    {metrics.tendencia <= 0 ? (
                      <TrendingDown className="text-white" size={24} />
                    ) : (
                      <TrendingUp className="text-white" size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-vision-ink font-bold text-base md:text-lg">
                      {metrics.tendencia <= 0 ? 'Tendencia Positiva' : 'Tendencia Negativa'}
                    </h4>
                    <p className="text-vision-ink/80 text-sm">
                      {metrics.tendencia <= 0
                        ? `El IMOR ha disminuido ${Math.abs(metrics.tendencia).toFixed(2)}% respecto al mes anterior. Buen control de morosidad.`
                        : `El IMOR ha aumentado ${metrics.tendencia.toFixed(2)}% respecto al mes anterior. Se requiere atención.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Gráfica de evolución multi-año */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Evolución de IMOR por Año</h4>
                <div className="h-72 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tendenciaChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        {availableYears.map((year, idx) => (
                          <linearGradient key={year} id={`gradient-imor-${year}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={yearColors[year]} stopOpacity={idx === 0 ? 0.25 : 0.08} />
                            <stop offset="95%" stopColor={yearColors[year]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickFormatter={(v: number) => `${v}%`}
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'meta') return [`${value?.toFixed(2) || '-'}%`, 'Meta'];
                          const year = name.split('_')[1];
                          return [`${value?.toFixed(2) || '-'}%`, year];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          if (value === 'meta') return <span style={{ color: '#059669', fontWeight: 600 }}>Meta</span>;
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 600 }}>{year}</span>;
                        }}
                      />
                      {[...availableYears].sort((a, b) => a - b).map((year) => (
                        <Area
                          key={year}
                          type="monotone"
                          dataKey={`imor_${year}`}
                          stroke={yearColors[year]}
                          strokeWidth={year === selectedYear ? 3 : 1.5}
                          fill={`url(#gradient-imor-${year})`}
                          dot={{ fill: yearColors[year], strokeWidth: 0, r: year === selectedYear ? 4 : 2 }}
                          connectNulls
                        />
                      ))}
                      <Line 
                        type="monotone" 
                        dataKey="meta" 
                        stroke="#059669" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Vista Meta Anual */}
          {activeView === 'meta' && metrics && (
            <motion.div
              key="meta"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Estado de cumplimiento */}
              <div className={`rounded-2xl p-5 md:p-6 border ${
                metrics.cumpleMetaAnual
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-100/60 border-emerald-200'
                  : 'bg-gradient-to-br from-rose-50 to-red-100/60 border-rose-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg flex-shrink-0 ${
                    metrics.cumpleMetaAnual
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-rose-500 to-red-600'
                  }`}>
                    <Target className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-vision-ink font-bold text-lg mb-2">
                      {metrics.cumpleMetaAnual ? 'Cumpliendo Meta Anual' : 'Por Encima de Meta Anual'}
                    </h4>
                    <p className="text-vision-ink/80 text-sm leading-relaxed">
                      {metrics.cumpleMetaAnual
                        ? `El IMOR actual de ${metrics.imorActual.toFixed(2)}% está por debajo de la meta anual de ${metrics.metaAnual.toFixed(2)}%. ¡Excelente control de morosidad!`
                        : `El IMOR actual de ${metrics.imorActual.toFixed(2)}% supera la meta anual de ${metrics.metaAnual.toFixed(2)}%. Se requieren acciones para reducir la morosidad.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas de meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-200 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Meta Anual (máx)</span>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mt-1">
                    ≤ {metrics.metaAnual.toFixed(2)}%
                  </p>
                </div>
                <div className={`rounded-2xl p-4 border shadow-soft ${
                  metrics.cumpleMetaAnual
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100'
                    : 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-100'
                }`}>
                  <span className="text-soft-slate text-xs sm:text-sm">IMOR Actual</span>
                  <p className={`text-xl sm:text-2xl font-bold mt-1 ${
                    metrics.cumpleMetaAnual ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {metrics.imorActual.toFixed(2)}%
                  </p>
                </div>
                <div className={`rounded-2xl p-4 border shadow-soft ${
                  metrics.diferenciaMetaAnual <= 0
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100'
                }`}>
                  <span className="text-soft-slate text-xs sm:text-sm">Diferencia</span>
                  <p className={`text-xl sm:text-2xl font-bold mt-1 ${
                    metrics.diferenciaMetaAnual <= 0 ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {metrics.diferenciaMetaAnual > 0 ? '+' : ''}{metrics.diferenciaMetaAnual.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Gráfica de progreso hacia meta */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">IMOR vs Meta Anual</h4>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cumplimientoChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value?.toFixed(2) || '-'}%`, 
                          name === 'imor' ? 'IMOR' : 'Meta Anual'
                        ]}
                      />
                      <Legend />
                      <defs>
                        <linearGradient id="gradient-imor-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone"
                        dataKey="imor" 
                        name="IMOR" 
                        fill="url(#gradient-imor-area)"
                        stroke="#4F46E5"
                        strokeWidth={2}
                      />
                      <ReferenceLine 
                        y={metrics.metaAnual} 
                        stroke="#059669" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        label={{ value: 'Meta Anual', position: 'right', fill: '#059669', fontSize: 11 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Estado vacío */}
          {!metrics && (
            <div className="text-center py-12">
              <ShieldAlert size={48} className="text-slate-300 mx-auto mb-4" />
              <h4 className="text-soft-slate text-lg mb-2">Sin datos disponibles</h4>
              <p className="text-soft-slate/60 text-sm">
                No hay registros de IMOR para {selectedYear}.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default IMORAnalysisPanel;
