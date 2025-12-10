import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  FlaskRound,
  Lightbulb,
  FolderOpen,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  BookOpen,
  Sparkles,
  ChevronDown,
  Loader2,
  BarChart2,
  Activity,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition } from '@/types/kpi-definitions';

interface InnovacionAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type InnovacionRecord = {
  anio: number;
  mes: number;
  ideas_registradas: number;
  proyectos_activos: number;
  impacto_esperado?: string;
  aprendizajes?: string;
  meta_anual?: number;
};

type ViewType = 'overview' | 'timeline' | 'insights';

export function InnovacionAnalysisPanel({
  config: _config,
  filters
}: InnovacionAnalysisPanelProps) {
  void _config; // Mantener para compatibilidad de interfaz
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [data, setData] = useState<InnovacionRecord[]>([]);
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
          .from('kpi_innovacion_resumen')
          .select('*')
          .eq('is_current', true)
          .order('anio', { ascending: true })
          .order('mes', { ascending: true });

        if (error) throw error;
        setData((result || []) as InnovacionRecord[]);
      } catch (err) {
        console.error('Error loading innovación data:', err);
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
    const palette = ['#0891b2', '#2563eb', '#7c3aed', '#d97706', '#059669'];
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
        point[`ideas_${year}`] = record ? record.ideas_registradas : null;
        point[`proyectos_${year}`] = record ? record.proyectos_activos : null;
      });
      return point;
    });
  }, [availableYears, data]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (currentYearData.length === 0) return null;

    const totalIdeas = currentYearData.reduce((sum, r) => sum + (r.ideas_registradas || 0), 0);
    const ultimoMes = currentYearData[currentYearData.length - 1];
    const proyectosActuales = ultimoMes?.proyectos_activos || 0;
    const metaAnual = currentYearData[0]?.meta_anual || 0;
    const promedioIdeasMensual = totalIdeas / currentYearData.length;
    
    const registrosConAprendizajes = currentYearData.filter(
      r => r.aprendizajes && r.aprendizajes.trim().length > 0
    );
    const registrosConImpacto = currentYearData.filter(
      r => r.impacto_esperado && r.impacto_esperado.trim().length > 0
    );

    // Tendencia (últimos 3 meses vs primeros 3)
    const primeros = currentYearData.slice(0, 3);
    const ultimos = currentYearData.slice(-3);
    const promPrimeros = primeros.length > 0 ? primeros.reduce((s, r) => s + r.ideas_registradas, 0) / primeros.length : 0;
    const promUltimos = ultimos.length > 0 ? ultimos.reduce((s, r) => s + r.ideas_registradas, 0) / ultimos.length : 0;
    const tendencia = promPrimeros > 0 ? ((promUltimos - promPrimeros) / promPrimeros) * 100 : 0;

    const avance = metaAnual > 0 ? (totalIdeas / metaAnual) * 100 : 0;

    return {
      totalIdeas,
      proyectosActuales,
      metaAnual,
      promedioIdeasMensual,
      registrosConAprendizajes: registrosConAprendizajes.length,
      registrosConImpacto: registrosConImpacto.length,
      tendencia,
      avance,
      totalMeses: currentYearData.length
    };
  }, [currentYearData]);

  const views = [
    { id: 'overview' as const, label: 'Vista General', icon: Activity },
    { id: 'timeline' as const, label: 'Línea del Tiempo', icon: Calendar },
    { id: 'insights' as const, label: 'Aprendizajes', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="glass-panel p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-cyan-500" size={24} />
          <span className="text-soft-slate">Cargando análisis de innovación...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-panel p-8">
        <div className="text-center">
          <FlaskRound className="mx-auto text-soft-slate/50 mb-3" size={48} />
          <p className="text-soft-slate">No hay datos de innovación registrados</p>
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg">
              <BarChart2 className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-vision-ink font-semibold text-base md:text-lg">Panel de Análisis</h3>
              <p className="text-soft-slate text-xs md:text-sm">Innovación Incremental</p>
            </div>
          </div>

          {/* Selector de año */}
          <div ref={yearDropdownRef} className="relative z-50">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                       rounded-xl border border-slate-200 transition-all duration-200 shadow-soft"
            >
              <Calendar size={14} className="text-cyan-500" />
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
                                ? 'bg-cyan-50 text-cyan-600' 
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
                          ? 'bg-white text-cyan-600 shadow-sm' 
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
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Ideas */}
                <div className="bg-gradient-to-br from-cyan-50 to-teal-50/50 rounded-2xl p-4 border border-cyan-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Ideas {selectedYear}</span>
                    <div className="p-1.5 rounded-lg bg-cyan-100">
                      <Lightbulb size={14} className="text-cyan-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-vision-ink mb-1">
                    {metrics.totalIdeas}
                  </p>
                  <p className="text-xs text-soft-slate">
                    ~{metrics.promedioIdeasMensual.toFixed(1)} por mes
                  </p>
                </div>

                {/* Proyectos Activos */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-4 border border-blue-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Proyectos Activos</span>
                    <div className="p-1.5 rounded-lg bg-blue-100">
                      <FolderOpen size={14} className="text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-vision-ink mb-1">
                    {metrics.proyectosActuales}
                  </p>
                  <p className="text-xs text-soft-slate">
                    en desarrollo
                  </p>
                </div>

                {/* Avance vs Meta */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl p-4 border border-emerald-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Avance Meta Anual</span>
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <Target size={14} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold mb-1 ${
                    metrics.avance >= 100 ? 'text-emerald-600' : 
                    metrics.avance >= 75 ? 'text-amber-600' : 'text-vision-ink'
                  }`}>
                    {metrics.avance.toFixed(1)}%
                  </p>
                  <p className="text-xs text-soft-slate">
                    Meta: {metrics.metaAnual} ideas
                  </p>
                </div>

                {/* Tendencia */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 rounded-2xl p-4 border border-violet-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Tendencia</span>
                    <div className="p-1.5 rounded-lg bg-violet-100">
                      {metrics.tendencia >= 0 ? (
                        <TrendingUp size={14} className="text-violet-600" />
                      ) : (
                        <TrendingDown size={14} className="text-violet-600" />
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

              {/* Gráfica de tendencia */}
              <div className="bg-white/60 rounded-2xl border border-slate-100 p-4">
                <h4 className="text-vision-ink font-semibold text-sm mb-4">Ideas Registradas por Mes</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        {availableYears.map(year => (
                          <linearGradient key={year} id={`gradient-ideas-${year}`} x1="0" y1="0" x2="0" y2="1">
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
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      {availableYears.map(year => (
                        <Area 
                          key={year}
                          type="monotone" 
                          dataKey={`ideas_${year}`}
                          name={`Ideas ${year}`}
                          stroke={yearColors[year]}
                          strokeWidth={2}
                          fill={`url(#gradient-ideas-${year})`}
                          dot={{ fill: yearColors[year], strokeWidth: 2, r: 3 }}
                          connectNulls
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Documentación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={18} className="text-amber-600" />
                    <span className="text-vision-ink font-semibold text-sm">Aprendizajes Documentados</span>
                  </div>
                  <p className="text-4xl font-bold text-vision-ink mb-2">
                    {metrics.registrosConAprendizajes}
                  </p>
                  <p className="text-sm text-soft-slate">
                    de {metrics.totalMeses} meses tienen aprendizajes registrados
                  </p>
                  <div className="mt-3 w-full bg-amber-200/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(metrics.registrosConAprendizajes / metrics.totalMeses) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-rose-50/50 rounded-2xl p-4 border border-pink-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={18} className="text-pink-600" />
                    <span className="text-vision-ink font-semibold text-sm">Impacto Esperado</span>
                  </div>
                  <p className="text-4xl font-bold text-vision-ink mb-2">
                    {metrics.registrosConImpacto}
                  </p>
                  <p className="text-sm text-soft-slate">
                    de {metrics.totalMeses} meses tienen impacto documentado
                  </p>
                  <div className="mt-3 w-full bg-pink-200/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all"
                      style={{ width: `${(metrics.registrosConImpacto / metrics.totalMeses) * 100}%` }}
                    />
                  </div>
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
                  const hasContent = record.aprendizajes || record.impacto_esperado;
                  
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
                                    ? 'border-cyan-300 shadow-lg' 
                                    : 'border-slate-100 shadow-soft hover:border-cyan-200'}`}
                        onClick={() => setExpandedMonth(isExpanded ? null : record.mes)}
                      >
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-sm">{MONTH_NAMES[record.mes - 1]}</span>
                            </div>
                            <div>
                              <p className="text-vision-ink font-semibold">{FULL_MONTH_NAMES[record.mes - 1]} {record.anio}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-soft-slate text-sm flex items-center gap-1">
                                  <Lightbulb size={12} className="text-cyan-500" />
                                  {record.ideas_registradas} ideas
                                </span>
                                <span className="text-soft-slate text-sm flex items-center gap-1">
                                  <FolderOpen size={12} className="text-blue-500" />
                                  {record.proyectos_activos} proyectos
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {hasContent && (
                              <div className="flex gap-1">
                                {record.aprendizajes && (
                                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-medium">
                                    Aprendizajes
                                  </span>
                                )}
                                {record.impacto_esperado && (
                                  <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-lg font-medium">
                                    Impacto
                                  </span>
                                )}
                              </div>
                            )}
                            <ChevronRight 
                              size={20} 
                              className={`text-soft-slate transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                            />
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && hasContent && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-slate-100">
                                {record.impacto_esperado && (
                                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-3 border border-pink-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Zap size={14} className="text-pink-600" />
                                      <span className="text-pink-700 font-medium text-sm">Impacto Esperado</span>
                                    </div>
                                    <p className="text-vision-ink text-sm">{record.impacto_esperado}</p>
                                  </div>
                                )}
                                {record.aprendizajes && (
                                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <BookOpen size={14} className="text-amber-600" />
                                      <span className="text-amber-700 font-medium text-sm">Aprendizajes</span>
                                    </div>
                                    <p className="text-vision-ink text-sm whitespace-pre-wrap">{record.aprendizajes}</p>
                                  </div>
                                )}
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

          {activeView === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-amber-600" />
                <h4 className="text-vision-ink font-semibold">Aprendizajes e Impactos del Año</h4>
              </div>

              {currentYearData.filter(r => r.aprendizajes || r.impacto_esperado).length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-2xl">
                  <Sparkles className="mx-auto text-soft-slate/50 mb-3" size={40} />
                  <p className="text-soft-slate">No hay aprendizajes ni impactos documentados para {selectedYear}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentYearData
                    .filter(r => r.aprendizajes || r.impacto_esperado)
                    .map((record, index) => (
                      <motion.div
                        key={record.mes}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="bg-white/80 rounded-2xl border border-slate-100 shadow-soft overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-cyan-100 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{MONTH_NAMES[record.mes - 1]}</span>
                          </div>
                          <div>
                            <p className="text-vision-ink font-semibold text-sm">{FULL_MONTH_NAMES[record.mes - 1]} {record.anio}</p>
                            <p className="text-soft-slate text-xs">{record.ideas_registradas} ideas • {record.proyectos_activos} proyectos</p>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {record.impacto_esperado && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Zap size={14} className="text-pink-600" />
                                <span className="text-pink-700 font-semibold text-sm">Impacto Esperado</span>
                              </div>
                              <p className="text-vision-ink text-sm pl-6 border-l-2 border-pink-200">
                                {record.impacto_esperado}
                              </p>
                            </div>
                          )}
                          {record.aprendizajes && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen size={14} className="text-amber-600" />
                                <span className="text-amber-700 font-semibold text-sm">Aprendizajes</span>
                              </div>
                              <p className="text-vision-ink text-sm pl-6 border-l-2 border-amber-200 whitespace-pre-wrap">
                                {record.aprendizajes}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
