/**
 * Panel de Análisis Especializado para ROE y ROA
 * Muestra comparativas: ROE Operativo vs Neto, ROA Operativo vs Neto
 * Con metas y drill-down por entidad
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar, LineChart, Line,
  ComposedChart, Area, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, Calendar, Activity, Target,
  ChevronDown, CheckCircle2, AlertTriangle, Loader2,
  BarChart2, Building2
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition } from '@/types/kpi-definitions';

interface RoeRoaAnalysisPanelProps {
  config: KpiDefinition;
  filters: { anio: number; mes: number };
}

type RoeRoaRecord = {
  anio: number;
  mes: number;
  roe_operativo: number;
  roe_neto: number;
  roa_operativo: number;
  roa_neto: number;
  meta_roe_operativo: number;
  meta_roe_neto: number;
  meta_roa_operativo: number;
  meta_roa_neto: number;
  meta_anual_roe_operativo?: number;
  meta_anual_roe_neto?: number;
  meta_anual_roa_operativo?: number;
  meta_anual_roa_neto?: number;
};

type DetailRecord = {
  anio: number;
  mes: number;
  entidad: string;
  roe_operativo: number;
  roe_neto: number;
  roa_operativo: number;
  roa_neto: number;
};

type ViewType = 'overview' | 'monthly' | 'accumulated' | 'annual';
type MetricType = 'roe' | 'roa';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Colores para las métricas
const METRIC_COLORS = {
  roe_operativo: '#059669', // Emerald
  roe_neto: '#0891b2',      // Cyan
  roa_operativo: '#7c3aed', // Violet
  roa_neto: '#db2777',      // Pink
  meta: '#f59e0b'           // Amber (metas)
};

export function RoeRoaAnalysisPanel({ filters }: RoeRoaAnalysisPanelProps) {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [activeMetric, setActiveMetric] = useState<MetricType>('roe');
  const [data, setData] = useState<RoeRoaRecord[]>([]);
  const [detailData, setDetailData] = useState<DetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(filters.anio);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar resumen - ordenamos por updated_at para tomar el más reciente por mes
        const { data: resumen, error: resumenError } = await supabase
          .from('kpi_roe_roa_resumen')
          .select('*')
          .eq('is_current', true)
          .order('updated_at', { ascending: false });

        if (resumenError) throw resumenError;
        
        // Agrupar por año/mes y tomar solo el registro más reciente de cada combinación
        const groupedData = new Map<string, RoeRoaRecord>();
        for (const record of (resumen || [])) {
          const key = `${record.anio}-${record.mes}`;
          // Como ya viene ordenado por updated_at desc, el primero es el más reciente
          if (!groupedData.has(key)) {
            groupedData.set(key, record as RoeRoaRecord);
          }
        }
        
        // Convertir a array y ordenar por año/mes
        const uniqueData = Array.from(groupedData.values())
          .sort((a, b) => a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio);
        
        setData(uniqueData);

        // Cargar detalle por entidad - mismo tratamiento
        const { data: detalle, error: detalleError } = await supabase
          .from('kpi_roe_roa_detalle')
          .select('anio, mes, entidad, roe_operativo, roe_neto, roa_operativo, roa_neto, updated_at')
          .eq('is_current', true)
          .order('updated_at', { ascending: false });

        if (!detalleError && detalle) {
          // Agrupar por año/mes/entidad
          const groupedDetail = new Map<string, DetailRecord>();
          for (const record of detalle) {
            const key = `${record.anio}-${record.mes}-${record.entidad}`;
            if (!groupedDetail.has(key)) {
              groupedDetail.set(key, record as DetailRecord);
            }
          }
          const uniqueDetail = Array.from(groupedDetail.values())
            .sort((a, b) => a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio);
          setDetailData(uniqueDetail);
        }
      } catch (err) {
        console.error('Error loading ROE/ROA data:', err);
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

  // Datos del año seleccionado
  const currentYearData = useMemo(() => {
    return data.filter(r => r.anio === selectedYear).sort((a, b) => a.mes - b.mes);
  }, [data, selectedYear]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (currentYearData.length === 0) return null;

    const ultimoMes = Math.max(...currentYearData.map(r => r.mes));
    const ultimo = currentYearData.find(r => r.mes === ultimoMes);
    if (!ultimo) return null;

    // Promedios acumulados (para porcentajes se promedian, solo contando valores válidos)
    const calcAvg = (key: keyof RoeRoaRecord): number | null => {
      const vals = currentYearData
        .map(r => r[key])
        .filter((v): v is number => v !== null && v !== undefined && !isNaN(Number(v)));
      if (vals.length === 0) return null;
      const sum = vals.reduce((acc: number, val: number) => acc + val, 0);
      return sum / vals.length;
    };

    // Función para obtener valor numérico o null
    const getVal = (val: unknown): number | null => {
      if (val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    return {
      ultimoMes,
      monthName: FULL_MONTH_NAMES[ultimoMes - 1],
      // Valores actuales
      roe_operativo: getVal(ultimo.roe_operativo),
      roe_neto: getVal(ultimo.roe_neto),
      roa_operativo: getVal(ultimo.roa_operativo),
      roa_neto: getVal(ultimo.roa_neto),
      // Metas mensuales
      meta_roe_operativo: getVal(ultimo.meta_roe_operativo),
      meta_roe_neto: getVal(ultimo.meta_roe_neto),
      meta_roa_operativo: getVal(ultimo.meta_roa_operativo),
      meta_roa_neto: getVal(ultimo.meta_roa_neto),
      // Metas anuales
      meta_anual_roe_operativo: getVal(ultimo.meta_anual_roe_operativo),
      meta_anual_roe_neto: getVal(ultimo.meta_anual_roe_neto),
      meta_anual_roa_operativo: getVal(ultimo.meta_anual_roa_operativo),
      meta_anual_roa_neto: getVal(ultimo.meta_anual_roa_neto),
      // Promedios acumulados
      avg_roe_operativo: calcAvg('roe_operativo'),
      avg_roe_neto: calcAvg('roe_neto'),
      avg_roa_operativo: calcAvg('roa_operativo'),
      avg_roa_neto: calcAvg('roa_neto'),
    };
  }, [currentYearData]);

  // Datos para gráficas mensuales
  const monthlyChartData = useMemo(() => {
    return MONTH_NAMES.map((mes, index) => {
      const monthNum = index + 1;
      const record = currentYearData.find(r => r.mes === monthNum);
      return {
        mes,
        roe_operativo: record?.roe_operativo ?? null,
        roe_neto: record?.roe_neto ?? null,
        roa_operativo: record?.roa_operativo ?? null,
        roa_neto: record?.roa_neto ?? null,
        meta_roe_operativo: record?.meta_roe_operativo ?? null,
        meta_roe_neto: record?.meta_roe_neto ?? null,
        meta_roa_operativo: record?.meta_roa_operativo ?? null,
        meta_roa_neto: record?.meta_roa_neto ?? null,
      };
    });
  }, [currentYearData]);

  // Datos acumulados (promedio progresivo)
  const accumulatedChartData = useMemo(() => {
    let sumRoeOp = 0, sumRoeNeto = 0, sumRoaOp = 0, sumRoaNeto = 0;
    let count = 0;

    return MONTH_NAMES.map((mes, index) => {
      const monthNum = index + 1;
      const record = currentYearData.find(r => r.mes === monthNum);
      
      if (record) {
        sumRoeOp += record.roe_operativo || 0;
        sumRoeNeto += record.roe_neto || 0;
        sumRoaOp += record.roa_operativo || 0;
        sumRoaNeto += record.roa_neto || 0;
        count++;
      }

      return {
        mes,
        acum_roe_operativo: count > 0 ? sumRoeOp / count : null,
        acum_roe_neto: count > 0 ? sumRoeNeto / count : null,
        acum_roa_operativo: count > 0 ? sumRoaOp / count : null,
        acum_roa_neto: count > 0 ? sumRoaNeto / count : null,
        meta_anual_roe_operativo: metrics?.meta_anual_roe_operativo,
        meta_anual_roe_neto: metrics?.meta_anual_roe_neto,
        meta_anual_roa_operativo: metrics?.meta_anual_roa_operativo,
        meta_anual_roa_neto: metrics?.meta_anual_roa_neto,
      };
    });
  }, [currentYearData, metrics]);

  // Detalle por entidad del mes más reciente
  const entityData = useMemo(() => {
    if (!metrics) return [];
    return detailData
      .filter(d => d.anio === selectedYear && d.mes === metrics.ultimoMes)
      .sort((a, b) => (b.roe_operativo || 0) - (a.roe_operativo || 0));
  }, [detailData, selectedYear, metrics]);

  const formatValue = (v: number | null | undefined): string => {
    if (v === null || v === undefined) return '-';
    const num = Number(v);
    return isNaN(num) ? '-' : `${num.toFixed(2)}%`;
  };

  // Render de loading
  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass p-8">
        <div className="flex items-center justify-center gap-3 text-soft-slate">
          <Loader2 className="animate-spin text-plasma-blue" size={24} />
          <span>Cargando análisis ROE/ROA...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass p-8">
        <div className="text-center">
          <BarChart2 size={48} className="mx-auto text-slate-300 mb-4" />
          <h4 className="text-vision-ink font-semibold mb-2">Sin datos disponibles</h4>
          <p className="text-soft-slate text-sm">Captura datos en la pestaña de Resumen para ver el análisis.</p>
        </div>
      </div>
    );
  }

  const renderMetricCard = (
    label: string, 
    value: number | null | undefined, 
    meta: number | null | undefined, 
    _color: string,
    bgGradient: string
  ) => {
    const hasValue = value !== null && value !== undefined;
    const hasMeta = meta !== null && meta !== undefined;
    const cumple = hasValue && hasMeta ? value >= meta : null;
    
    return (
      <div className={`rounded-2xl p-4 border shadow-soft ${bgGradient}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-soft-slate text-xs font-medium">{label}</span>
          {cumple !== null && (
            cumple ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={16} className="text-amber-500" />
            )
          )}
          {!hasValue && (
            <span className="text-xs text-soft-slate/60 bg-slate-100 px-2 py-0.5 rounded-full">Sin datos</span>
          )}
        </div>
        <p className={`text-xl font-bold ${hasValue ? 'text-vision-ink' : 'text-soft-slate/50'}`}>
          {hasValue ? formatValue(value) : 'Sin capturar'}
        </p>
        {hasMeta && (
          <p className="text-xs text-soft-slate mt-1">Meta: {formatValue(meta)}</p>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* ROE: Operativo vs Neto */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
        <h4 className="text-vision-ink font-semibold mb-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          ROE - Retorno sobre Capital ({metrics?.monthName})
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {renderMetricCard(
            'ROE Operativo',
            metrics?.roe_operativo,
            metrics?.meta_roe_operativo,
            METRIC_COLORS.roe_operativo,
            'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100'
          )}
          {renderMetricCard(
            'ROE Neto',
            metrics?.roe_neto,
            metrics?.meta_roe_neto,
            METRIC_COLORS.roe_neto,
            'bg-gradient-to-br from-cyan-50 to-sky-50/50 border-cyan-100'
          )}
        </div>
        {/* Acumulados ROE */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 bg-slate-50/80 rounded-xl">
            <p className="text-xs text-soft-slate">Acum. Operativo</p>
            <p className="font-bold text-emerald-600">{formatValue(metrics?.avg_roe_operativo)}</p>
          </div>
          <div className="text-center p-2 bg-slate-50/80 rounded-xl">
            <p className="text-xs text-soft-slate">Acum. Neto</p>
            <p className="font-bold text-cyan-600">{formatValue(metrics?.avg_roe_neto)}</p>
          </div>
        </div>
      </div>

      {/* ROA: Operativo vs Neto */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
        <h4 className="text-vision-ink font-semibold mb-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          ROA - Retorno sobre Activos ({metrics?.monthName})
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {renderMetricCard(
            'ROA Operativo',
            metrics?.roa_operativo,
            metrics?.meta_roa_operativo,
            METRIC_COLORS.roa_operativo,
            'bg-gradient-to-br from-violet-50 to-purple-50/50 border-violet-100'
          )}
          {renderMetricCard(
            'ROA Neto',
            metrics?.roa_neto,
            metrics?.meta_roa_neto,
            METRIC_COLORS.roa_neto,
            'bg-gradient-to-br from-pink-50 to-rose-50/50 border-pink-100'
          )}
        </div>
        {/* Acumulados ROA */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 bg-slate-50/80 rounded-xl">
            <p className="text-xs text-soft-slate">Acum. Operativo</p>
            <p className="font-bold text-violet-600">{formatValue(metrics?.avg_roa_operativo)}</p>
          </div>
          <div className="text-center p-2 bg-slate-50/80 rounded-xl">
            <p className="text-xs text-soft-slate">Acum. Neto</p>
            <p className="font-bold text-pink-600">{formatValue(metrics?.avg_roa_neto)}</p>
          </div>
        </div>
      </div>

      {/* Gráfica de tendencia */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-vision-ink font-medium text-sm">Tendencia Mensual {selectedYear}</h4>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveMetric('roe')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                activeMetric === 'roe' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'text-soft-slate hover:bg-slate-100'
              }`}
            >
              ROE
            </button>
            <button
              onClick={() => setActiveMetric('roa')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                activeMetric === 'roa' 
                  ? 'bg-violet-100 text-violet-700' 
                  : 'text-soft-slate hover:bg-slate-100'
              }`}
            >
              ROA
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(148,163,184,0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }}
                formatter={(value: number) => [`${value?.toFixed(2)}%`, '']}
              />
              <Legend />
              {activeMetric === 'roe' ? (
                <>
                  <Line type="monotone" dataKey="roe_operativo" name="ROE Operativo" 
                        stroke={METRIC_COLORS.roe_operativo} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="roe_neto" name="ROE Neto" 
                        stroke={METRIC_COLORS.roe_neto} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="meta_roe_operativo" name="Meta Op." 
                        stroke={METRIC_COLORS.meta} strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="roa_operativo" name="ROA Operativo" 
                        stroke={METRIC_COLORS.roa_operativo} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="roa_neto" name="ROA Neto" 
                        stroke={METRIC_COLORS.roa_neto} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="meta_roa_operativo" name="Meta Op." 
                        stroke={METRIC_COLORS.meta} strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalle por Entidad */}
      {entityData.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
          <h4 className="text-vision-ink font-medium text-sm mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-plasma-blue" />
            Detalle por Entidad ({metrics?.monthName})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-soft-slate text-xs border-b border-slate-100">
                  <th className="text-left py-2 px-2">Entidad</th>
                  <th className="text-right py-2 px-2">ROE Op.</th>
                  <th className="text-right py-2 px-2">ROE Neto</th>
                  <th className="text-right py-2 px-2">ROA Op.</th>
                  <th className="text-right py-2 px-2">ROA Neto</th>
                </tr>
              </thead>
              <tbody>
                {entityData.slice(0, 10).map((e, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-2 px-2 font-medium text-vision-ink">{e.entidad}</td>
                    <td className="py-2 px-2 text-right text-emerald-600">{formatValue(e.roe_operativo)}</td>
                    <td className="py-2 px-2 text-right text-cyan-600">{formatValue(e.roe_neto)}</td>
                    <td className="py-2 px-2 text-right text-violet-600">{formatValue(e.roa_operativo)}</td>
                    <td className="py-2 px-2 text-right text-pink-600">{formatValue(e.roa_neto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderMonthly = () => (
    <motion.div
      key="monthly"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Selector ROE/ROA */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setActiveMetric('roe')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeMetric === 'roe' 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
              : 'bg-white/80 text-soft-slate hover:bg-white'
          }`}
        >
          ROE (Operativo vs Neto)
        </button>
        <button
          onClick={() => setActiveMetric('roa')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeMetric === 'roa' 
              ? 'bg-violet-500 text-white shadow-lg shadow-violet-200' 
              : 'bg-white/80 text-soft-slate hover:bg-white'
          }`}
        >
          ROA (Operativo vs Neto)
        </button>
      </div>

      {/* Gráfica de barras comparativas */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
        <h4 className="text-vision-ink font-medium text-sm mb-4">
          Comparativa Mensual {activeMetric.toUpperCase()} {selectedYear}
        </h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(148,163,184,0.3)',
                  borderRadius: '12px'
                }}
                formatter={(value: number) => [`${value?.toFixed(2)}%`, '']}
              />
              <Legend />
              {activeMetric === 'roe' ? (
                <>
                  <Bar dataKey="roe_operativo" name="Operativo" fill={METRIC_COLORS.roe_operativo} radius={[4,4,0,0]} />
                  <Bar dataKey="roe_neto" name="Neto" fill={METRIC_COLORS.roe_neto} radius={[4,4,0,0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="roa_operativo" name="Operativo" fill={METRIC_COLORS.roa_operativo} radius={[4,4,0,0]} />
                  <Bar dataKey="roa_neto" name="Neto" fill={METRIC_COLORS.roa_neto} radius={[4,4,0,0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla mensual detallada */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
        <h4 className="text-vision-ink font-medium text-sm mb-3">Detalle Mensual</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-soft-slate text-xs border-b border-slate-100">
                <th className="text-left py-2">Mes</th>
                <th className="text-right py-2">{activeMetric.toUpperCase()} Op.</th>
                <th className="text-right py-2">Meta Op.</th>
                <th className="text-right py-2">{activeMetric.toUpperCase()} Neto</th>
                <th className="text-right py-2">Meta Neto</th>
              </tr>
            </thead>
            <tbody>
              {currentYearData.map((r, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 font-medium">{MONTH_NAMES[r.mes - 1]}</td>
                  {activeMetric === 'roe' ? (
                    <>
                      <td className="py-2 text-right text-emerald-600">{formatValue(r.roe_operativo)}</td>
                      <td className="py-2 text-right text-soft-slate">{formatValue(r.meta_roe_operativo)}</td>
                      <td className="py-2 text-right text-cyan-600">{formatValue(r.roe_neto)}</td>
                      <td className="py-2 text-right text-soft-slate">{formatValue(r.meta_roe_neto)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 text-right text-violet-600">{formatValue(r.roa_operativo)}</td>
                      <td className="py-2 text-right text-soft-slate">{formatValue(r.meta_roa_operativo)}</td>
                      <td className="py-2 text-right text-pink-600">{formatValue(r.roa_neto)}</td>
                      <td className="py-2 text-right text-soft-slate">{formatValue(r.meta_roa_neto)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const renderAccumulated = () => (
    <motion.div
      key="accumulated"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Selector ROE/ROA */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setActiveMetric('roe')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeMetric === 'roe' 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
              : 'bg-white/80 text-soft-slate hover:bg-white'
          }`}
        >
          ROE Acumulado
        </button>
        <button
          onClick={() => setActiveMetric('roa')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeMetric === 'roa' 
              ? 'bg-violet-500 text-white shadow-lg shadow-violet-200' 
              : 'bg-white/80 text-soft-slate hover:bg-white'
          }`}
        >
          ROA Acumulado
        </button>
      </div>

      {/* Gráfica de líneas acumuladas */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
        <h4 className="text-vision-ink font-medium text-sm mb-4">
          Promedio Acumulado {activeMetric.toUpperCase()} {selectedYear}
        </h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={accumulatedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(148,163,184,0.3)',
                  borderRadius: '12px'
                }}
                formatter={(value: number) => [`${value?.toFixed(2)}%`, '']}
              />
              <Legend />
              {activeMetric === 'roe' ? (
                <>
                  <Area type="monotone" dataKey="acum_roe_operativo" name="Operativo" 
                        fill={METRIC_COLORS.roe_operativo} fillOpacity={0.2} stroke={METRIC_COLORS.roe_operativo} strokeWidth={2} />
                  <Line type="monotone" dataKey="acum_roe_neto" name="Neto" 
                        stroke={METRIC_COLORS.roe_neto} strokeWidth={2} dot={{ r: 4 }} />
                  {metrics?.meta_anual_roe_operativo && (
                    <ReferenceLine y={metrics.meta_anual_roe_operativo} stroke={METRIC_COLORS.meta} 
                                  strokeDasharray="5 5" label={{ value: 'Meta Anual Op.', position: 'right', fontSize: 10 }} />
                  )}
                </>
              ) : (
                <>
                  <Area type="monotone" dataKey="acum_roa_operativo" name="Operativo" 
                        fill={METRIC_COLORS.roa_operativo} fillOpacity={0.2} stroke={METRIC_COLORS.roa_operativo} strokeWidth={2} />
                  <Line type="monotone" dataKey="acum_roa_neto" name="Neto" 
                        stroke={METRIC_COLORS.roa_neto} strokeWidth={2} dot={{ r: 4 }} />
                  {metrics?.meta_anual_roa_operativo && (
                    <ReferenceLine y={metrics.meta_anual_roa_operativo} stroke={METRIC_COLORS.meta} 
                                  strokeDasharray="5 5" label={{ value: 'Meta Anual Op.', position: 'right', fontSize: 10 }} />
                  )}
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen acumulado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-xs text-soft-slate mb-1">ROE Op. Acum.</p>
          <p className="font-bold text-emerald-600">{formatValue(metrics?.avg_roe_operativo)}</p>
        </div>
        <div className="text-center p-3 bg-cyan-50 rounded-xl border border-cyan-100">
          <p className="text-xs text-soft-slate mb-1">ROE Neto Acum.</p>
          <p className="font-bold text-cyan-600">{formatValue(metrics?.avg_roe_neto)}</p>
        </div>
        <div className="text-center p-3 bg-violet-50 rounded-xl border border-violet-100">
          <p className="text-xs text-soft-slate mb-1">ROA Op. Acum.</p>
          <p className="font-bold text-violet-600">{formatValue(metrics?.avg_roa_operativo)}</p>
        </div>
        <div className="text-center p-3 bg-pink-50 rounded-xl border border-pink-100">
          <p className="text-xs text-soft-slate mb-1">ROA Neto Acum.</p>
          <p className="font-bold text-pink-600">{formatValue(metrics?.avg_roa_neto)}</p>
        </div>
      </div>
    </motion.div>
  );

  const renderAnnualGoal = () => {
    const renderProgressBar = (
      label: string, 
      current: number | null | undefined, 
      target: number | null | undefined, 
      color: string
    ) => {
      if (current === null || current === undefined || target === null || target === undefined) return null;
      const percent = (current / target) * 100;
      const isOnTrack = current >= target;

      return (
        <div className="bg-white/60 rounded-xl p-4 border border-white/80">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-vision-ink">{label}</span>
            <span className={`text-sm font-bold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
              {percent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percent, 100)}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-soft-slate">
            <span>Actual: {formatValue(current)}</span>
            <span>Meta: {formatValue(target)}</span>
          </div>
        </div>
      );
    };

    return (
      <motion.div
        key="annual"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-4"
      >
        <div className="bg-white/70 rounded-2xl p-4 border border-white/80">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-amber-500" size={20} />
            <h4 className="text-vision-ink font-semibold">Progreso hacia Metas Anuales {selectedYear}</h4>
          </div>

          <div className="space-y-4">
            {/* ROE */}
            <div>
              <h5 className="text-sm font-medium text-vision-ink mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                ROE - Retorno sobre Capital
              </h5>
              <div className="grid md:grid-cols-2 gap-3">
                {renderProgressBar(
                  'ROE Operativo',
                  metrics?.avg_roe_operativo,
                  metrics?.meta_anual_roe_operativo,
                  METRIC_COLORS.roe_operativo
                )}
                {renderProgressBar(
                  'ROE Neto',
                  metrics?.avg_roe_neto,
                  metrics?.meta_anual_roe_neto,
                  METRIC_COLORS.roe_neto
                )}
              </div>
            </div>

            {/* ROA */}
            <div>
              <h5 className="text-sm font-medium text-vision-ink mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                ROA - Retorno sobre Activos
              </h5>
              <div className="grid md:grid-cols-2 gap-3">
                {renderProgressBar(
                  'ROA Operativo',
                  metrics?.avg_roa_operativo,
                  metrics?.meta_anual_roa_operativo,
                  METRIC_COLORS.roa_operativo
                )}
                {renderProgressBar(
                  'ROA Neto',
                  metrics?.avg_roa_neto,
                  metrics?.meta_anual_roa_neto,
                  METRIC_COLORS.roa_neto
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gráfica comparativa de metas */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
          <h4 className="text-vision-ink font-medium text-sm mb-4">Comparativa: Acumulado vs Meta Anual</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical"
                data={[
                  { name: 'ROE Op.', actual: metrics?.avg_roe_operativo, meta: metrics?.meta_anual_roe_operativo },
                  { name: 'ROE Neto', actual: metrics?.avg_roe_neto, meta: metrics?.meta_anual_roe_neto },
                  { name: 'ROA Op.', actual: metrics?.avg_roa_operativo, meta: metrics?.meta_anual_roa_operativo },
                  { name: 'ROA Neto', actual: metrics?.avg_roa_neto, meta: metrics?.meta_anual_roa_neto },
                ]}
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(value: number) => [`${value?.toFixed(2)}%`, '']} />
                <Legend />
                <Bar dataKey="actual" name="Acumulado" fill="#059669" radius={[0,4,4,0]} />
                <Bar dataKey="meta" name="Meta Anual" fill="#f59e0b" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-glass overflow-visible"
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-50 border border-indigo-200/50">
              <BarChart2 className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-vision-ink font-semibold">Panel de Análisis</h3>
              <p className="text-soft-slate text-sm">ROE y ROA - Operativo vs Neto</p>
            </div>
          </div>

          {/* Selector de año */}
          <div ref={yearDropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white 
                       rounded-xl border border-slate-200 transition-all shadow-soft"
            >
              <Calendar size={14} className="text-plasma-blue" />
              <span className="text-vision-ink font-medium text-sm">{selectedYear}</span>
              <ChevronDown size={14} className={`text-soft-slate transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => { setSelectedYear(year); setIsDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm transition-all first:rounded-t-xl last:rounded-b-xl
                              ${selectedYear === year ? 'bg-plasma-blue/10 text-plasma-blue' : 'hover:bg-slate-50'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {[
            { id: 'overview', label: 'Resumen', icon: Activity },
            { id: 'monthly', label: 'Mensual', icon: Calendar },
            { id: 'accumulated', label: 'Acumulado', icon: TrendingUp },
            { id: 'annual', label: 'Meta Anual', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as ViewType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
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

      {/* Content */}
      <div className="p-4 md:p-5">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'monthly' && renderMonthly()}
          {activeView === 'accumulated' && renderAccumulated()}
          {activeView === 'annual' && renderAnnualGoal()}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
