/**
 * Componente de Análisis por Dimensión
 * Se integra dentro de las vistas Mensual, Acumulado y Meta Anual
 * Muestra distribución, ranking y comparativo por dimensión seleccionada
 */

import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Layers,
  MapPin,
  Building2,
  Package,
  Users,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Trophy,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, DetailLayoutDefinition } from '@/types/kpi-definitions';
import { cn } from '@/utils/ui';

interface DimensionAnalysisProps {
  config: KpiDefinition;
  selectedSummaryIndex: number;
  filters: { anio: number; mes: number };
  viewContext: 'monthly' | 'accumulated' | 'annual';
}

type DetailRecord = Record<string, unknown>;

// Configuración de dimensiones
const DIMENSION_CONFIG: Record<string, { icon: React.ElementType; label: string; priority: number }> = {
  region: { icon: MapPin, label: 'Región', priority: 1 },
  plaza: { icon: Building2, label: 'Plaza', priority: 2 },
  entidad: { icon: Building2, label: 'Entidad', priority: 3 },
  producto: { icon: Package, label: 'Producto', priority: 4 },
  puesto: { icon: Users, label: 'Puesto', priority: 5 },
  comite: { icon: Users, label: 'Comité', priority: 6 },
  categoria: { icon: Layers, label: 'Categoría', priority: 7 },
  tipo: { icon: Layers, label: 'Tipo', priority: 8 },
  proyecto: { icon: Layers, label: 'Proyecto', priority: 9 },
  etapa: { icon: Layers, label: 'Etapa', priority: 10 },
};

// Colores para gráficas
const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#22c55e', '#eab308', '#0ea5e9'
];

