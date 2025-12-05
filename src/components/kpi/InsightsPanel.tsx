/**
 * InsightsPanel - Panel de Insights ejecutivo
 * Muestra resumen de top performers, distribución y proyección
 * Solo se muestra en la vista Resumen
 */

import { motion } from 'framer-motion';
import { 
  Trophy,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Sparkles,
  Minus,
  PieChart
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, DetailLayoutDefinition } from '@/types/kpi-definitions';
import { cn } from '@/utils/ui';

interface InsightsPanelProps {
  config: KpiDefinition;
  selectedSummaryIndex: number;
  selectedYear: number;
  currentMonth: number;
  accumulatedValue: number;
  metaAnual: number | null;
  formatValue: (value: number, short?: boolean) => string;
  higherIsBetter: boolean;
}

interface DimensionSummary {
  name: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  metaCompliance: number | null;
}

// Colores para distribución
const DISTRIBUTION_COLORS = [
  { bg: 'bg-emerald-500', text: 'text-emerald-700' },
  { bg: 'bg-blue-500', text: 'text-blue-700' },
  { bg: 'bg-indigo-500', text: 'text-indigo-700' },
  { bg: 'bg-violet-500', text: 'text-violet-700' },
  { bg: 'bg-amber-500', text: 'text-amber-700' },
  { bg: 'bg-rose-500', text: 'text-rose-700' },
];

