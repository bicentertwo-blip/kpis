import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Radar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
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
  Zap,
  ClipboardList
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition } from '@/types/kpi-definitions';

interface RiskManagementAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type RiskRecord = {
  anio: number;
  mes: number;
  riesgos_activos: number;
  riesgos_mitigados: number;
  exposicion: number;
  acciones_clave?: string;
  meta_anual?: number;
};

type ViewType = 'overview' | 'timeline' | 'actions';

type RiskLevel = 'bajo' | 'medio' | 'alto';

export function RiskManagementAnalysisPanel({
  config: _config,
  filters
}: RiskManagementAnalysisPanelProps) {
  void _config; // Mantener para compatibilidad de interfaz
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [data, setData] = useState<RiskRecord[]>([]);
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
          .from('kpi_gestion_riesgos_resumen')
          .select('*')
          .eq('is_current', true)
          .order('anio', { ascending: true })
          .order('mes', { ascending: true });

        if (error) throw error;
        setData((result || []) as RiskRecord[]);
      } catch (err) {
        console.error('Error loading risk data:', err);
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
    const palette = ['#64748b', '#475569', '#0891b2', '#2563eb', '#7c3aed'];
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
        point[`activos_${year}`] = record ? record.riesgos_activos : null;
        point[`mitigados_${year}`] = record ? record.riesgos_mitigados : null;
        point[`exposicion_${year}`] = record ? record.exposicion : null;
      });
      return point;
    });
  }, [availableYears, data]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (currentYearData.length === 0) return null;

    const ultimoMes = currentYearData[currentYearData.length - 1];
    const riesgosActuales = ultimoMes?.riesgos_activos || 0;
    const mitigadosActuales = ultimoMes?.riesgos_mitigados || 0;
    const exposicionActual = ultimoMes?.exposicion || 0;
    const metaAnual = currentYearData[0]?.meta_anual || 100;
    
    const totalMitigados = currentYearData.reduce((sum, r) => sum + (r.riesgos_mitigados || 0), 0);
    const promedioExposicion = currentYearData.reduce((sum, r) => sum + (r.exposicion || 0), 0) / currentYearData.length;
    
    const registrosConAcciones = currentYearData.filter(
      r => r.acciones_clave && r.acciones_clave.trim().length > 0
    );

    // Tendencia de exposición (últimos 3 meses vs primeros 3)
    const primeros = currentYearData.slice(0, 3);
    const ultimos = currentYearData.slice(-3);
    const exposicionPrimeros = primeros.length > 0 ? primeros.reduce((s, r) => s + r.exposicion, 0) / primeros.length : 0;
    const exposicionUltimos = ultimos.length > 0 ? ultimos.reduce((s, r) => s + r.exposicion, 0) / ultimos.length : 0;
    const tendenciaExposicion = exposicionPrimeros > 0 ? ((exposicionUltimos - exposicionPrimeros) / exposicionPrimeros) * 100 : 0;

    // Ratio de mitigación
    const ratioMitigacion = riesgosActuales + mitigadosActuales > 0 
      ? (mitigadosActuales / (riesgosActuales + mitigadosActuales)) * 100 
      : 0;

    // Nivel de riesgo
    const nivelRiesgo: RiskLevel = exposicionActual <= 10 ? 'bajo' : exposicionActual <= 25 ? 'medio' : 'alto';

    return {
      riesgosActuales,
      mitigadosActuales,
      exposicionActual,
      metaAnual,
      totalMitigados,
      promedioExposicion,
      registrosConAcciones: registrosConAcciones.length,
      tendenciaExposicion,
      ratioMitigacion,
      nivelRiesgo,
      totalMeses: currentYearData.length
    };
  }, [currentYearData]);

  const views = [
    { id: 'overview' as const, label: 'Vista General', icon: Activity },
    { id: 'timeline' as const, label: 'Evolución', icon: Calendar },
    { id: 'actions' as const, label: 'Acciones Clave', icon: ClipboardList },
  ];

  const riskLevelColors = {
    bajo: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
    medio: { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
    alto: { bg: 'from-red-50 to-rose-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' }
  };

  if (loading) {
    return (
      <div className="glass-panel p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-slate-500" size={24} />
          <span className="text-soft-slate">Cargando análisis de riesgos...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-panel p-8">
        <div className="text-center">
          <Radar className="mx-auto text-soft-slate/50 mb-3" size={48} />
          <p className="text-soft-slate">No hay datos de gestión de riesgos registrados</p>
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
              <BarChart2 className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-vision-ink font-semibold text-base md:text-lg">Panel de Análisis</h3>
              <p className="text-soft-slate text-xs md:text-sm">Gestión de Riesgos</p>
            </div>
          </div>

          {/* Selector de año */}
          <div ref={yearDropdownRef} className="relative z-50">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                       rounded-xl border border-slate-200 transition-all duration-200 shadow-soft"
            >
              <Calendar size={14} className="text-slate-500" />
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
                                ? 'bg-slate-100 text-slate-700' 
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
                          ? 'bg-white text-slate-700 shadow-sm' 
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
              {/* Nivel de Riesgo Actual */}
              <div className={`rounded-2xl p-5 border ${riskLevelColors[metrics.nivelRiesgo].bg} ${riskLevelColors[metrics.nivelRiesgo].border}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    metrics.nivelRiesgo === 'bajo' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                    metrics.nivelRiesgo === 'medio' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    'bg-gradient-to-br from-red-500 to-rose-600'
                  }`}>
                    {metrics.nivelRiesgo === 'bajo' ? (
                      <ShieldCheck className="text-white" size={24} />
                    ) : metrics.nivelRiesgo === 'medio' ? (
                      <Shield className="text-white" size={24} />
                    ) : (
                      <ShieldAlert className="text-white" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-vision-ink font-bold text-lg">
                        Nivel de Riesgo: 
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${riskLevelColors[metrics.nivelRiesgo].badge} ${riskLevelColors[metrics.nivelRiesgo].text}`}>
                        {metrics.nivelRiesgo.charAt(0).toUpperCase() + metrics.nivelRiesgo.slice(1)}
                      </span>
                    </div>
                    <p className="text-vision-ink/80 text-sm leading-relaxed">
                      Exposición actual del <strong>{metrics.exposicionActual.toFixed(1)}%</strong> con {metrics.riesgosActuales} riesgos activos 
                      y {metrics.mitigadosActuales} mitigados en el período.
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Riesgos Activos */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50/50 rounded-2xl p-4 border border-red-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Riesgos Activos</span>
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <AlertTriangle size={14} className="text-red-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-vision-ink mb-1">
                    {metrics.riesgosActuales}
                  </p>
                  <p className="text-xs text-soft-slate">
                    pendientes de mitigar
                  </p>
                </div>

                {/* Mitigados */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl p-4 border border-emerald-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Mitigados</span>
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">
                    {metrics.mitigadosActuales}
                  </p>
                  <p className="text-xs text-soft-slate">
                    {metrics.totalMitigados} total en el año
                  </p>
                </div>

                {/* Exposición */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50/50 rounded-2xl p-4 border border-slate-200 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Exposición</span>
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Target size={14} className="text-slate-600" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold mb-1 ${
                    metrics.exposicionActual <= 10 ? 'text-emerald-600' : 
                    metrics.exposicionActual <= 25 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {metrics.exposicionActual.toFixed(1)}%
                  </p>
                  <p className="text-xs text-soft-slate">
                    promedio: {metrics.promedioExposicion.toFixed(1)}%
                  </p>
                </div>

                {/* Ratio Mitigación */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-4 border border-blue-100 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-soft-slate text-sm">Ratio Mitigación</span>
                    <div className="p-1.5 rounded-lg bg-blue-100">
                      <ShieldCheck size={14} className="text-blue-600" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold mb-1 ${
                    metrics.ratioMitigacion >= 80 ? 'text-emerald-600' : 
                    metrics.ratioMitigacion >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {metrics.ratioMitigacion.toFixed(1)}%
                  </p>
                  <p className="text-xs text-soft-slate">
                    riesgos controlados
                  </p>
                </div>
              </div>

              {/* Gráfica de evolución */}
              <div className="bg-white/60 rounded-2xl border border-slate-100 p-4">
                <h4 className="text-vision-ink font-semibold text-sm mb-4">Evolución de Exposición al Riesgo</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        {availableYears.map(year => (
                          <linearGradient key={year} id={`gradient-exp-${year}`} x1="0" y1="0" x2="0" y2="1">
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
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Exposición']}
                      />
                      <Legend />
                      {availableYears.map(year => (
                        <Area 
                          key={year}
                          type="monotone" 
                          dataKey={`exposicion_${year}`}
                          name={`Exposición ${year}`}
                          stroke={yearColors[year]}
                          strokeWidth={2}
                          fill={`url(#gradient-exp-${year})`}
                          dot={{ fill: yearColors[year], strokeWidth: 2, r: 3 }}
                          connectNulls
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tendencia y Acciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-4 border ${
                  metrics.tendenciaExposicion <= 0 
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100' 
                    : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {metrics.tendenciaExposicion <= 0 ? (
                      <TrendingDown size={18} className="text-emerald-600" />
                    ) : (
                      <TrendingUp size={18} className="text-amber-600" />
                    )}
                    <span className="text-vision-ink font-semibold text-sm">Tendencia de Exposición</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${
                    metrics.tendenciaExposicion <= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {metrics.tendenciaExposicion > 0 ? '+' : ''}{metrics.tendenciaExposicion.toFixed(1)}%
                  </p>
                  <p className="text-sm text-soft-slate">
                    {metrics.tendenciaExposicion <= 0 
                      ? 'La exposición al riesgo está disminuyendo' 
                      : 'La exposición al riesgo ha incrementado'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 rounded-2xl p-4 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList size={18} className="text-indigo-600" />
                    <span className="text-vision-ink font-semibold text-sm">Acciones Documentadas</span>
                  </div>
                  <p className="text-4xl font-bold text-vision-ink mb-2">
                    {metrics.registrosConAcciones}
                  </p>
                  <p className="text-sm text-soft-slate">
                    de {metrics.totalMeses} meses tienen acciones clave registradas
                  </p>
                  <div className="mt-3 w-full bg-indigo-200/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${(metrics.registrosConAcciones / metrics.totalMeses) * 100}%` }}
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
                  const hasActions = record.acciones_clave && record.acciones_clave.trim().length > 0;
                  const riskLevel = record.exposicion <= 10 ? 'bajo' : record.exposicion <= 25 ? 'medio' : 'alto';
                  
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
                                    ? 'border-slate-400 shadow-lg' 
                                    : 'border-slate-100 shadow-soft hover:border-slate-300'}`}
                        onClick={() => setExpandedMonth(isExpanded ? null : record.mes)}
                      >
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                              riskLevel === 'bajo' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                              riskLevel === 'medio' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                              'bg-gradient-to-br from-red-500 to-rose-600'
                            }`}>
                              <span className="text-white font-bold text-sm">{MONTH_NAMES[record.mes - 1]}</span>
                            </div>
                            <div>
                              <p className="text-vision-ink font-semibold">{FULL_MONTH_NAMES[record.mes - 1]} {record.anio}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-soft-slate text-sm flex items-center gap-1">
                                  <AlertTriangle size={12} className="text-red-500" />
                                  {record.riesgos_activos} activos
                                </span>
                                <span className="text-soft-slate text-sm flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  {record.riesgos_mitigados} mitigados
                                </span>
                                <span className={`text-sm font-medium ${
                                  record.exposicion <= 10 ? 'text-emerald-600' : 
                                  record.exposicion <= 25 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {record.exposicion.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {hasActions && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-lg font-medium">
                                Acciones
                              </span>
                            )}
                            <ChevronRight 
                              size={20} 
                              className={`text-soft-slate transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                            />
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && hasActions && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ClipboardList size={14} className="text-indigo-600" />
                                    <span className="text-indigo-700 font-medium text-sm">Acciones Clave</span>
                                  </div>
                                  <p className="text-vision-ink text-sm whitespace-pre-wrap">{record.acciones_clave}</p>
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

          {activeView === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={20} className="text-indigo-600" />
                <h4 className="text-vision-ink font-semibold">Acciones Clave de Mitigación</h4>
              </div>

              {currentYearData.filter(r => r.acciones_clave).length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-2xl">
                  <FileText className="mx-auto text-soft-slate/50 mb-3" size={40} />
                  <p className="text-soft-slate">No hay acciones clave documentadas para {selectedYear}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentYearData
                    .filter(r => r.acciones_clave)
                    .map((record, index) => {
                      const riskLevel = record.exposicion <= 10 ? 'bajo' : record.exposicion <= 25 ? 'medio' : 'alto';
                      
                      return (
                        <motion.div
                          key={record.mes}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="bg-white/80 rounded-2xl border border-slate-100 shadow-soft overflow-hidden"
                        >
                          <div className={`px-4 py-3 border-b flex items-center gap-3 ${
                            riskLevel === 'bajo' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100' :
                            riskLevel === 'medio' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100' :
                            'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
                          }`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              riskLevel === 'bajo' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                              riskLevel === 'medio' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                              'bg-gradient-to-br from-red-500 to-rose-600'
                            }`}>
                              <span className="text-white font-bold text-xs">{MONTH_NAMES[record.mes - 1]}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-vision-ink font-semibold text-sm">{FULL_MONTH_NAMES[record.mes - 1]} {record.anio}</p>
                              <p className="text-soft-slate text-xs">
                                {record.riesgos_activos} activos • {record.riesgos_mitigados} mitigados • {record.exposicion.toFixed(1)}% exposición
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${riskLevelColors[riskLevel].badge} ${riskLevelColors[riskLevel].text}`}>
                              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                            </span>
                          </div>

                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap size={14} className="text-indigo-600" />
                              <span className="text-indigo-700 font-semibold text-sm">Acciones de Mitigación</span>
                            </div>
                            <p className="text-vision-ink text-sm pl-6 border-l-2 border-indigo-200 whitespace-pre-wrap">
                              {record.acciones_clave}
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
