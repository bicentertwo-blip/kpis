import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Gem,
  Users,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Activity,
  ChevronDown,
  Loader2,
  BarChart2,
  Target,
  ChevronRight,
  MessageSquareText,
  Award,
  Building2
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition } from '@/types/kpi-definitions';

interface GovernanceAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type GovernanceRecord = {
  anio: number;
  mes: number;
  reuniones_consejo: number;
  acuerdos_cumplidos: number;
  meta_acuerdos: number;
  actualizaciones_politica: number;
  observaciones?: string;
  meta_anual?: number;
};

type ViewType = 'overview' | 'timeline' | 'observations';

export function GovernanceAnalysisPanel({
  config: _config,
  filters
}: GovernanceAnalysisPanelProps) {
  void _config; // Mantener para compatibilidad de interfaz
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [data, setData] = useState<GovernanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(filters.anio);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase
          .from('kpi_gobierno_corporativo_resumen')
          .select('*')
          .eq('is_current', true)
          .order('anio', { ascending: true })
          .order('mes', { ascending: true });

        if (error) throw error;
        setData((result || []) as GovernanceRecord[]);
      } catch (err) {
        console.error('Error loading governance data:', err);
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
    const palette = ['#7c3aed', '#4f46e5', '#2563eb', '#0891b2', '#059669'];
    const colors: Record<number, string> = {};
    availableYears.forEach((year, index) => {
      colors[year] = palette[index % palette.length];
    });
    return colors;
  }, [availableYears]);

  // Datos del año seleccionado
  const currentYearData = useMemo(() => {
    return data
      .filter(r => r.anio === selectedYear)
      .sort((a, b) => a.mes - b.mes);
  }, [data, selectedYear]);

  // Datos para gráfica de tendencia
  const chartData = useMemo(() => {
    return MONTH_NAMES.map((mes, index) => {
      const monthNum = index + 1;
      const point: Record<string, string | number | null> = { mes };
      availableYears.forEach(year => {
        const record = data.find(r => r.anio === year && r.mes === monthNum);
        point[`acuerdos_${year}`] = record ? record.acuerdos_cumplidos : null;
        point[`reuniones_${year}`] = record ? record.reuniones_consejo : null;
      });
      return point;
    });
  }, [availableYears, data]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (currentYearData.length === 0) return null;

    const totalReuniones = currentYearData.reduce((sum, r) => sum + (r.reuniones_consejo || 0), 0);
    const totalActualizaciones = currentYearData.reduce((sum, r) => sum + (r.actualizaciones_politica || 0), 0);
    
    // Promedio de cumplimiento de acuerdos
    const promedioAcuerdos = currentYearData.reduce((sum, r) => sum + (r.acuerdos_cumplidos || 0), 0) / currentYearData.length;
    const promedioMeta = currentYearData.reduce((sum, r) => sum + (r.meta_acuerdos || 0), 0) / currentYearData.length;
    
    const ultimoMes = currentYearData[currentYearData.length - 1];
    const acuerdosActual = ultimoMes?.acuerdos_cumplidos || 0;
    const metaAcuerdosActual = ultimoMes?.meta_acuerdos || 100;
    const metaAnual = currentYearData[0]?.meta_anual || 95;
    
    const registrosConObservaciones = currentYearData.filter(
      r => r.observaciones && r.observaciones.trim().length > 0
    );

    // Tendencia de cumplimiento
    const primeros = currentYearData.slice(0, 3);
    const ultimos = currentYearData.slice(-3);
    const promPrimeros = primeros.length > 0 ? primeros.reduce((s, r) => s + r.acuerdos_cumplidos, 0) / primeros.length : 0;
    const promUltimos = ultimos.length > 0 ? ultimos.reduce((s, r) => s + r.acuerdos_cumplidos, 0) / ultimos.length : 0;
    const tendencia = promPrimeros > 0 ? ((promUltimos - promPrimeros) / promPrimeros) * 100 : 0;

    // Cumplimiento vs meta
    const cumplimientoVsMeta = promedioMeta > 0 ? (promedioAcuerdos / promedioMeta) * 100 : 0;
    const enMeta = promedioAcuerdos >= promedioMeta;

    return {
      totalReuniones,
      totalActualizaciones,
      promedioAcuerdos,
      promedioMeta,
      acuerdosActual,
      metaAcuerdosActual,
      metaAnual,
      registrosConObservaciones: registrosConObservaciones.length,
      tendencia,
      cumplimientoVsMeta,
      enMeta,
      totalMeses: currentYearData.length
    };
  }, [currentYearData]);

  const views = [
    { id: 'overview' as const, label: 'Vista General', icon: Activity },
    { id: 'timeline' as const, label: 'Sesiones', icon: Calendar },
    { id: 'observations' as const, label: 'Observaciones', icon: MessageSquareText },
  ];

  if (loading) {
    return (
      <div className="glass-panel p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-violet-500" size={24} />
          <span className="text-soft-slate">Cargando análisis de gobierno...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-panel p-8">
        <div className="text-center">
          <Gem className="mx-auto text-soft-slate/50 mb-3" size={48} />
          <p className="text-soft-slate">No hay datos de gobierno corporativo registrados</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <BarChart2 className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-vision-ink font-semibold text-base md:text-lg">Panel de Análisis</h3>
              <p className="text-soft-slate text-xs md:text-sm">Gobierno Corporativo</p>
            </div>
          </div>

          {/* Selector de año */}
          <div ref={yearDropdownRef} className="relative z-50">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                       rounded-xl border border-slate-200 transition-all duration-200 shadow-soft"
            >
              <Calendar size={14} className="text-violet-500" />
              <span className="text-vision-ink font-medium text-sm">{selectedYear}</span>
              <ChevronDown 
                size={14} 
                className={`text-soft-slate transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-max min-w-[100px] bg-white rounded-xl border border-slate-200 shadow-2xl z-[9999]">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left transition-all duration-150 first:rounded-t-xl last:rounded-b-xl
                              ${selectedYear === year 
                                ? 'bg-violet-50 text-violet-600' 
                                : 'text-vision-ink hover:bg-slate-50'}`}
                  >
                    <span className="font-medium text-sm">{year}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs de vistas */}
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                        ${activeView === id 
                          ? 'bg-white text-violet-600 shadow-sm' 
                          : 'text-soft-slate hover:text-vision-ink'}`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 md:p-5">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && metrics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Estado de Cumplimiento */}
              <div className={`rounded-2xl p-5 border ${
                metrics.enMeta
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-100/60 border-emerald-200'
                  : 'bg-gradient-to-br from-amber-50 to-orange-100/60 border-amber-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    metrics.enMeta
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}>
                    {metrics.enMeta ? (
                      <Award className="text-white" size={24} />
                    ) : (
                      <Target className="text-white" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-vision-ink font-bold text-lg mb-2">
                      {metrics.enMeta ? 'Cumplimiento en Meta' : 'Por debajo de Meta'}
                    </h4>
                    <p className="text-vision-ink/80 text-sm leading-relaxed">
                      El promedio de acuerdos cumplidos es <strong>{metrics.promedioAcuerdos.toFixed(1)}%</strong> 
                      {metrics.enMeta 
                        ? `, alcanzando la meta de ${metrics.promedioMeta.toFixed(1)}%.` 
                        : `, por debajo de la meta de ${metrics.promedioMeta.toFixed(1)}%.`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${metrics.enMeta ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {metrics.cumplimientoVsMeta.toFixed(0)}%
                    </p>
                    <p className="text-xs text-soft-slate">vs meta</p>
                  </div>
                </div>
              </div>

              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Reuniones de Consejo */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 rounded-2xl p-4 border border-violet-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Reuniones {selectedYear}</span>
                    <div className="p-1.5 rounded-lg bg-violet-100">
                      <Users size={14} className="text-violet-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-vision-ink mb-1">
                    {metrics.totalReuniones}
                  </p>
                  <p className="text-xs text-soft-slate">
                    sesiones de consejo
                  </p>
                </div>

                {/* Acuerdos Cumplidos */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl p-4 border border-emerald-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Acuerdos Cumplidos</span>
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold mb-1 ${
                    metrics.acuerdosActual >= metrics.metaAcuerdosActual ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {metrics.acuerdosActual.toFixed(1)}%
                  </p>
                  <p className="text-xs text-soft-slate">
                    Meta: {metrics.metaAcuerdosActual}%
                  </p>
                </div>

                {/* Actualizaciones Políticas */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-4 border border-blue-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Act. Políticas</span>
                    <div className="p-1.5 rounded-lg bg-blue-100">
                      <FileCheck size={14} className="text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-vision-ink mb-1">
                    {metrics.totalActualizaciones}
                  </p>
                  <p className="text-xs text-soft-slate">
                    en el año
                  </p>
                </div>

                {/* Tendencia */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50/50 rounded-2xl p-4 border border-slate-200 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Tendencia</span>
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      {metrics.tendencia >= 0 ? (
                        <TrendingUp size={14} className="text-slate-600" />
                      ) : (
                        <TrendingDown size={14} className="text-slate-600" />
                      )}
                    </div>
                  </div>
                  <p className={`text-3xl font-bold mb-1 ${
                    metrics.tendencia >= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {metrics.tendencia > 0 ? '+' : ''}{metrics.tendencia.toFixed(1)}%
                  </p>
                  <p className="text-xs text-soft-slate">
                    vs inicio del año
                  </p>
                </div>
              </div>

              {/* Gráfica de cumplimiento */}
              <div className="bg-white/60 rounded-2xl border border-slate-100 p-4">
                <h4 className="text-vision-ink font-semibold text-sm mb-4">Evolución de Acuerdos Cumplidos (%)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        {availableYears.map(year => (
                          <linearGradient key={year} id={`gradient-gov-${year}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={yearColors[year]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={yearColors[year]} stopOpacity={0.05} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(v) => `${v}%`}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Cumplimiento']}
                      />
                      <Legend />
                      {availableYears.map(year => (
                        <Area 
                          key={year}
                          type="monotone" 
                          dataKey={`acuerdos_${year}`}
                          name={`Acuerdos ${year}`}
                          stroke={yearColors[year]}
                          strokeWidth={2}
                          fill={`url(#gradient-gov-${year})`}
                          dot={{ fill: yearColors[year], strokeWidth: 2, r: 3 }}
                          connectNulls
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Documentación */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50/50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquareText size={18} className="text-purple-600" />
                  <span className="text-vision-ink font-semibold text-sm">Observaciones Documentadas</span>
                </div>
                <p className="text-4xl font-bold text-vision-ink mb-2">
                  {metrics.registrosConObservaciones}
                </p>
                <p className="text-sm text-soft-slate">
                  de {metrics.totalMeses} meses tienen observaciones registradas
                </p>
                <div className="mt-3 w-full bg-purple-200/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-violet-500 h-2 rounded-full transition-all"
                    style={{ width: `${(metrics.registrosConObservaciones / metrics.totalMeses) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {currentYearData.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto text-soft-slate/50 mb-3" size={40} />
                  <p className="text-soft-slate">No hay registros para {selectedYear}</p>
                </div>
              ) : (
                currentYearData.map((record, index) => {
                  const isExpanded = expandedMonth === record.mes;
                  const hasObservations = record.observaciones && record.observaciones.trim().length > 0;
                  const enMeta = record.acuerdos_cumplidos >= record.meta_acuerdos;
                  
                  return (
                    <motion.div
                      key={record.mes}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                    >
                      <div 
                        className={`bg-white/80 rounded-2xl border transition-all duration-200 cursor-pointer
                                  ${isExpanded 
                                    ? 'border-violet-300 shadow-lg' 
                                    : 'border-slate-100 shadow-soft hover:border-violet-200'}`}
                        onClick={() => setExpandedMonth(isExpanded ? null : record.mes)}
                      >
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                              enMeta 
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                                : 'bg-gradient-to-br from-amber-500 to-orange-600'
                            }`}>
                              <span className="text-white font-bold text-sm">{MONTH_NAMES[record.mes - 1]}</span>
                            </div>
                            <div>
                              <p className="text-vision-ink font-semibold">{FULL_MONTH_NAMES[record.mes - 1]} {record.anio}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-soft-slate text-sm flex items-center gap-1">
                                  <Users size={12} className="text-violet-500" />
                                  {record.reuniones_consejo} reuniones
                                </span>
                                <span className={`text-sm font-medium ${enMeta ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {record.acuerdos_cumplidos.toFixed(1)}% acuerdos
                                </span>
                                <span className="text-soft-slate text-sm flex items-center gap-1">
                                  <FileCheck size={12} className="text-blue-500" />
                                  {record.actualizaciones_politica} políticas
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {hasObservations && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-medium">
                                Observaciones
                              </span>
                            )}
                            <ChevronRight 
                              size={20} 
                              className={`text-soft-slate transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                            />
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && hasObservations && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-3 border border-purple-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquareText size={14} className="text-purple-600" />
                                    <span className="text-purple-700 font-medium text-sm">Observaciones</span>
                                  </div>
                                  <p className="text-vision-ink text-sm whitespace-pre-wrap">{record.observaciones}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeView === 'observations' && (
            <motion.div
              key="observations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareText size={20} className="text-purple-600" />
                <h4 className="text-vision-ink font-semibold">Observaciones del Consejo</h4>
              </div>

              {currentYearData.filter(r => r.observaciones).length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-2xl">
                  <FileText className="mx-auto text-soft-slate/50 mb-3" size={40} />
                  <p className="text-soft-slate">No hay observaciones documentadas para {selectedYear}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentYearData
                    .filter(r => r.observaciones)
                    .map((record, index) => {
                      const enMeta = record.acuerdos_cumplidos >= record.meta_acuerdos;
                      
                      return (
                        <motion.div
                          key={record.mes}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="bg-white/80 rounded-2xl border border-slate-100 shadow-soft overflow-hidden"
                        >
                          <div className={`px-4 py-3 border-b flex items-center gap-3 ${
                            enMeta 
                              ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100' 
                              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100'
                          }`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              enMeta 
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                                : 'bg-gradient-to-br from-amber-500 to-orange-600'
                            }`}>
                              <span className="text-white font-bold text-xs">{MONTH_NAMES[record.mes - 1]}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-vision-ink font-semibold text-sm">{FULL_MONTH_NAMES[record.mes - 1]} {record.anio}</p>
                              <p className="text-soft-slate text-xs">
                                {record.reuniones_consejo} reuniones • {record.acuerdos_cumplidos.toFixed(1)}% acuerdos
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              enMeta 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {enMeta ? 'En meta' : 'Bajo meta'}
                            </span>
                          </div>

                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 size={14} className="text-purple-600" />
                              <span className="text-purple-700 font-semibold text-sm">Notas del Consejo</span>
                            </div>
                            <p className="text-vision-ink text-sm pl-6 border-l-2 border-purple-200 whitespace-pre-wrap">
                              {record.observaciones}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
