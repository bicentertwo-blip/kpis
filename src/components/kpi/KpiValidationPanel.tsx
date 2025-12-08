/**
 * Panel de Validación de Consistencia
 * Compara datos de Resumen Acumulado vs Detalle Acumulado del año completo
 * Identifica discrepancias y las clasifica (redondeo, menor, significativa, mayor)
 */

import { motion } from 'framer-motion';
import { 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  Database,
  Loader2,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { KpiDefinition, SectionDefinition, DetailLayoutDefinition } from '@/types/kpi-definitions';
import { cn } from '@/utils/ui';

interface KpiValidationPanelProps {
  config: KpiDefinition;
  selectedYear: number;
  currentMonth: number;
  selectedSummaryIndex: number;
  summaryAccumulated: number;
  summaryMetaAnual: number | null;
  metricLabel: string;
}

type DetailRecord = Record<string, unknown>;

// Umbrales para validación de consistencia
const CONSISTENCY_THRESHOLDS = {
  exact: 0.001,      // < 0.1% = exacto
  rounding: 0.01,    // < 1% = redondeo
  minor: 0.05,       // < 5% = diferencia menor
  major: 0.10        // > 10% = inconsistencia mayor
};

export function KpiValidationPanel({
  config,
  selectedYear,
  currentMonth,
  selectedSummaryIndex,
  summaryAccumulated,
  summaryMetaAnual,
  metricLabel
}: KpiValidationPanelProps) {
  const [detailData, setDetailData] = useState<DetailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener el detalle correspondiente al resumen seleccionado
  const selectedDetail: DetailLayoutDefinition | undefined = useMemo(() => {
    if (!config.details || config.details.length === 0) return undefined;
    if (config.details.length > selectedSummaryIndex) {
      return config.details[selectedSummaryIndex];
    }
    return config.details[0];
  }, [config.details, selectedSummaryIndex]);

  // Obtener el resumen seleccionado
  const selectedSummary: SectionDefinition | undefined = config.summaries[selectedSummaryIndex];

  // Detectar campo métrico principal del detalle y campo de peso
  const { detailMetricKey, weightKey } = useMemo(() => {
    if (!selectedDetail?.columns) return { detailMetricKey: 'valor', weightKey: null };
    const excludeFields = ['anio', 'mes', 'meta', 'region', 'plaza', 'entidad', 'producto', 'puesto', 
                          'comite', 'categoria', 'tipo', 'proyecto', 'etapa', 'responsable', 'descripcion',
                          'riesgo', 'observaciones', 'is_current', 'owner_id', 'id', 'created_at',
                          'macro_proceso', 'proceso', 'sub_proceso', 'servicio'];
    
    // Campos que típicamente son porcentajes/tasas/índices
    const percentagePatterns = ['indice', 'ratio', 'porcentaje', 'tasa', 'roe', 'roa', 'margen', 'nps', 'satisfaccion', 'digitalizados', 'automaticas'];
    // Campos que pueden usarse como peso para promedios ponderados
    const weightPatterns = ['total', 'monto', 'cartera', 'creditos', 'clientes', 'operaciones', 'cantidad'];
    
    // Buscar primero campos de porcentaje
    const percentageField = selectedDetail.columns.find(
      col => percentagePatterns.some(pattern => col.toLowerCase().includes(pattern)) &&
             !excludeFields.includes(col)
    );
    
    const metricField = percentageField || selectedDetail.columns.find(
      col => !excludeFields.includes(col) && !col.startsWith('meta')
    );
    
    // Buscar campo de peso
    const wtKey = selectedDetail.columns.find(
      col => weightPatterns.some(pattern => col.toLowerCase().includes(pattern))
    );
    
    return { detailMetricKey: metricField || 'valor', weightKey: wtKey || null };
  }, [selectedDetail]);

  // Determinar si es porcentaje
  const isPercentage = useMemo(() => {
    if (!selectedSummary?.fields) return false;
    const metricField = selectedSummary.fields.find(
      f => !['anio', 'mes', 'meta'].includes(f.id) && !f.id.startsWith('meta')
    );
    return metricField?.type === 'percentage';
  }, [selectedSummary]);

  // Determinar el tipo de campo para formato
  const fieldType = useMemo(() => {
    if (!selectedSummary?.fields) return 'currency';
    const metricField = selectedSummary.fields.find(
      f => !['anio', 'mes', 'meta'].includes(f.id) && !f.id.startsWith('meta')
    );
    return metricField?.type || 'currency';
  }, [selectedSummary]);

  const isNumber = fieldType === 'number';
  const isIndex = fieldType === 'index';

  // Cargar datos del detalle - TODO el año hasta el mes actual
  useEffect(() => {
    const loadDetailData = async () => {
      if (!selectedDetail?.tableName) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(selectedDetail.tableName)
          .select('*')
          .eq('anio', selectedYear)
          .lte('mes', currentMonth)
          .eq('is_current', true);

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
  }, [selectedDetail, selectedYear, currentMonth]);

  // Formatear valor
  const formatValue = useCallback((v: number | null | undefined): string => {
    if (v === null || v === undefined) return '-';
    if (isPercentage) return `${v.toFixed(2)}%`;
    if (isIndex) return v.toFixed(1);
    if (isNumber) return Math.round(v).toLocaleString('es-MX'); // Sin decimales para números
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
  }, [isPercentage, isIndex, isNumber]);

  // Calcular totales del detalle acumulado
  const detailTotals = useMemo(() => {
    if (detailData.length === 0) return { value: null, meta: null, count: 0, months: 0 };
    
    // Contar meses únicos
    const uniqueMonths = new Set(detailData.map(d => d.mes));
    const monthsCount = uniqueMonths.size;
    
    let totalValue: number;
    let totalMeta: number;
    
    // Detectar si los valores de detalle están en escala decimal (0-1) vs porcentaje (0-100)
    // Usamos el promedio de valores no-cero para determinar la escala
    let scaleFactor = 1;
    if (isPercentage && detailData.length > 0) {
      const metricValues = detailData
        .map(d => Number(d[detailMetricKey]) || 0)
        .filter(v => v > 0);
      if (metricValues.length > 0) {
        const avgValue = metricValues.reduce((a, b) => a + b, 0) / metricValues.length;
        // Si el promedio es menor a 2, los valores están en escala decimal
        if (avgValue < 2) {
          scaleFactor = 100;
        }
      }
    }
    
    if (isPercentage) {
      // Para porcentajes: calcular promedio ponderado por mes
      // Primero agrupar por mes y calcular promedio ponderado de cada mes
      const monthlyAverages: Record<number, { weightedSum: number; totalWeight: number; metaSum: number; metaCount: number }> = {};
      
      detailData.forEach(d => {
        const mes = Number(d.mes);
        const value = (Number(d[detailMetricKey]) || 0) * scaleFactor;
        const weight = weightKey ? (Number(d[weightKey]) || 1) : 1;
        // La meta también puede estar en escala decimal
        const meta = (Number(d.meta) || 0) * scaleFactor;
        
        if (!monthlyAverages[mes]) {
          monthlyAverages[mes] = { weightedSum: 0, totalWeight: 0, metaSum: 0, metaCount: 0 };
        }
        
        monthlyAverages[mes].weightedSum += value * weight;
        monthlyAverages[mes].totalWeight += weight;
        if (meta > 0) {
          monthlyAverages[mes].metaSum += meta;
          monthlyAverages[mes].metaCount += 1;
        }
      });
      
      // Calcular el promedio de los promedios mensuales (promedio simple de cada mes)
      const monthlyValues = Object.values(monthlyAverages).map(m => 
        m.totalWeight > 0 ? m.weightedSum / m.totalWeight : 0
      );
      const monthlyMetas = Object.values(monthlyAverages)
        .filter(m => m.metaCount > 0)
        .map(m => m.metaSum / m.metaCount);
      
      totalValue = monthlyValues.length > 0 
        ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length 
        : 0;
      totalMeta = monthlyMetas.length > 0 
        ? monthlyMetas.reduce((a, b) => a + b, 0) / monthlyMetas.length 
        : 0;
    } else {
      // Para valores absolutos: sumar todo
      const values = detailData.map(d => Number(d[detailMetricKey]) || 0);
      const metas = detailData.map(d => Number(d.meta) || 0);
      
      totalValue = values.reduce((a, b) => a + b, 0);
      totalMeta = metas.reduce((a, b) => a + b, 0);
    }

    return {
      value: totalValue,
      meta: totalMeta > 0 ? totalMeta : null,
      count: detailData.length,
      months: monthsCount
    };
  }, [detailData, detailMetricKey, isPercentage, weightKey]);

  // Validación de consistencia del valor acumulado
  const valueValidation = useMemo(() => {
    if (summaryAccumulated === 0 && detailTotals.value === null) {
      return { status: 'no-data', message: 'Sin datos para comparar', difference: 0, percentDiff: 0 };
    }
    
    if (detailTotals.value === null) {
      return { status: 'no-detail', message: 'Sin detalle importado', difference: 0, percentDiff: 0 };
    }

    const difference = detailTotals.value - summaryAccumulated;
    const percentDiff = summaryAccumulated !== 0 ? Math.abs(difference / summaryAccumulated) : 0;

    if (percentDiff <= CONSISTENCY_THRESHOLDS.exact) {
      return { status: 'exact', message: 'Coincidencia exacta', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.rounding) {
      return { status: 'rounding', message: 'Diferencia por redondeo', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.minor) {
      return { status: 'minor', message: 'Diferencia menor aceptable', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.major) {
      return { status: 'warning', message: 'Diferencia significativa', difference, percentDiff };
    } else {
      return { status: 'error', message: 'Inconsistencia mayor - Revisar', difference, percentDiff };
    }
  }, [summaryAccumulated, detailTotals.value]);

  // Validación de meta
  const metaValidation = useMemo(() => {
    if (summaryMetaAnual === null && detailTotals.meta === null) {
      return { status: 'no-data', message: 'Sin meta para comparar', difference: 0, percentDiff: 0 };
    }
    
    if (summaryMetaAnual === null || detailTotals.meta === null) {
      return { status: 'partial', message: 'Meta parcial', difference: 0, percentDiff: 0 };
    }

    const difference = detailTotals.meta - summaryMetaAnual;
    const percentDiff = summaryMetaAnual !== 0 ? Math.abs(difference / summaryMetaAnual) : 0;

    if (percentDiff <= CONSISTENCY_THRESHOLDS.exact) {
      return { status: 'exact', message: 'Coincidencia exacta', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.rounding) {
      return { status: 'rounding', message: 'Diferencia por redondeo', difference, percentDiff };
    } else if (percentDiff <= CONSISTENCY_THRESHOLDS.minor) {
      return { status: 'minor', message: 'Diferencia menor', difference, percentDiff };
    } else {
      return { status: 'error', message: 'Inconsistencia en meta', difference, percentDiff };
    }
  }, [summaryMetaAnual, detailTotals.meta]);

  // Helpers de UI
  const getStatusIcon = (status: string, size = 16) => {
    const iconProps = { size, className: "flex-shrink-0" };
    switch (status) {
      case 'exact':
        return <CheckCircle2 {...iconProps} className={cn(iconProps.className, "text-emerald-500")} />;
      case 'rounding':
        return <CheckCircle2 {...iconProps} className={cn(iconProps.className, "text-emerald-400")} />;
      case 'minor':
        return <Info {...iconProps} className={cn(iconProps.className, "text-blue-500")} />;
      case 'warning':
        return <AlertTriangle {...iconProps} className={cn(iconProps.className, "text-amber-500")} />;
      case 'error':
        return <XCircle {...iconProps} className={cn(iconProps.className, "text-red-500")} />;
      case 'no-detail':
        return <Database {...iconProps} className={cn(iconProps.className, "text-slate-400")} />;
      default:
        return <AlertCircle {...iconProps} className={cn(iconProps.className, "text-slate-400")} />;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'exact':
      case 'rounding':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'minor':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getCardStyle = (status: string) => {
    switch (status) {
      case 'exact':
      case 'rounding':
        return 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60';
      case 'minor':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60';
      case 'warning':
        return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60';
      case 'error':
        return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60';
      default:
        return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200/60';
    }
  };

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // Si no hay detalle disponible
  if (!selectedDetail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-4 md:p-5"
      >
        <div className="flex items-center gap-3 text-soft-slate">
          <Database size={20} />
          <div>
            <p className="text-sm font-medium text-vision-ink">Sin tabla de detalle configurada</p>
            <p className="text-xs">Este indicador no tiene detalle para validar</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-gradient-to-br from-white/80 via-white/70 to-slate-50/60 backdrop-blur-sm 
                 rounded-2xl border border-white/80 shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <h3 className="text-vision-ink font-semibold text-sm md:text-base">
              Validación de Consistencia
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-soft-slate ml-7 sm:ml-0">
            <Calendar size={12} />
            <span>Acumulado {selectedYear} (Ene-{monthNames[Math.min(currentMonth, 12) - 1]})</span>
          </div>
        </div>
        <p className="text-xs text-soft-slate mt-1 ml-7">
          Comparando: Resumen acumulado vs Suma de detalle importado
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-plasma-blue mx-auto" />
          <p className="text-soft-slate text-sm mt-3">Validando consistencia...</p>
        </div>
      ) : (
        <div className="p-4 md:p-5 space-y-4">
          {/* Estadísticas de detalle */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/80 rounded-lg">
              <Database size={12} className="text-plasma-blue" />
              <span className="text-soft-slate">Registros:</span>
              <span className="font-medium text-vision-ink">{detailTotals.count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/80 rounded-lg">
              <Calendar size={12} className="text-plasma-blue" />
              <span className="text-soft-slate">Meses con datos:</span>
              <span className="font-medium text-vision-ink">{detailTotals.months}</span>
            </div>
          </div>

          {/* Comparativa principal */}
          <div className={cn(
            "rounded-xl p-4 border transition-all duration-300",
            getCardStyle(valueValidation.status)
          )}>
            <div className="flex items-start gap-3">
              {getStatusIcon(valueValidation.status, 20)}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3">
                  <span className="text-vision-ink font-medium text-sm">{metricLabel}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full border self-start",
                    getStatusBadgeStyle(valueValidation.status)
                  )}>
                    {valueValidation.message}
                  </span>
                </div>

                {/* Tabla comparativa */}
                <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
                  <div className="text-center p-2 bg-white/60 rounded-lg">
                    <p className="text-soft-slate text-[10px] md:text-xs mb-1">Resumen</p>
                    <p className="font-semibold text-vision-ink tabular-nums">
                      {formatValue(summaryAccumulated)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white/60 rounded-lg">
                    <p className="text-soft-slate text-[10px] md:text-xs mb-1">Detalle</p>
                    <p className="font-semibold text-vision-ink tabular-nums">
                      {formatValue(detailTotals.value)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white/60 rounded-lg">
                    <p className="text-soft-slate text-[10px] md:text-xs mb-1">Diferencia</p>
                    <p className={cn(
                      "font-semibold tabular-nums",
                      valueValidation.difference >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {valueValidation.difference >= 0 ? '+' : ''}{formatValue(valueValidation.difference)}
                    </p>
                    <p className="text-[10px] text-soft-slate">
                      ({(valueValidation.percentDiff * 100).toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validación de Meta (si aplica) */}
          {(summaryMetaAnual !== null || detailTotals.meta !== null) && (
            <div className={cn(
              "rounded-xl p-4 border transition-all duration-300",
              getCardStyle(metaValidation.status)
            )}>
              <div className="flex items-start gap-3">
                {getStatusIcon(metaValidation.status, 20)}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3">
                    <span className="text-vision-ink font-medium text-sm">Meta Anual</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full border self-start",
                      getStatusBadgeStyle(metaValidation.status)
                    )}>
                      {metaValidation.message}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-soft-slate text-[10px] md:text-xs mb-1">Resumen</p>
                      <p className="font-semibold text-vision-ink tabular-nums">
                        {formatValue(summaryMetaAnual)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-soft-slate text-[10px] md:text-xs mb-1">Detalle</p>
                      <p className="font-semibold text-vision-ink tabular-nums">
                        {formatValue(detailTotals.meta)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-soft-slate text-[10px] md:text-xs mb-1">Diferencia</p>
                      <p className={cn(
                        "font-semibold tabular-nums",
                        metaValidation.difference >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {metaValidation.difference >= 0 ? '+' : ''}{formatValue(metaValidation.difference)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-soft-slate flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;1% Redondeo
            </span>
            <span className="text-[10px] text-soft-slate flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> &lt;5% Menor
            </span>
            <span className="text-[10px] text-soft-slate flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> &lt;10% Revisar
            </span>
            <span className="text-[10px] text-soft-slate flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> &gt;10% Error
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default KpiValidationPanel;
