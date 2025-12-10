import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Shield,
  ShieldCheck,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  Loader2,
  ChevronDown,
  Eye,
  AlertCircle,
  Activity,
  BarChart2,
  Layers
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition } from '@/types/kpi-definitions';
import { KpiAnalysisPanel } from './KpiAnalysisPanel';
import { CUMPLIMIENTO_CONFIG } from '@/config/kpi-configs';

interface RegulatoryComplianceAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type ObservacionRecord = {
  anio: number;
  mes: number;
  observaciones_cnbv_condusef: number;
  descripcion_observaciones?: string;
  meta: number;
  meta_anual?: number;
};

type MetricType = 'reportes' | 'observaciones';
type ObservacionesView = 'overview' | 'timeline' | 'descriptions';

export function RegulatoryComplianceAnalysisPanel({
  filters
}: RegulatoryComplianceAnalysisPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('reportes');
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);
  const metricDropdownRef = useRef<HTMLDivElement>(null);

  // Para Observaciones - panel especializado
  const [observacionesView, setObservacionesView] = useState<ObservacionesView>('overview');
  const [observacionesData, setObservacionesData] = useState<ObservacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(filters.anio);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Config solo con Reportes a Tiempo para usar KpiAnalysisPanel genérico
  const reportesOnlyConfig: KpiDefinition = useMemo(() => ({
    ...CUMPLIMIENTO_CONFIG,
    summaries: [CUMPLIMIENTO_CONFIG.summaries[0]]
  }), []);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricDropdownRef.current && !metricDropdownRef.current.contains(event.target as Node)) {
        setIsMetricDropdownOpen(false);
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

  // Cargar datos de Observaciones
  useEffect(() => {
    const loadObservaciones = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('kpi_cumplimiento_resumen_2')
          .select('*')
          .eq('is_current', true)
          .order('anio', { ascending: true })
          .order('mes', { ascending: true });

        if (error) throw error;
        setObservacionesData((data || []) as ObservacionRecord[]);
      } catch (err) {
        console.error('Error loading observaciones:', err);
        setObservacionesData([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedMetric === 'observaciones') {
      loadObservaciones();
    }
  }, [selectedMetric]);

  // Años disponibles para Observaciones
  const observacionesYears = useMemo(() => {
    return Array.from(new Set(observacionesData.map(r => r.anio))).sort((a, b) => b - a);
  }, [observacionesData]);

  // Colores para años
  const yearColors: Record<number, string> = useMemo(() => {
    const palette = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#0891b2'];
    const colors: Record<number, string> = {};
    observacionesYears.forEach((year, index) => {
      colors[year] = palette[index % palette.length];
    });
    return colors;
  }, [observacionesYears]);

  // Datos del año seleccionado
  const currentYearObservaciones = useMemo(() => {
    return observacionesData
      .filter(r => r.anio === selectedYear)
      .sort((a, b) => a.mes - b.mes);
  }, [observacionesData, selectedYear]);

  // Datos para gráfica
  const observacionesChartData = useMemo(() => {
    return MONTH_NAMES.map((mes, index) => {
      const monthNum = index + 1;
      const point: Record<string, string | number | null> = { mes };
      observacionesYears.forEach(year => {
        const record = observacionesData.find(r => r.anio === year && r.mes === monthNum);
        point[`año_${year}`] = record ? record.observaciones_cnbv_condusef : null;
      });
      return point;
    });
  }, [observacionesYears, observacionesData]);

  // Métricas calculadas
  const observacionesMetrics = useMemo(() => {
    if (currentYearObservaciones.length === 0) return null;

    const totalObservaciones = currentYearObservaciones.reduce((sum, r) => sum + (r.observaciones_cnbv_condusef || 0), 0);
    const mesesConObservaciones = currentYearObservaciones.filter(r => (r.observaciones_cnbv_condusef || 0) > 0).length;
    const metaAnualObs = currentYearObservaciones[0]?.meta_anual || 0;
    const observacionesConDescripcion = currentYearObservaciones.filter(
      r => r.descripcion_observaciones && r.descripcion_observaciones.trim().length > 0
    );

    const primerSemestre = currentYearObservaciones.filter(r => r.mes <= 6);
    const segundoSemestre = currentYearObservaciones.filter(r => r.mes > 6);
    const obsPrimerSemestre = primerSemestre.reduce((sum, r) => sum + (r.observaciones_cnbv_condusef || 0), 0);
    const obsSegundoSemestre = segundoSemestre.reduce((sum, r) => sum + (r.observaciones_cnbv_condusef || 0), 0);
    const tendencia = segundoSemestre.length > 0 && primerSemestre.length > 0 && obsPrimerSemestre > 0
      ? ((obsSegundoSemestre / segundoSemestre.length) - (obsPrimerSemestre / primerSemestre.length)) / (obsPrimerSemestre / primerSemestre.length) * 100
      : 0;

    return {
      totalObservaciones,
      mesesConObservaciones,
      totalMeses: currentYearObservaciones.length,
      metaAnualObs,
      observacionesConDescripcion: observacionesConDescripcion.length,
      tendencia,
      cumplimiento: totalObservaciones <= metaAnualObs
    };
  }, [currentYearObservaciones]);

  const metricLabels: Record<MetricType, { label: string; icon: typeof Shield; color: string }> = {
    reportes: { label: 'Reportes a Tiempo', icon: FileText, color: 'text-blue-500' },
    observaciones: { label: 'Observaciones CNBV/CONDUSEF', icon: AlertCircle, color: 'text-violet-500' }
  };

  // Selector de métrica (reutilizable)
  const MetricSelector = () => (
    <div ref={metricDropdownRef} className="relative z-50">
      <button
        onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                 rounded-xl border border-slate-200 transition-all duration-200 shadow-soft"
      >
        <Layers size={14} className="text-plasma-indigo" />
        <span className="text-vision-ink font-medium text-sm">{metricLabels[selectedMetric].label}</span>
        <ChevronDown 
          size={14} 
          className={`text-soft-slate transition-transform duration-200 ${isMetricDropdownOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isMetricDropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-max min-w-[240px] bg-white rounded-xl border border-slate-200 shadow-2xl z-[9999]">
          {(Object.keys(metricLabels) as MetricType[]).map((metric) => {
            const { icon: Icon, color } = metricLabels[metric];
            return (
              <button
                key={metric}
                onClick={() => {
                  setSelectedMetric(metric);
                  setIsMetricDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-left transition-all duration-150 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2
                          ${selectedMetric === metric 
                            ? 'bg-plasma-blue/10 text-plasma-blue' 
                            : 'text-vision-ink hover:bg-slate-50'}`}
              >
                <Icon size={16} className={color} />
                <span className="font-medium text-sm">{metricLabels[metric].label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Si está seleccionado REPORTES, usar KpiAnalysisPanel genérico
  // El selector de métrica se inyecta DENTRO del header existente del KpiAnalysisPanel
  if (selectedMetric === 'reportes') {
    return (
      <div className="relative">
        {/* KpiAnalysisPanel con su header nativo */}
        <KpiAnalysisPanel config={reportesOnlyConfig} filters={filters} />
        
        {/* Selector de métrica inyectado en posición absoluta sobre el header */}
        <div className="absolute top-4 md:top-5 right-[140px] md:right-[160px] z-50">
          <MetricSelector />
        </div>
      </div>
    );
  }

  // Panel especializado para OBSERVACIONES
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-white/60">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <BarChart2 className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-vision-ink font-semibold text-base md:text-lg">Panel de Análisis</h3>
              <p className="text-soft-slate text-xs md:text-sm">Observaciones CNBV/CONDUSEF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de métrica */}
            <MetricSelector />

            {/* Selector de año */}
            <div ref={yearDropdownRef} className="relative z-50">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                         rounded-xl border border-slate-200 transition-all duration-200 shadow-soft"
              >
                <Calendar size={14} className="text-plasma-blue" />
                <span className="text-vision-ink font-medium text-sm">{selectedYear}</span>
                <ChevronDown 
                  size={14} 
                  className={`text-soft-slate transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-max min-w-[120px] bg-white rounded-xl border border-slate-200 shadow-2xl z-[9999]">
                  {observacionesYears.map((year) => (
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
            { id: 'timeline', label: 'Línea de Tiempo', icon: Clock },
            { id: 'descriptions', label: 'Descripciones', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setObservacionesView(tab.id as ObservacionesView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${observacionesView === tab.id 
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-soft-slate">
              <Loader2 className="animate-spin" size={24} />
              <span>Cargando observaciones...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Vista Resumen */}
            {observacionesView === 'overview' && observacionesMetrics && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Total Observaciones - Violeta/neutro */}
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 rounded-2xl p-4 border border-violet-100 shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-soft-slate text-sm">Observaciones {selectedYear}</span>
                      <div className="p-1.5 rounded-lg bg-violet-100">
                        <AlertCircle size={14} className="text-violet-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-vision-ink mb-1">
                      {observacionesMetrics.totalObservaciones}
                    </p>
                    <p className="text-xs text-soft-slate">
                      Meta: {observacionesMetrics.metaAnualObs} observaciones
                    </p>
                  </div>

                  {/* Meses con observaciones */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl p-4 border border-indigo-100 shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-soft-slate text-sm">Meses Afectados</span>
                      <div className="p-1.5 rounded-lg bg-indigo-100">
                        <Calendar size={14} className="text-indigo-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-vision-ink mb-1">
                      {observacionesMetrics.mesesConObservaciones}
                    </p>
                    <p className="text-xs text-soft-slate">
                      de {observacionesMetrics.totalMeses} meses registrados
                    </p>
                  </div>

                  {/* Con descripción */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 rounded-2xl p-4 border border-blue-100 shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-soft-slate text-sm">Con Descripción</span>
                      <div className="p-1.5 rounded-lg bg-blue-100">
                        <FileText size={14} className="text-blue-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-vision-ink mb-1">
                      {observacionesMetrics.observacionesConDescripcion}
                    </p>
                    <p className="text-xs text-soft-slate">
                      observaciones documentadas
                    </p>
                  </div>

                  {/* Tendencia */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50/50 rounded-2xl p-4 border border-slate-200 shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-soft-slate text-sm">Tendencia</span>
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        <TrendingDown size={14} className="text-slate-600" />
                      </div>
                    </div>
                    <p className={`text-3xl font-bold mb-1 ${
                      observacionesMetrics.tendencia <= 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {observacionesMetrics.tendencia > 0 ? '+' : ''}{observacionesMetrics.tendencia.toFixed(1)}%
                    </p>
                    <p className="text-xs text-soft-slate">
                      {observacionesMetrics.tendencia <= 0 ? 'Mejorando' : 'Incrementando'}
                    </p>
                  </div>
                </div>

                {/* Estado de cumplimiento */}
                <div className={`rounded-2xl p-5 border ${
                  observacionesMetrics.cumplimiento
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-100/60 border-emerald-200'
                    : 'bg-gradient-to-br from-amber-50 to-orange-100/60 border-amber-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shadow-lg ${
                      observacionesMetrics.cumplimiento
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    }`}>
                      {observacionesMetrics.cumplimiento ? (
                        <ShieldCheck className="text-white" size={24} />
                      ) : (
                        <AlertTriangle className="text-white" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-vision-ink font-bold text-lg mb-2">
                        {observacionesMetrics.cumplimiento ? 'Dentro de Meta' : 'Meta Excedida'}
                      </h4>
                      <p className="text-vision-ink/80 text-sm leading-relaxed">
                        {observacionesMetrics.cumplimiento
                          ? `Las observaciones (${observacionesMetrics.totalObservaciones}) se mantienen dentro de la meta anual (${observacionesMetrics.metaAnualObs}).`
                          : `Se han registrado ${observacionesMetrics.totalObservaciones} observaciones, superando la meta de ${observacionesMetrics.metaAnualObs}.`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gráfica de tendencia */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                  <h4 className="text-vision-ink font-medium text-sm mb-4">Tendencia Mensual por Año</h4>
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={observacionesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          {observacionesYears.map((year, idx) => (
                            <linearGradient key={year} id={`gradient-obs-${year}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={yearColors[year]} stopOpacity={idx === 0 ? 0.25 : 0.08} />
                              <stop offset="95%" stopColor={yearColors[year]} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                        <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '1px solid rgba(148,163,184,0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                          }}
                          formatter={(value: number, name: string) => {
                            const year = name.split('_')[1];
                            return [value ?? '-', year];
                          }}
                        />
                        <Legend 
                          formatter={(value: string) => {
                            const year = value.split('_')[1];
                            return <span style={{ color: yearColors[Number(year)], fontWeight: 600 }}>{year}</span>;
                          }}
                        />
                        {[...observacionesYears].sort((a, b) => a - b).map((year) => (
                          <Area
                            key={year}
                            type="monotone"
                            dataKey={`año_${year}`}
                            stroke={yearColors[year]}
                            strokeWidth={year === selectedYear ? 3 : 1.5}
                            fill={`url(#gradient-obs-${year})`}
                            dot={{ fill: yearColors[year], strokeWidth: 0, r: year === selectedYear ? 4 : 2 }}
                            connectNulls
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Mini timeline - colores neutros violeta/azul */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-soft">
                  <h4 className="text-vision-ink font-medium text-sm mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-plasma-blue" />
                    Observaciones por Mes
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {currentYearObservaciones.map((record) => {
                      const hasObs = (record.observaciones_cnbv_condusef || 0) > 0;
                      const hasDesc = record.descripcion_observaciones && record.descripcion_observaciones.trim().length > 0;
                      
                      return (
                        <div
                          key={`${record.anio}-${record.mes}`}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            hasObs
                              ? 'bg-violet-50/80 border-violet-200'
                              : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            hasObs ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {MONTH_NAMES[record.mes - 1]}
                          </div>
                          <div className="flex-1">
                            <p className="text-vision-ink font-medium text-sm">
                              {record.observaciones_cnbv_condusef || 0} {record.observaciones_cnbv_condusef === 1 ? 'observación' : 'observaciones'}
                            </p>
                            {hasDesc && (
                              <p className="text-soft-slate text-xs flex items-center gap-1 mt-0.5">
                                <FileText size={12} />
                                Con descripción detallada
                              </p>
                            )}
                          </div>
                          {hasObs ? (
                            <AlertCircle className="text-violet-500 flex-shrink-0" size={18} />
                          ) : (
                            <CheckCircle2 className="text-slate-400 flex-shrink-0" size={18} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Vista Timeline - colores violeta */}
            {observacionesView === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-200 via-violet-300 to-violet-200" />
                  <div className="space-y-6">
                    {currentYearObservaciones.map((record, index) => {
                      const hasObs = (record.observaciones_cnbv_condusef || 0) > 0;
                      const hasDesc = record.descripcion_observaciones && record.descripcion_observaciones.trim().length > 0;
                      
                      return (
                        <motion.div
                          key={`${record.anio}-${record.mes}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-12"
                        >
                          <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${
                            hasObs 
                              ? 'bg-gradient-to-br from-violet-400 to-purple-500'
                              : 'bg-gradient-to-br from-slate-300 to-slate-400'
                          }`}>
                            {hasObs ? (
                              <AlertCircle className="text-white" size={18} />
                            ) : (
                              <CheckCircle2 className="text-white" size={18} />
                            )}
                          </div>

                          <div className={`glass-panel p-4 ${hasObs ? 'border-violet-200' : 'border-slate-200'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="text-vision-ink font-bold text-base">
                                  {FULL_MONTH_NAMES[record.mes - 1]} {record.anio}
                                </h5>
                                <p className="text-soft-slate text-sm mt-1">
                                  {record.observaciones_cnbv_condusef || 0} {record.observaciones_cnbv_condusef === 1 ? 'observación' : 'observaciones'}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                hasObs
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {hasObs ? 'Con observaciones' : 'Sin observaciones'}
                              </div>
                            </div>

                            {hasDesc && (
                              <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                                <p className="text-vision-ink/80 text-sm leading-relaxed whitespace-pre-wrap">
                                  {record.descripcion_observaciones}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Vista Descripciones - colores violeta */}
            {observacionesView === 'descriptions' && (
              <motion.div
                key="descriptions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {currentYearObservaciones.filter(r => r.descripcion_observaciones && r.descripcion_observaciones.trim().length > 0).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                    <h4 className="text-soft-slate text-lg mb-2">Sin descripciones disponibles</h4>
                    <p className="text-soft-slate/60 text-sm">
                      No hay observaciones con descripción detallada para {selectedYear}.
                    </p>
                  </div>
                ) : (
                  currentYearObservaciones
                    .filter(r => r.descripcion_observaciones && r.descripcion_observaciones.trim().length > 0)
                    .map((record) => (
                      <motion.div
                        key={`${record.anio}-${record.mes}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === record.mes ? null : record.mes)}
                          className="w-full text-left"
                        >
                          <div className="glass-panel p-4 hover:shadow-glass-hover transition-all duration-200 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-sm">
                                    {MONTH_NAMES[record.mes - 1]}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-vision-ink font-bold text-sm md:text-base">
                                    {FULL_MONTH_NAMES[record.mes - 1]} {record.anio}
                                  </h5>
                                  <p className="text-soft-slate text-xs mt-0.5">
                                    {record.observaciones_cnbv_condusef} {record.observaciones_cnbv_condusef === 1 ? 'observación' : 'observaciones'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Eye size={16} className="text-plasma-blue" />
                                <ChevronDown
                                  size={18}
                                  className={`text-soft-slate transition-transform duration-200 ${
                                    expandedMonth === record.mes ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedMonth === record.mes && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200">
                                      <h6 className="text-vision-ink font-semibold text-sm mb-3 flex items-center gap-2">
                                        <FileText size={14} className="text-plasma-blue" />
                                        Descripción Detallada
                                      </h6>
                                      <p className="text-vision-ink/80 text-sm leading-relaxed whitespace-pre-wrap">
                                        {record.descripcion_observaciones}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </button>
                      </motion.div>
                    ))
                )}
              </motion.div>
            )}

            {/* Estado vacío */}
            {!observacionesMetrics && observacionesView === 'overview' && (
              <div className="text-center py-12">
                <Shield size={48} className="text-slate-300 mx-auto mb-4" />
                <h4 className="text-soft-slate text-lg mb-2">Sin datos disponibles</h4>
                <p className="text-soft-slate/60 text-sm">
                  No hay registros de observaciones para {selectedYear}.
                </p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

export default RegulatoryComplianceAnalysisPanel;