export function InsightsPanel({
  config,
  selectedSummaryIndex,
  selectedYear,
  currentMonth,
  accumulatedValue,
  metaAnual,
  formatValue,
  higherIsBetter: _higherIsBetter
}: InsightsPanelProps) {
  const [dimensionData, setDimensionData] = useState<DimensionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryDimension, setPrimaryDimension] = useState<string>('');

  // Obtener definición de detalle
  const selectedDetail: DetailLayoutDefinition | undefined = useMemo(() => {
    if (!config.details || config.details.length === 0) return undefined;
    if (config.details.length > selectedSummaryIndex) {
      return config.details[selectedSummaryIndex];
    }
    return config.details[0];
  }, [config.details, selectedSummaryIndex]);

  // Detectar dimensión principal y campo métrico
  const { dimensionKey, metricKey } = useMemo(() => {
    if (!selectedDetail?.columns) return { dimensionKey: '', metricKey: 'valor' };
    
    const dimensionPriority = ['region', 'entidad', 'plaza', 'producto', 'tipo', 'comite', 'proyecto'];
    const excludeFields = ['anio', 'mes', 'meta', 'is_current', 'owner_id', 'id', 'created_at'];
    
    const dimKey = dimensionPriority.find(d => selectedDetail.columns.includes(d)) || '';
    const metKey = selectedDetail.columns.find(
      col => !excludeFields.includes(col) && !dimensionPriority.includes(col) && !col.startsWith('meta')
    ) || 'valor';
    
    return { dimensionKey: dimKey, metricKey: metKey };
  }, [selectedDetail]);

  // Cargar datos agrupados por dimensión
  useEffect(() => {
    const loadData = async () => {
      if (!selectedDetail || !dimensionKey) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setPrimaryDimension(dimensionKey);

      try {
        // Cargar datos del año actual
        const { data: currentData, error: currentError } = await supabase
          .from(selectedDetail.tableName)
          .select('*')
          .eq('anio', selectedYear)
          .eq('is_current', true)
          .lte('mes', currentMonth);

        if (currentError) throw currentError;

        // Cargar datos del año anterior para tendencia
        const { data: prevData, error: prevError } = await supabase
          .from(selectedDetail.tableName)
          .select('*')
          .eq('anio', selectedYear - 1)
          .eq('is_current', true)
          .lte('mes', currentMonth);

        if (prevError) throw prevError;

        // Agrupar por dimensión - año actual
        const currentGrouped: Record<string, { value: number; meta: number }> = {};
        (currentData || []).forEach((row: Record<string, unknown>) => {
          const key = String(row[dimensionKey] || 'Sin clasificar');
          if (!currentGrouped[key]) {
            currentGrouped[key] = { value: 0, meta: 0 };
          }
          currentGrouped[key].value += Number(row[metricKey]) || 0;
          currentGrouped[key].meta += Number(row.meta) || 0;
        });

        // Agrupar por dimensión - año anterior
        const prevGrouped: Record<string, number> = {};
        (prevData || []).forEach((row: Record<string, unknown>) => {
          const key = String(row[dimensionKey] || 'Sin clasificar');
          prevGrouped[key] = (prevGrouped[key] || 0) + (Number(row[metricKey]) || 0);
        });

        // Calcular totales y porcentajes
        const total = Object.values(currentGrouped).reduce((sum, d) => sum + d.value, 0);
        
        const summaries: DimensionSummary[] = Object.entries(currentGrouped)
          .map(([name, data]) => {
            const prevValue = prevGrouped[name] || 0;
            const change = prevValue > 0 ? ((data.value - prevValue) / prevValue) * 100 : 0;
            
            return {
              name,
              value: data.value,
              percentage: total > 0 ? (data.value / total) * 100 : 0,
              trend: Math.abs(change) < 1 ? 'stable' : (change > 0 ? 'up' : 'down') as 'up' | 'down' | 'stable',
              trendValue: change,
              metaCompliance: data.meta > 0 ? (data.value / data.meta) * 100 : null
            };
          })
          .sort((a, b) => b.value - a.value);

        setDimensionData(summaries);
      } catch (err) {
        console.error('Error loading insights data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDetail, dimensionKey, metricKey, selectedYear, currentMonth]);

  // Calcular proyección
  const projection = useMemo(() => {
    if (currentMonth === 0 || accumulatedValue === 0) return null;
    const monthlyAvg = accumulatedValue / currentMonth;
    const projectedAnnual = monthlyAvg * 12;
    const gap = metaAnual ? projectedAnnual - metaAnual : null;
    const compliance = metaAnual ? (projectedAnnual / metaAnual) * 100 : null;
    
    return { projectedAnnual, gap, compliance, monthlyAvg };
  }, [accumulatedValue, currentMonth, metaAnual]);

  // Top performers y atención requerida
  const { topPerformers, needsAttention } = useMemo(() => {
    if (dimensionData.length === 0) return { topPerformers: [], needsAttention: [] };
    
    const top = dimensionData.slice(0, 3);
    const attention = dimensionData.filter(d => {
      // Requiere atención si: tendencia negativa o cumplimiento bajo
      const lowCompliance = d.metaCompliance !== null && d.metaCompliance < 85;
      const negativeTrend = d.trend === 'down' && d.trendValue < -10;
      return lowCompliance || negativeTrend;
    }).slice(0, 3);
    
    return { topPerformers: top, needsAttention: attention };
  }, [dimensionData]);

  // Si no hay datos o detalle
  if (!selectedDetail || !dimensionKey) {
    return null;
  }

  const dimensionLabel = {
    region: 'Región',
    entidad: 'Entidad', 
    plaza: 'Plaza',
    producto: 'Producto',
    tipo: 'Tipo',
    comite: 'Comité',
    proyecto: 'Proyecto'
  }[primaryDimension] || primaryDimension;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-gradient-to-br from-white/80 via-white/70 to-slate-50/60 backdrop-blur-sm 
                 rounded-2xl border border-white/80 shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-plasma-blue to-indigo-600 shadow-md">
            <BarChart3 size={16} className="text-white" />
          </div>
          <h3 className="text-vision-ink font-semibold text-sm md:text-base">
            Insights del Período
          </h3>
          <span className="text-soft-slate text-xs ml-auto">
            Agrupado por {dimensionLabel}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-plasma-blue/30 border-t-plasma-blue rounded-full animate-spin mx-auto" />
          <p className="text-soft-slate text-sm mt-3">Analizando datos...</p>
        </div>
      ) : (
        <div className="p-4 md:p-5 space-y-4 md:space-y-5">
          {/* Grid de Top Performers y Atención */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Performers */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/50 rounded-xl p-3 md:p-4 border border-emerald-100/80">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-amber-500" />
                <h4 className="text-vision-ink font-medium text-sm">Top Performers</h4>
                <span className="text-xs text-soft-slate">(Acumulado)</span>
              </div>
              
              <div className="space-y-2">
                {topPerformers.map((item, index) => (
                  <div 
                    key={item.name}
                    className="flex items-center gap-2 p-2 bg-white/60 rounded-lg"
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : "bg-amber-700"
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-vision-ink text-sm font-medium flex-1 truncate">
                      {item.name}
                    </span>
                    <div className="text-right">
                      <p className="text-vision-ink text-sm font-semibold tabular-nums">
                        {formatValue(item.value, true)}
                      </p>
                      <p className="text-soft-slate text-xs tabular-nums">
                        {item.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {item.trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                      {item.trend === 'down' && <TrendingDown size={14} className="text-rose-500" />}
                      {item.trend === 'stable' && <Minus size={14} className="text-slate-400" />}
                    </div>
                  </div>
                ))}
                
                {topPerformers.length === 0 && (
                  <p className="text-soft-slate text-sm text-center py-2">Sin datos disponibles</p>
                )}
              </div>
            </div>

            {/* Atención Requerida */}
            <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-xl p-3 md:p-4 border border-amber-100/80">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <h4 className="text-vision-ink font-medium text-sm">Atención Requerida</h4>
              </div>
              
              <div className="space-y-2">
                {needsAttention.map((item) => (
                  <div 
                    key={item.name}
                    className="flex items-center gap-2 p-2 bg-white/60 rounded-lg"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      item.metaCompliance !== null && item.metaCompliance < 70 
                        ? "bg-rose-500" 
                        : "bg-amber-500"
                    )} />
                    <span className="text-vision-ink text-sm font-medium flex-1 truncate">
                      {item.name}
                    </span>
                    <div className="text-right">
                      {item.metaCompliance !== null && (
                        <p className={cn(
                          "text-xs font-medium",
                          item.metaCompliance < 70 ? "text-rose-600" : "text-amber-600"
                        )}>
                          {item.metaCompliance.toFixed(0)}% cumpl.
                        </p>
                      )}
                      {item.trend === 'down' && (
                        <p className="text-rose-500 text-xs flex items-center gap-0.5">
                          <TrendingDown size={10} />
                          {Math.abs(item.trendValue).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {needsAttention.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Sparkles size={16} className="text-emerald-500" />
                    <p className="text-emerald-700 text-sm">Todo en buen estado</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Distribución y Proyección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Distribución Visual */}
            <div className="bg-white/60 rounded-xl p-3 md:p-4 border border-slate-100/80">
              <div className="flex items-center gap-2 mb-3">
                <PieChart size={16} className="text-plasma-blue" />
                <h4 className="text-vision-ink font-medium text-sm">Distribución Acumulada</h4>
              </div>
              
              {/* Barra de distribución */}
              <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 mb-3">
                {dimensionData.slice(0, 6).map((item, index) => (
                  <div
                    key={item.name}
                    className={cn("h-full transition-all duration-500", DISTRIBUTION_COLORS[index].bg)}
                    style={{ width: `${item.percentage}%` }}
                    title={`${item.name}: ${item.percentage.toFixed(1)}%`}
                  />
                ))}
              </div>
              
              {/* Leyenda */}
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {dimensionData.slice(0, 6).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-sm", DISTRIBUTION_COLORS[index].bg)} />
                    <span className="text-xs text-soft-slate truncate max-w-[70px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className={cn("text-xs font-medium", DISTRIBUTION_COLORS[index].text)}>
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Proyección vs Meta */}
            {projection && metaAnual && (
              <div className="bg-white/60 rounded-xl p-3 md:p-4 border border-slate-100/80">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-amber-500" />
                  <h4 className="text-vision-ink font-medium text-sm">Proyección vs Meta</h4>
                </div>
                
                <div className="space-y-3">
                  {/* Barras comparativas */}
                  <div className="space-y-2">
                    {/* Acumulado */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-soft-slate">Acumulado</span>
                        <span className="text-vision-ink font-medium">{formatValue(accumulatedValue, true)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((accumulatedValue / metaAnual) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Proyección */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-soft-slate">Proyección</span>
                        <span className="text-plasma-blue font-medium">{formatValue(projection.projectedAnnual, true)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-plasma-blue rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((projection.projectedAnnual / metaAnual) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Meta */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-soft-slate">Meta Anual</span>
                        <span className="text-amber-600 font-medium">{formatValue(metaAnual, true)}</span>
                      </div>
                      <div className="h-2 bg-amber-100 rounded-full" />
                    </div>
                  </div>
                  
                  {/* Gap */}
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    projection.gap !== null && projection.gap >= 0 
                      ? "bg-emerald-50 border border-emerald-100" 
                      : "bg-rose-50 border border-rose-100"
                  )}>
                    <span className="text-xs text-soft-slate">Gap proyectado:</span>
                    <div className="flex items-center gap-1">
                      {projection.gap !== null && projection.gap >= 0 ? (
                        <TrendingUp size={14} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={14} className="text-rose-500" />
                      )}
                      <span className={cn(
                        "text-sm font-semibold",
                        projection.gap !== null && projection.gap >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {projection.gap !== null ? formatValue(Math.abs(projection.gap), true) : '-'}
                      </span>
                      {projection.compliance !== null && (
                        <span className="text-xs text-soft-slate ml-1">
                          ({projection.compliance.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default InsightsPanel;