export function DimensionAnalysis({
  config,
  selectedSummaryIndex,
  filters,
  viewContext
}: DimensionAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailData, setDetailData] = useState<DetailRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'distribution' | 'ranking' | 'comparison'>('distribution');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [isDimensionDropdownOpen, setIsDimensionDropdownOpen] = useState(false);
  
  const dimensionDropdownRef = useRef<HTMLDivElement>(null);

  // Determinar el tipo de valor basándose en los campos del summary
  const valueType = useMemo(() => {
    const selectedSummary = config.summaries[selectedSummaryIndex] || config.summaries[0];
    if (!selectedSummary?.fields) return 'number';
    
    // Buscar el primer campo que no sea mes/meta y determinar su tipo
    const metricField = selectedSummary.fields.find(f => 
      !['anio', 'mes', 'meta'].includes(f.id) && 
      ['currency', 'percentage', 'number'].includes(f.type)
    );
    return metricField?.type || 'number';
  }, [config.summaries, selectedSummaryIndex]);

  const isPercentage = valueType === 'percentage';
  
  const formatValue = useMemo(() => {
    return (value: number, short = false): string => {
      if (isPercentage) {
        return `${value.toFixed(1)}%`;
      }
      if (valueType === 'currency') {
        if (short && Math.abs(value) >= 1000000) {
          return `$${(value / 1000000).toFixed(1)}M`;
        }
        return new Intl.NumberFormat('es-MX', { 
          style: 'currency', 
          currency: 'MXN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      }
      if (short && Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return new Intl.NumberFormat('es-MX').format(value);
    };
  }, [isPercentage, valueType]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dimensionDropdownRef.current && !dimensionDropdownRef.current.contains(event.target as Node)) {
        setIsDimensionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
    };
  }, []);

  // Obtener el detalle correspondiente
  const selectedDetail: DetailLayoutDefinition | undefined = useMemo(() => {
    if (!config.details || config.details.length === 0) return undefined;
    if (config.details.length > selectedSummaryIndex) {
      return config.details[selectedSummaryIndex];
    }
    return config.details[0];
  }, [config.details, selectedSummaryIndex]);

  // Detectar campo métrico principal del detalle
  const detailMetricKey = useMemo(() => {
    if (!selectedDetail?.columns) return 'valor';
    const excludeFields = ['anio', 'mes', 'meta', 'region', 'plaza', 'entidad', 'producto', 'puesto', 
                          'comite', 'categoria', 'tipo', 'proyecto', 'etapa', 'responsable', 'descripcion',
                          'riesgo', 'observaciones'];
    const metricField = selectedDetail.columns.find(
      col => !excludeFields.includes(col) && !col.startsWith('meta')
    );
    return metricField || 'valor';
  }, [selectedDetail]);

  // Detectar dimensiones disponibles
  const availableDimensions = useMemo(() => {
    if (!selectedDetail?.columns) return [];
    const dimensionFields = selectedDetail.columns.filter(col => DIMENSION_CONFIG[col]);
    return dimensionFields.sort((a, b) => 
      (DIMENSION_CONFIG[a]?.priority || 99) - (DIMENSION_CONFIG[b]?.priority || 99)
    );
  }, [selectedDetail]);

  // Establecer dimensión por defecto
  useEffect(() => {
    if (availableDimensions.length > 0 && !selectedDimension) {
      const preferred = availableDimensions.find(d => d === 'plaza' || d === 'region');
      setSelectedDimension(preferred || availableDimensions[0]);
    }
  }, [availableDimensions, selectedDimension]);

  // Cargar datos cuando se expande
  useEffect(() => {
    const loadDetailData = async () => {
      if (!isExpanded || !selectedDetail?.tableName) return;

      setLoading(true);
      try {
        let query = supabase
          .from(selectedDetail.tableName)
          .select('*')
          .eq('anio', filters.anio)
          .eq('is_current', true);

        // Para mensual, filtrar por mes específico
        // Para acumulado y anual, traer todos los meses del año
        if (viewContext === 'monthly') {
          query = query.eq('mes', filters.mes);
        }

        const { data, error } = await query;

        if (error) throw error;
        setDetailData((data || []) as DetailRecord[]);
      } catch (err) {
        console.error('Error loading detail data:', err);
        setDetailData([]);
      } finally {
        setLoading(false);
      }
    };

    loadDetailData();
  }, [isExpanded, selectedDetail, filters, viewContext]);

  // Agrupar datos por dimensión
  const groupedByDimension = useMemo(() => {
    if (!selectedDimension || detailData.length === 0) return [];

    const grouped: Record<string, { value: number; meta: number | null; count: number }> = {};
    
    detailData.forEach(record => {
      const key = String(record[selectedDimension] || 'Sin clasificar');
      if (!grouped[key]) {
        grouped[key] = { value: 0, meta: null, count: 0 };
      }
      grouped[key].value += Number(record[detailMetricKey]) || 0;
      if (record.meta !== null && record.meta !== undefined) {
        grouped[key].meta = (grouped[key].meta || 0) + Number(record.meta);
      }
      grouped[key].count += 1;
    });

    // Para porcentajes o acumulado/anual, promediar
    if (isPercentage || viewContext !== 'monthly') {
      Object.keys(grouped).forEach(key => {
        grouped[key].value = grouped[key].value / grouped[key].count;
        if (grouped[key].meta !== null) {
          grouped[key].meta = grouped[key].meta! / grouped[key].count;
        }
      });
    }

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      value: data.value,
      meta: data.meta,
      count: data.count,
      compliance: data.meta ? (data.value / data.meta) * 100 : null,
      vsMetaDiff: data.meta ? data.value - data.meta : null
    })).sort((a, b) => b.value - a.value);
  }, [detailData, selectedDimension, detailMetricKey, isPercentage, viewContext]);

  // Rankings
  const rankings = useMemo(() => {
    if (groupedByDimension.length === 0) return { top5: [], bottom5: [] };
    const sorted = [...groupedByDimension].sort((a, b) => b.value - a.value);
    return {
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse()
    };
  }, [groupedByDimension]);

  // Datos para gráfica de distribución
  const distributionData = useMemo(() => {
    const total = groupedByDimension.reduce((sum, item) => sum + Math.abs(item.value), 0);
    return groupedByDimension.slice(0, 8).map((item, index) => ({
      name: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
      fullName: item.name,
      value: Math.abs(item.value),
      percentage: total > 0 ? (Math.abs(item.value) / total) * 100 : 0,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [groupedByDimension]);

  // Si no hay detalles disponibles
  if (!selectedDetail || config.details?.length === 0 || availableDimensions.length === 0) {
    return null;
  }

  const contextLabel = viewContext === 'monthly' ? 'mensual' : viewContext === 'accumulated' ? 'acumulado' : 'anual';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 border-t border-slate-100 pt-4"
    >
      {/* Toggle de expansión */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
          isExpanded 
            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50" 
            : "bg-slate-50 hover:bg-slate-100 border border-transparent"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isExpanded ? "bg-indigo-100" : "bg-white"
          )}>
            <Layers size={16} className={isExpanded ? "text-indigo-600" : "text-slate-500"} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-vision-ink">
              Ver detalle por dimensión
            </p>
            <p className="text-xs text-soft-slate">
              Distribución, ranking y comparativo {contextLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <EyeOff size={16} className="text-indigo-500" />
          ) : (
            <Eye size={16} className="text-slate-400" />
          )}
          <ChevronDown 
            size={16} 
            className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-180 text-indigo-500" : "text-slate-400"
            )} 
          />
        </div>
      </button>

      {/* Contenido expandido */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-4"
        >
          {/* Header con selector de dimensión y sub-vistas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Selector de dimensión */}
            <div ref={dimensionDropdownRef} className="relative z-40">
              <button
                onClick={() => setIsDimensionDropdownOpen(!isDimensionDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 
                         rounded-xl border border-slate-200 transition-all duration-200 min-w-[140px] shadow-soft"
              >
                {selectedDimension && DIMENSION_CONFIG[selectedDimension] && (
                  <>
                    {(() => {
                      const Icon = DIMENSION_CONFIG[selectedDimension].icon;
                      return <Icon size={14} className="text-indigo-500" />;
                    })()}
                    <span className="text-vision-ink font-medium text-sm">
                      {DIMENSION_CONFIG[selectedDimension].label}
                    </span>
                  </>
                )}
                <ChevronDown 
                  size={14} 
                  className={cn(
                    "text-soft-slate ml-auto transition-transform duration-200",
                    isDimensionDropdownOpen ? 'rotate-180' : ''
                  )} 
                />
              </button>
              
              {isDimensionDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-max min-w-[160px] bg-white rounded-xl border border-slate-200 shadow-2xl z-[9999]">
                  {availableDimensions.map((dim) => {
                    const DimIcon = DIMENSION_CONFIG[dim]?.icon || Layers;
                    return (
                      <button
                        key={dim}
                        onClick={() => {
                          setSelectedDimension(dim);
                          setIsDimensionDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-all duration-150 flex items-center gap-2",
                          "first:rounded-t-xl last:rounded-b-xl",
                          selectedDimension === dim 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : 'text-vision-ink hover:bg-slate-50 active:bg-slate-100'
                        )}
                      >
                        <DimIcon size={14} />
                        <span className="text-sm font-medium">{DIMENSION_CONFIG[dim]?.label || dim}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl">
              {[
                { id: 'distribution', label: 'Distribución', icon: PieChartIcon },
                { id: 'ranking', label: 'Ranking', icon: Trophy },
                { id: 'comparison', label: 'Comparativo', icon: BarChart3 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubView(tab.id as typeof activeSubView)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeSubView === tab.id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-soft-slate hover:text-vision-ink'
                  )}
                >
                  <tab.icon size={12} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
          )}

          {/* Contenido de sub-vistas */}
          {!loading && detailData.length > 0 && (
            <>
              {/* Distribución */}
              {activeSubView === 'distribution' && distributionData.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gráfica */}
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatValue(value)}
                            contentStyle={{
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Leyenda */}
                    <div className="space-y-2">
                      {distributionData.map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-xs text-vision-ink truncate" title={item.fullName}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-vision-ink">{item.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ranking */}
              {activeSubView === 'ranking' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Top 5 */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 p-4">
                    <h4 className="text-xs font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                      <TrendingUp size={14} />
                      Top 5
                    </h4>
                    <div className="space-y-2">
                      {rankings.top5.map((item, index) => (
                        <div 
                          key={index}
                          className="bg-white/80 rounded-lg p-2.5 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                              index === 0 ? 'bg-amber-400 text-white' :
                              index === 1 ? 'bg-slate-300 text-slate-700' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-slate-100 text-slate-600'
                            )}>
                              {index + 1}
                            </span>
                            <span className="text-xs font-medium text-vision-ink truncate">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 flex-shrink-0 ml-2">
                            {formatValue(item.value, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom 5 */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100 p-4">
                    <h4 className="text-xs font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <TrendingDown size={14} />
                      A Mejorar
                    </h4>
                    <div className="space-y-2">
                      {rankings.bottom5.map((item, index) => (
                        <div 
                          key={index}
                          className="bg-white/80 rounded-lg p-2.5 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">
                              {groupedByDimension.length - rankings.bottom5.length + index + 1}
                            </span>
                            <span className="text-xs font-medium text-vision-ink truncate">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold text-red-700 flex-shrink-0 ml-2">
                            {formatValue(item.value, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Comparativo */}
              {activeSubView === 'comparison' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={groupedByDimension.slice(0, 8)} 
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis 
                          type="number" 
                          tickFormatter={(v) => formatValue(v, true)}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v.length > 10 ? v.substring(0, 10) + '...' : v}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatValue(value), name === 'value' ? 'Valor' : 'Meta']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="value" name="Valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        {groupedByDimension.some(d => d.meta !== null) && (
                          <Bar dataKey="meta" name="Meta" fill="#10b981" radius={[0, 4, 4, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sin datos */}
          {!loading && detailData.length === 0 && (
            <div className="text-center py-6 text-soft-slate text-sm">
              Sin datos de detalle para este período
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
