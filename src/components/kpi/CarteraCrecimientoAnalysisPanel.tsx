/**
 * Panel de Análisis Especializado para Crecimiento de Cartera
 * Muestra evolución de saldos de cartera y porcentaje de crecimiento vs meta
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
  Calendar, 
  Activity,
  Target,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Layers
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition } from '@/types/kpi-definitions';
import { ExpandableDataTable } from './ExpandableDataTable';

interface CarteraCrecimientoAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
  selectedSummaryIndex: number;
  onSummaryChange: (index: number) => void;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type CrecimientoRecord = {
  anio: number;
  mes: number;
  cartera_inicial: number;
  cartera_final: number;
  crecimiento: number;
  meta: number;
  meta_anual?: number;
};

type ViewType = 'overview' | 'monthly' | 'saldos' | 'crecimiento' | 'meta';

export function CarteraCrecimientoAnalysisPanel({
  config,
  filters,
  selectedSummaryIndex,
  onSummaryChange
}: CarteraCrecimientoAnalysisPanelProps) {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [data, setData] = useState<CrecimientoRecord[]>([]);
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

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase
          .from('kpi_colocacion_resumen_3')
          .select('*')
          .eq('is_current', true)
          .order('anio', { ascending: true })
          .order('mes', { ascending: true });

        if (error) throw error;
        setData((result || []) as CrecimientoRecord[]);
      } catch (err) {
        console.error('Error loading crecimiento data:', err);
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
    const palette = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed'];
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

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (currentYearData.length === 0) return null;

    const ultimoMes = Math.max(...currentYearData.map(r => r.mes));
    const ultimoRegistro = currentYearData.find(r => r.mes === ultimoMes);
    
    if (!ultimoRegistro) return null;

    // Saldo actual = cartera_final del último mes
    const saldoActual = ultimoRegistro.cartera_final;
    
    // Crecimiento del mes actual
    const crecimientoActual = ultimoRegistro.crecimiento;
    
    // Meta de crecimiento mensual
    const metaCrecimiento = ultimoRegistro.meta;
    
    // Meta anual de crecimiento
    const metaAnual = ultimoRegistro.meta_anual || metaCrecimiento;
    
    // Crecimiento acumulado (promedio de crecimiento porque es %)
    const crecimientoPromedio = currentYearData.reduce((sum, r) => sum + (r.crecimiento || 0), 0) / currentYearData.length;
    
    // Variación de cartera desde inicio del año
    const primerRegistro = currentYearData[0];
    const variacionAnual = primerRegistro 
      ? ((saldoActual - primerRegistro.cartera_inicial) / primerRegistro.cartera_inicial) * 100
      : 0;

    // Comparar con año anterior
    const yearAnterior = selectedYear - 1;
    const datosAnterior = data.filter(r => r.anio === yearAnterior);
    const ultimoMesAnterior = datosAnterior.find(r => r.mes === ultimoMes);
    const saldoAnterior = ultimoMesAnterior?.cartera_final || null;
    const cambioVsSaldoAnterior = saldoAnterior 
      ? ((saldoActual - saldoAnterior) / saldoAnterior) * 100 
      : null;

    // Cumplimiento de meta
    const cumpleMetaMensual = crecimientoActual >= metaCrecimiento;
    const cumpleMetaAnual = crecimientoPromedio >= metaAnual;
    const avanceMetaAnual = metaAnual > 0 ? (crecimientoPromedio / metaAnual) * 100 : 0;

    return {
      ultimoMes,
      saldoActual,
      crecimientoActual,
      metaCrecimiento,
      metaAnual,
      crecimientoPromedio,
      variacionAnual,
      saldoAnterior,
      cambioVsSaldoAnterior,
      cumpleMetaMensual,
      cumpleMetaAnual,
      avanceMetaAnual,
      totalMeses: currentYearData.length,
      carteraInicial: primerRegistro?.cartera_inicial || 0
    };
  }, [currentYearData, data, selectedYear]);

  // Datos para gráfica de saldos (evolución de cartera)
  const saldosChartData = useMemo(() => {
    return MONTH_NAMES.map((mes, index) => {
      const monthNum = index + 1;
      const point: Record<string, string | number | null> = { mes };
      
      availableYears.forEach(year => {
        const record = data.find(r => r.anio === year && r.mes === monthNum);
        point[`saldo_${year}`] = record ? record.cartera_final : null;
      });
      
      return point;
    });
  }, [availableYears, data]);

  // Datos para gráfica de crecimiento % con meta
  const crecimientoChartData = useMemo(() => {
    return MONTH_NAMES.map((mes, index) => {
      const monthNum = index + 1;
      const record = currentYearData.find(r => r.mes === monthNum);
      
      return {
        mes,
        crecimiento: record ? record.crecimiento : null,
        meta: record ? record.meta : null
      };
    });
  }, [currentYearData]);

  // Datos para ExpandableDataTable (formato estándar)
  const monthlyChartData = useMemo(() => {
    return MONTH_NAMES.map((month, index) => {
      const monthNum = index + 1;
      const entry: Record<string, unknown> = { mes: month, mesNum: monthNum };
      
      // Agregar datos de cada año disponible
      availableYears.forEach((year: number) => {
        const record = data.find(r => r.anio === year && r.mes === monthNum);
        entry[`valor_${year}`] = record ? record.crecimiento : null;
      });
      
      // Agregar meta mensual del año seleccionado
      const currentRecord = data.find(r => r.anio === selectedYear && r.mes === monthNum);
      entry['meta'] = currentRecord ? currentRecord.meta : null;
      
      return entry;
    });
  }, [availableYears, data, selectedYear]);

  // Comparativas mensuales
  const monthlyComparison = useMemo(() => {
    if (!metrics) return null;
    const currentMonth = metrics.ultimoMes;
    const currentValue = metrics.crecimientoActual;
    
    const comparisons: { year: number; value: number; change: number }[] = [];
    
    availableYears.filter(y => y !== selectedYear).forEach(year => {
      const record = data.find(r => r.anio === year && r.mes === currentMonth);
      if (record) {
        comparisons.push({
          year,
          value: record.crecimiento,
          change: currentValue - record.crecimiento
        });
      }
    });
    
    return comparisons;
  }, [metrics, availableYears, data, selectedYear]);

  // Formato de moneda
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
  };

  // Formato de valor para ExpandableDataTable (porcentaje)
  const formatValue = (value: number) => `${value.toFixed(2)}%`;

  // Vista de loading
  if (loading) {
    return (
      <div className="glass-panel">
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-soft-slate">
            <Loader2 className="animate-spin" size={24} />
            <span>Cargando análisis de cartera...</span>
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
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex-shrink-0">
              <BarChart2 className="text-emerald-600" size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-vision-ink font-semibold text-sm md:text-base">Panel de Análisis</h3>
              <p className="text-soft-slate text-xs md:text-sm truncate">Crecimiento de Cartera</p>
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
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'overview', label: 'Resumen', icon: Activity },
            { id: 'monthly', label: 'Mensual', icon: Calendar },
            { id: 'saldos', label: 'Saldos', icon: Wallet },
            { id: 'crecimiento', label: 'Crecimiento', icon: TrendingUp },
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
              {/* Métricas principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Saldo Actual (Cartera Final) */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-4 border border-emerald-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-xs sm:text-sm">Cartera Actual - {FULL_MONTH_NAMES[metrics.ultimoMes - 1]}</span>
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <Wallet size={14} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mb-1 break-all">
                    {formatCurrency(metrics.saldoActual)}
                  </p>
                  {metrics.cambioVsSaldoAnterior !== null && (
                    <div className="flex items-center gap-1.5">
                      {metrics.cambioVsSaldoAnterior >= 0 ? (
                        <ArrowUpRight size={14} className="text-emerald-600" />
                      ) : (
                        <ArrowDownRight size={14} className="text-rose-500" />
                      )}
                      <span className={`text-xs font-medium ${metrics.cambioVsSaldoAnterior >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {metrics.cambioVsSaldoAnterior >= 0 ? '+' : ''}{metrics.cambioVsSaldoAnterior.toFixed(2)}% vs {selectedYear - 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Crecimiento del Mes */}
                <div className={`rounded-2xl p-4 border shadow-soft ${
                  metrics.cumpleMetaMensual
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-xs sm:text-sm">Crecimiento {MONTH_NAMES[metrics.ultimoMes - 1]}</span>
                    <div className={`p-1.5 rounded-lg ${metrics.cumpleMetaMensual ? 'bg-blue-100' : 'bg-amber-100'}`}>
                      <TrendingUp size={14} className={metrics.cumpleMetaMensual ? 'text-blue-600' : 'text-amber-600'} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mb-1">
                    {metrics.crecimientoActual.toFixed(2)}%
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-soft-slate text-xs">Meta:</span>
                    <span className={`text-xs font-medium ${metrics.cumpleMetaMensual ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {metrics.metaCrecimiento.toFixed(2)}%
                    </span>
                    {metrics.cumpleMetaMensual ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={12} className="text-amber-500" />
                    )}
                  </div>
                </div>

                {/* Avance Meta Anual */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 rounded-2xl p-4 border border-violet-100 shadow-soft sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-xs sm:text-sm">Avance Meta Anual</span>
                    <div className="p-1.5 rounded-lg bg-violet-100">
                      <Target size={14} className="text-violet-600" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mb-1">
                    {metrics.avanceMetaAnual.toFixed(1)}%
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-soft-slate text-xs">Promedio:</span>
                    <span className="text-vision-ink/80 text-xs font-medium">
                      {metrics.crecimientoPromedio.toFixed(2)}% / {metrics.metaAnual.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparativas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Comparativa con Meta */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                  <h4 className="text-soft-slate text-sm mb-3 flex items-center gap-2">
                    <Target size={14} className="text-plasma-blue" />
                    Crecimiento vs Meta ({FULL_MONTH_NAMES[metrics.ultimoMes - 1]})
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-vision-ink text-sm">Crecimiento Actual</span>
                      <span className="text-vision-ink font-bold">{metrics.crecimientoActual.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-vision-ink text-sm">Meta Mensual</span>
                      <span className="text-plasma-blue font-bold">{metrics.metaCrecimiento.toFixed(2)}%</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-vision-ink text-sm font-medium">Diferencia</span>
                      <span className={`font-bold ${metrics.cumpleMetaMensual ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {(metrics.crecimientoActual - metrics.metaCrecimiento) >= 0 ? '+' : ''}
                        {(metrics.crecimientoActual - metrics.metaCrecimiento).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparativa Años Anteriores */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                  <h4 className="text-soft-slate text-sm mb-3 flex items-center gap-2">
                    <BarChart2 size={14} className="text-plasma-blue" />
                    Comparativa Años Anteriores
                  </h4>
                  {monthlyComparison && monthlyComparison.length > 0 ? (
                    <div className="space-y-2">
                      {monthlyComparison.map(comp => (
                        <div key={comp.year} className="flex items-center justify-between">
                          <span className="text-vision-ink text-sm">{comp.year}: {comp.value.toFixed(2)}%</span>
                          <span className={`text-sm font-medium ${comp.change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {comp.change >= 0 ? '+' : ''}{comp.change.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-soft-slate/60 text-sm">Sin datos de años anteriores</p>
                  )}
                </div>
              </div>

              {/* Gráfica de crecimiento vs meta */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Crecimiento Mensual vs Meta</h4>
                <div className="h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={crecimientoChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                          name === 'Crecimiento' ? 'Crecimiento' : 'Meta'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="crecimiento" 
                        name="Crecimiento" 
                        fill="#059669" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.85}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="meta" 
                        name="Meta"
                        stroke="#524AE6" 
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
                <h4 className="text-vision-ink font-medium text-sm mb-4">Crecimiento % por Mes - {selectedYear}</h4>
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
                        y={metrics.metaCrecimiento} 
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
                higherIsBetter={true}
                yearColors={yearColors}
              />
            </motion.div>
          )}

          {/* Vista Saldos */}
          {activeView === 'saldos' && metrics && (
            <motion.div
              key="saldos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Resumen de saldos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-200 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Cartera Inicial ({selectedYear})</span>
                  <p className="text-lg sm:text-xl font-bold text-vision-ink mt-1 break-all">
                    {formatCurrency(metrics.carteraInicial)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-4 border border-emerald-100 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Cartera Actual</span>
                  <p className="text-lg sm:text-xl font-bold text-vision-ink mt-1 break-all">
                    {formatCurrency(metrics.saldoActual)}
                  </p>
                </div>
                <div className={`rounded-2xl p-4 border shadow-soft ${
                  metrics.variacionAnual >= 0 
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100'
                    : 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-100'
                }`}>
                  <span className="text-soft-slate text-xs sm:text-sm">Variación Anual</span>
                  <p className={`text-lg sm:text-xl font-bold mt-1 ${metrics.variacionAnual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {metrics.variacionAnual >= 0 ? '+' : ''}{metrics.variacionAnual.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Gráfica de evolución de saldos */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Evolución de Cartera por Año</h4>
                <div className="h-72 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={saldosChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {availableYears.map((year, idx) => (
                          <linearGradient key={year} id={`gradient-saldo-${year}`} x1="0" y1="0" x2="0" y2="1">
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
                        tickFormatter={(v: number) => formatCurrency(v)}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}
                        formatter={(value: number, name: string) => {
                          const year = name.split('_')[1];
                          return [formatCurrency(value || 0), year];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          const year = value.split('_')[1];
                          return <span style={{ color: yearColors[Number(year)], fontWeight: 600 }}>{year}</span>;
                        }}
                      />
                      {[...availableYears].sort((a, b) => a - b).map((year) => (
                        <Area
                          key={year}
                          type="monotone"
                          dataKey={`saldo_${year}`}
                          stroke={yearColors[year]}
                          strokeWidth={year === selectedYear ? 3 : 1.5}
                          fill={`url(#gradient-saldo-${year})`}
                          dot={{ fill: yearColors[year], strokeWidth: 0, r: year === selectedYear ? 4 : 2 }}
                          connectNulls
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Vista Crecimiento */}
          {activeView === 'crecimiento' && metrics && (
            <motion.div
              key="crecimiento"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Métricas de crecimiento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-4 border border-emerald-100 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Crecimiento {MONTH_NAMES[metrics.ultimoMes - 1]}</span>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mt-1">
                    {metrics.crecimientoActual.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-4 border border-blue-100 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Promedio {selectedYear}</span>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mt-1">
                    {metrics.crecimientoPromedio.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 rounded-2xl p-4 border border-violet-100 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Variación Anual Total</span>
                  <p className={`text-xl sm:text-2xl font-bold mt-1 ${metrics.variacionAnual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {metrics.variacionAnual >= 0 ? '+' : ''}{metrics.variacionAnual.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Gráfica de crecimiento mensual */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Crecimiento Mensual vs Meta</h4>
                <div className="h-72 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crecimientoChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                        formatter={(value: number) => [`${value?.toFixed(2) || '-'}%`, 'Crecimiento']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="crecimiento" 
                        name="Crecimiento %" 
                        fill="#059669" 
                        radius={[6, 6, 0, 0]}
                      />
                      <ReferenceLine 
                        y={metrics.metaCrecimiento} 
                        stroke="#dc2626" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        label={{ value: 'Meta', position: 'right', fill: '#dc2626', fontSize: 11 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detalle mensual */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Detalle Mensual</h4>
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="min-w-[500px] space-y-2">
                    {currentYearData.map((record) => {
                      const cumple = record.crecimiento >= record.meta;
                      return (
                        <div
                          key={`${record.anio}-${record.mes}`}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            cumple
                              ? 'bg-emerald-50/80 border-emerald-200'
                              : 'bg-amber-50/80 border-amber-200'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                            cumple ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {MONTH_NAMES[record.mes - 1]}
                          </div>
                          <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-soft-slate text-xs block">Crecimiento</span>
                              <span className="text-vision-ink font-semibold">{record.crecimiento.toFixed(2)}%</span>
                            </div>
                            <div>
                              <span className="text-soft-slate text-xs block">Meta</span>
                              <span className="text-vision-ink font-semibold">{record.meta.toFixed(2)}%</span>
                            </div>
                            <div>
                              <span className="text-soft-slate text-xs block">Diferencia</span>
                              <span className={`font-semibold ${cumple ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {(record.crecimiento - record.meta) >= 0 ? '+' : ''}
                                {(record.crecimiento - record.meta).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          {cumple ? (
                            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                          ) : (
                            <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                  : 'bg-gradient-to-br from-amber-50 to-orange-100/60 border-amber-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg flex-shrink-0 ${
                    metrics.cumpleMetaAnual
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}>
                    <Target className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-vision-ink font-bold text-lg mb-2">
                      {metrics.cumpleMetaAnual ? 'Cumpliendo Meta Anual' : 'Por Debajo de Meta Anual'}
                    </h4>
                    <p className="text-vision-ink/80 text-sm leading-relaxed">
                      {metrics.cumpleMetaAnual
                        ? `El crecimiento promedio de ${metrics.crecimientoPromedio.toFixed(2)}% supera la meta anual de ${metrics.metaAnual.toFixed(2)}%. ¡Excelente desempeño!`
                        : `El crecimiento promedio de ${metrics.crecimientoPromedio.toFixed(2)}% está por debajo de la meta anual de ${metrics.metaAnual.toFixed(2)}%. Se requiere acelerar el crecimiento.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas de meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-200 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Meta Anual</span>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mt-1">
                    {metrics.metaAnual.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-4 border border-blue-100 shadow-soft">
                  <span className="text-soft-slate text-xs sm:text-sm">Promedio Actual</span>
                  <p className="text-xl sm:text-2xl font-bold text-vision-ink mt-1">
                    {metrics.crecimientoPromedio.toFixed(2)}%
                  </p>
                </div>
                <div className={`rounded-2xl p-4 border shadow-soft ${
                  metrics.cumpleMetaAnual
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100'
                }`}>
                  <span className="text-soft-slate text-xs sm:text-sm">Avance</span>
                  <p className={`text-xl sm:text-2xl font-bold mt-1 ${metrics.cumpleMetaAnual ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {metrics.avanceMetaAnual.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Gráfica de progreso */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                <h4 className="text-vision-ink font-medium text-sm mb-4">Progreso hacia Meta Anual</h4>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={crecimientoChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                          name === 'crecimiento' ? 'Crecimiento' : 'Crecimiento'
                        ]}
                      />
                      <Legend />
                      <defs>
                        <linearGradient id="gradient-crecimiento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone"
                        dataKey="crecimiento" 
                        name="Crecimiento" 
                        fill="url(#gradient-crecimiento)"
                        stroke="#059669"
                        strokeWidth={2}
                      />
                      <ReferenceLine 
                        y={metrics.metaAnual} 
                        stroke="#dc2626" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        label={{ value: 'Meta Anual', position: 'right', fill: '#dc2626', fontSize: 11 }}
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
              <Wallet size={48} className="text-slate-300 mx-auto mb-4" />
              <h4 className="text-soft-slate text-lg mb-2">Sin datos disponibles</h4>
              <p className="text-soft-slate/60 text-sm">
                No hay registros de crecimiento de cartera para {selectedYear}.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default CarteraCrecimientoAnalysisPanel;
