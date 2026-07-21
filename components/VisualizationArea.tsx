import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ComposedChart
} from 'recharts';
import { Download, ZoomIn, FileWarning } from 'lucide-react';
import { ActiveFile, FilterState } from '../types/dashboard';

interface VisualizationAreaProps {
  activeFile: ActiveFile;
  filterState: FilterState;
}

// Professional color palette using shades of Red OJK, slate, and charcoal
const CHART_COLORS = [
  '#C61E1E', // OJK Red
  '#1E293B', // Dark Slate
  '#0284C7', // Sky Blue
  '#0D9488', // Teal
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
];

const getLabelColors = (stroke: string) => {
  const mapping: { [key: string]: { bg: string; border: string; text: string } } = {
    '#C61E1E': { bg: '#FFF5F5', border: '#F3DADA', text: '#C61E1E' },
    '#1E293B': { bg: '#F1F5F9', border: '#CBD5E1', text: '#1E293B' },
    '#0284C7': { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1' },
    '#0D9488': { bg: '#F0FDFA', border: '#CCFBF1', text: '#0F766E' },
    '#8B5CF6': { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' },
    '#F59E0B': { bg: '#FFFBEB', border: '#FEF3C7', text: '#B45309' },
  };
  return mapping[stroke] || { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569' };
};

const CustomizedLineLabel = (props: any) => {
  const { x, y, value, stroke, payload, dataKey, chartData, index } = props;
  if (value === undefined || value === null) return null;

  // Resolve the original value
  let displayVal = value;
  
  // Try to lookup in chartData using index (foolproof)
  if (chartData && index !== undefined && chartData[index]) {
    const dataPoint = chartData[index];
    if (dataPoint[`${dataKey}_original`] !== undefined) {
      displayVal = dataPoint[`${dataKey}_original`];
    }
  } else if (payload) {
    // Fallback to payload checks
    if (payload[`${dataKey}_original`] !== undefined) {
      displayVal = payload[`${dataKey}_original`];
    } else if (payload.payload && payload.payload[`${dataKey}_original`] !== undefined) {
      displayVal = payload.payload[`${dataKey}_original`];
    }
  }

  const formattedVal = `${displayVal.toLocaleString('id-ID')}%`;
  const colors = getLabelColors(stroke);

  return (
    <g>
      {/* Background Pill badge */}
      <rect
        x={x - 22}
        y={y - 25} // positioned slightly above the dot
        width={44}
        height={16}
        rx={4}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={1}
      />
      <text
        x={x}
        y={y - 13} // centered inside the rect
        fill={colors.text}
        fontSize={9}
        fontWeight="bold"
        textAnchor="middle"
      >
        {formattedVal}
      </text>
    </g>
  );
};

export default function VisualizationArea({ activeFile, filterState }: VisualizationAreaProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [unitType, setUnitType] = useState<'raw' | 'thousand' | 'million' | 'billion' | 'trillion' | 'auto'>('auto');

  const activeSheetData = activeFile.sheets[filterState.sheet] || activeFile.sheets[activeFile.activeSheetName];

  // Filter yAxis to ONLY contain indicators that belong to activeSheetData AND have at least 1 non-zero value
  const activeYAxis = useMemo(() => {
    if (!activeSheetData) return [];
    return filterState.yAxis.filter((indicator) => {
      if (!activeSheetData.indicators.includes(indicator)) return false;
      const indData = activeSheetData.indicatorsData[indicator];
      if (!indData) return false;
      return Object.values(indData).some(val => val !== 0 && val !== null && val !== undefined);
    });
  }, [activeSheetData, filterState.yAxis]);

  // Format and filter the data based on selected indicators, year, and month
  const filteredData = useMemo(() => {
    if (!activeSheetData) return [];

    const result: any[] = [];
    const hasSelectedYears = filterState.selectedYears && filterState.selectedYears.length > 0;
    const hasSelectedMonths = filterState.selectedMonths && filterState.selectedMonths.length > 0;

    activeSheetData.periods.forEach((periodKey) => {
      const pUpper = String(periodKey).trim().toUpperCase();
      if (pUpper === 'YOY' || pUpper === 'SHARE') {
        return; // Exclude metric calculation columns from time-series trend charts
      }

      const yr = periodKey.split('-')[0];
      const mo = periodKey.split('-')[1];

      // Multi-select year filter takes priority, otherwise falls back to single-select year filter
      if (hasSelectedYears) {
        if (!filterState.selectedYears?.includes(yr)) {
          return;
        }
      } else if (filterState.year !== 'All' && yr !== filterState.year) {
        return;
      }

      // Multi-select month filter takes priority, otherwise falls back to single-select month filter
      const hasMonths = activeSheetData.months && activeSheetData.months.length > 0;
      if (hasMonths) {
        if (hasSelectedMonths) {
          if (!mo || !filterState.selectedMonths?.includes(mo)) {
            return;
          }
        } else if (filterState.month !== 'All' && mo !== filterState.month) {
          return;
        }
      }

      const dataPoint: any = {
        period: periodKey,
        year: yr,
        month: mo
      };

      // Append values for selected indicators using safe alphanumeric keys
      activeYAxis.forEach((indicator) => {
        const indIdx = activeSheetData.indicators.indexOf(indicator);
        const safeKey = `ind_${indIdx}`;
        dataPoint[safeKey] = activeSheetData.indicatorsData[indicator]?.[periodKey] ?? 0;
      });

      result.push(dataPoint);
    });

    return result;
  }, [
    activeSheetData, 
    filterState.year, 
    filterState.month, 
    activeYAxis, 
    filterState.selectedYears, 
    filterState.selectedMonths
  ]);

  // Unit specifications and active factor
  const unitSpec = useMemo(() => {
    const specs = {
      raw: { factor: 1, label: '', shortLabel: '' },
      thousand: { factor: 1e3, label: 'dalam Rp ribu', shortLabel: 'Ribu' },
      million: { factor: 1e6, label: 'dalam Rp juta', shortLabel: 'Juta' },
      billion: { factor: 1e9, label: 'dalam Rp miliar', shortLabel: 'Miliar' },
      trillion: { factor: 1e12, label: 'dalam Rp triliun', shortLabel: 'Triliun' },
    };

    if (unitType !== 'auto') {
      return specs[unitType];
    }

    let maxVal = 0;
    if (activeSheetData && filteredData.length > 0) {
      activeYAxis.forEach((indicator) => {
        const indicatorName = indicator.toLowerCase();
        const isPercent = 
          indicatorName.includes('npl') || 
          indicatorName.includes('ldr') || 
          indicatorName.includes('car') || 
          indicatorName.includes('roa') || 
          indicatorName.includes('roe') || 
          indicatorName.includes('nim') || 
          indicatorName.includes('bopo') || 
          indicatorName.includes('%') || 
          indicatorName.includes('rasio') || 
          indicatorName.includes('ratio') || 
          indicatorName.includes('pertumbuhan') || 
          indicatorName.includes('growth') || 
          indicatorName.includes('rate');
          
        if (!isPercent) {
          const indIdx = activeSheetData.indicators.indexOf(indicator);
          const safeKey = `ind_${indIdx}`;
          filteredData.forEach((d) => {
            const val = Math.abs(Number(d[safeKey]) || 0);
            if (val > maxVal) {
              maxVal = val;
            }
          });
        }
      });
    }

    if (maxVal >= 1e12) return specs.trillion;
    if (maxVal >= 1e9) return specs.billion;
    if (maxVal >= 1e6) return specs.million;
    if (maxVal >= 1e3) return specs.thousand;
    return specs.raw;
  }, [unitType, filteredData, activeYAxis, activeSheetData]);

  // Check which percentage indicators in the current sheet are decimal-scaled (i.e. values are <= 1.0)
  const isDecimalScaledMap = useMemo(() => {
    const map: { [indicator: string]: boolean } = {};
    if (!activeSheetData) return map;
    
    activeSheetData.indicators.forEach((indicator) => {
      const indicatorName = indicator.toLowerCase();
      const isPercent = 
        indicatorName.includes('npl') || 
        indicatorName.includes('ldr') || 
        indicatorName.includes('car') || 
        indicatorName.includes('roa') || 
        indicatorName.includes('roe') || 
        indicatorName.includes('nim') || 
        indicatorName.includes('bopo') || 
        indicatorName.includes('%') || 
        indicatorName.includes('rasio') || 
        indicatorName.includes('ratio') || 
        indicatorName.includes('pertumbuhan') || 
        indicatorName.includes('growth') || 
        indicatorName.includes('rate');
        
      if (isPercent) {
        let maxVal = 0;
        let hasVals = false;
        activeSheetData.periods.forEach((period) => {
          const val = activeSheetData.indicatorsData[indicator]?.[period];
          if (val !== undefined && val !== null) {
            hasVals = true;
            if (Math.abs(val) > maxVal) {
              maxVal = Math.abs(val);
            }
          }
        });
        // Determine decimal scaling based on typical indicator range
        const isLargeRatio = 
          indicatorName.includes('ldr') || 
          indicatorName.includes('bopo') || 
          indicatorName.includes('car') || 
          indicatorName.includes('roe') || 
          indicatorName.includes('nim') || 
          indicatorName.includes('capital');
          
        map[indicator] = hasVals && (isLargeRatio ? maxVal <= 2.0 : maxVal <= 0.15);
      }
    });
    return map;
  }, [activeSheetData]);

  // Find maximum value of nominal indicators to scale percentage lines
  const leftMax = useMemo(() => {
    if (!activeSheetData || filteredData.length === 0) return 100;
    
    let maxVal = 0;
    activeYAxis.forEach((indicator) => {
      const indicatorName = indicator.toLowerCase();
      const isPercent = 
        indicatorName.includes('npl') || 
        indicatorName.includes('ldr') || 
        indicatorName.includes('car') || 
        indicatorName.includes('roa') || 
        indicatorName.includes('roe') || 
        indicatorName.includes('nim') || 
        indicatorName.includes('bopo') || 
        indicatorName.includes('%') || 
        indicatorName.includes('rasio') || 
        indicatorName.includes('ratio') || 
        indicatorName.includes('pertumbuhan') || 
        indicatorName.includes('growth') || 
        indicatorName.includes('rate');
        
      if (!isPercent) {
        const indIdx = activeSheetData.indicators.indexOf(indicator);
        const safeKey = `ind_${indIdx}`;
        filteredData.forEach((d) => {
          const val = Math.abs(Number(d[safeKey]) || 0) / unitSpec.factor;
          if (val > maxVal) {
            maxVal = val;
          }
        });
      }
    });
    return maxVal || 100;
  }, [activeSheetData, filteredData, activeYAxis, unitSpec]);

  // Scaled and rounded chart data
  const chartData = useMemo(() => {
    if (!activeSheetData || filteredData.length === 0) return [];
    
    // First, calculate max value for each indicator across the active periods
    const indicatorMaxMap: { [safeKey: string]: number } = {};
    activeYAxis.forEach((indicator) => {
      const indIdx = activeSheetData.indicators.indexOf(indicator);
      const safeKey = `ind_${indIdx}`;
      let maxVal = 0;
      filteredData.forEach((d) => {
        const val = Math.abs(Number(d[safeKey]) || 0);
        if (val > maxVal) {
          maxVal = val;
        }
      });
      indicatorMaxMap[safeKey] = maxVal || 1;
    });

    return filteredData.map((d) => {
      const newD = { ...d };
      activeYAxis.forEach((indicator) => {
        const indIdx = activeSheetData.indicators.indexOf(indicator);
        const safeKey = `ind_${indIdx}`;
        
        const indicatorName = indicator.toLowerCase();
        const isPercent = 
          indicatorName.includes('npl') || 
          indicatorName.includes('ldr') || 
          indicatorName.includes('car') || 
          indicatorName.includes('roa') || 
          indicatorName.includes('roe') || 
          indicatorName.includes('nim') || 
          indicatorName.includes('bopo') || 
          indicatorName.includes('%') || 
          indicatorName.includes('rasio') || 
          indicatorName.includes('ratio') || 
          indicatorName.includes('pertumbuhan') || 
          indicatorName.includes('growth') || 
          indicatorName.includes('rate');
          
        if (typeof d[safeKey] === 'number') {
          if (isPercent) {
            // Convert to percentage scale if decimal-scaled
            const isDec = isDecimalScaledMap[indicator];
            const origVal = isDec ? parseFloat((d[safeKey] * 100).toFixed(2)) : d[safeKey];
            
            // Store original percentage value
            newD[`${safeKey}_original`] = origVal;
            
            if (filterState.overlayRatio) {
              // Find index of this percentage indicator among all selected percentage indicators
              const pctIndicators = activeYAxis.filter((ind) => {
                const name = ind.toLowerCase();
                return (
                  name.includes('npl') || 
                  name.includes('ldr') || 
                  name.includes('car') || 
                  name.includes('roa') || 
                  name.includes('roe') || 
                  name.includes('nim') || 
                  name.includes('bopo') || 
                  name.includes('%') || 
                  name.includes('rasio') || 
                  name.includes('ratio') || 
                  name.includes('pertumbuhan') || 
                  name.includes('growth') || 
                  name.includes('rate')
                );
              });
              const pctIdx = pctIndicators.indexOf(indicator);
              
              // Shift the target peak height slightly depending on its index to avoid overlap
              // Index 0 peaks at leftMax * 0.50, Index 1 at leftMax * 0.35, etc.
              const targetRatio = Math.max(0.15, 0.50 - pctIdx * 0.15);

              const indMax = indicatorMaxMap[safeKey];
              const scaledMax = isDec ? indMax * 100 : indMax;
              newD[safeKey] = parseFloat(((origVal / (scaledMax || 1)) * (leftMax * targetRatio)).toFixed(2));
            } else {
              newD[safeKey] = origVal;
            }
          } else {
            const scaled = d[safeKey] / unitSpec.factor;
            newD[safeKey] = parseFloat(scaled.toFixed(2));
          }
        }
      });
      return newD;
    });
  }, [filteredData, unitSpec, activeYAxis, activeSheetData, isDecimalScaledMap, filterState.overlayRatio, leftMax]);

  // Calculate dynamic domain for the right Y Axis (percentage values)
  const rightAxisDomain = useMemo(() => {
    if (!activeSheetData || chartData.length === 0) return [0, 10];
    
    let maxPct = 0;
    activeYAxis.forEach((indicator) => {
      const indicatorName = indicator.toLowerCase();
      const isPercent = 
        indicatorName.includes('npl') || 
        indicatorName.includes('ldr') || 
        indicatorName.includes('car') || 
        indicatorName.includes('roa') || 
        indicatorName.includes('roe') || 
        indicatorName.includes('nim') || 
        indicatorName.includes('bopo') || 
        indicatorName.includes('%') || 
        indicatorName.includes('rasio') || 
        indicatorName.includes('ratio') || 
        indicatorName.includes('pertumbuhan') || 
        indicatorName.includes('growth') || 
        indicatorName.includes('rate');
         
      if (isPercent) {
        const indIdx = activeSheetData.indicators.indexOf(indicator);
        const safeKey = `ind_${indIdx}`;
        chartData.forEach((d) => {
          const val = Math.abs(Number(d[safeKey]) || 0);
          if (val > maxPct) {
            maxPct = val;
          }
        });
      }
    });
    
    if (maxPct === 0) return [0, 10];
    
    // Position the line in the middle height of the graph (around 45% - 50% height) by multiplying maxPct by 2.2
    const maxDomain = Math.max(10, Math.ceil(maxPct * 2.2));
    return [0, maxDomain];
  }, [activeSheetData, chartData, activeYAxis]);

  // Determine if dual Y-axes are needed based on selected series scale differences
  const { useDualAxis, smallKeys } = useMemo(() => {
    if (!activeSheetData || filterState.yAxis.length === 0 || chartData.length === 0) {
      return { useDualAxis: false, smallKeys: new Set<string>() };
    }

    const smallKeys = new Set<string>();
    const largeKeys = new Set<string>();

    filterState.yAxis.forEach((indicator) => {
      const indIdx = activeSheetData.indicators.indexOf(indicator);
      const safeKey = `ind_${indIdx}`;
      
      const indicatorName = indicator.toLowerCase();
      const isPercent = 
        indicatorName.includes('npl') || 
        indicatorName.includes('ldr') || 
        indicatorName.includes('car') || 
        indicatorName.includes('roa') || 
        indicatorName.includes('roe') || 
        indicatorName.includes('nim') || 
        indicatorName.includes('bopo') || 
        indicatorName.includes('%') || 
        indicatorName.includes('rasio') || 
        indicatorName.includes('ratio') || 
        indicatorName.includes('pertumbuhan') || 
        indicatorName.includes('growth') || 
        indicatorName.includes('rate');

      if (isPercent) {
        smallKeys.add(safeKey);
      } else {
        largeKeys.add(safeKey);
      }
    });

    const useDualAxis = smallKeys.size > 0 && largeKeys.size > 0;
    return { useDualAxis, smallKeys };
  }, [activeSheetData, filterState.yAxis, chartData]);

  const chartId = 'dashboard-main-chart';

  // Helper to clone SVG and inject Legend items into the SVG node for file exports
  const getClonedSvgWithLegend = (chartContainer: HTMLElement, svgEl: SVGSVGElement): SVGSVGElement => {
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
    
    // Find all active legend items from the DOM
    const legendItems = chartContainer.querySelectorAll('.recharts-legend-item');
    if (!legendItems || legendItems.length === 0) return clonedSvg;
    
    const items: { text: string; color: string }[] = [];
    legendItems.forEach((item) => {
      const text = item.querySelector('.recharts-legend-item-text')?.textContent || '';
      const icon = item.querySelector('.recharts-legend-icon') || item.querySelector('path') || item.querySelector('circle');
      const color = icon?.getAttribute('fill') || icon?.getAttribute('stroke') || '#64748B';
      items.push({ text, color });
    });
    
    // Add extra height spacing at the bottom of the SVG to fit the legend
    const originalHeight = parseFloat(svgEl.getAttribute('height') || '400');
    const originalWidth = parseFloat(svgEl.getAttribute('width') || '800');
    
    const legendSpacing = 35; 
    const newHeight = originalHeight + legendSpacing;
    clonedSvg.setAttribute('height', String(newHeight));
    
    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        parts[3] = String(parseFloat(parts[3]) + legendSpacing);
        clonedSvg.setAttribute('viewBox', parts.join(' '));
      }
    }
    
    // Create an SVG group for legend elements
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendGroup.setAttribute('transform', `translate(0, ${originalHeight + 15})`);
    
    // Calculate total width of all legend items for center alignment
    const itemGap = 20;
    let totalWidth = 0;
    items.forEach((item, i) => {
      // 8px radius + spacing + estimated text width + gap
      totalWidth += 16 + (item.text.length * 6) + (i < items.length - 1 ? itemGap : 0);
    });
    
    let startX = Math.max(10, (originalWidth - totalWidth) / 2);
    
    items.forEach((item) => {
      // Draw color indicator circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(startX));
      circle.setAttribute('cy', '-3');
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', item.color);
      legendGroup.appendChild(circle);
      
      // Draw text label
      const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textNode.setAttribute('x', String(startX + 10));
      textNode.setAttribute('y', '1');
      textNode.setAttribute('fill', '#64748B');
      textNode.setAttribute('font-size', '10px');
      textNode.setAttribute('font-weight', '700');
      textNode.setAttribute('font-family', 'Inter, system-ui, -apple-system, sans-serif');
      textNode.textContent = item.text;
      legendGroup.appendChild(textNode);
      
      startX += 16 + (item.text.length * 6) + itemGap;
    });
    
    clonedSvg.appendChild(legendGroup);
    return clonedSvg;
  };

  // Export SVG file
  const handleExportSVG = () => {
    const chartContainer = document.getElementById(chartId);
    const svgEl = chartContainer?.querySelector('svg');
    if (!chartContainer || !svgEl) {
      alert('Grafik tidak ditemukan');
      return;
    }

    const clonedSvg = getClonedSvgWithLegend(chartContainer, svgEl);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `FINSIGHT_${filterState.sheet}_${filterState.chartType}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  // Export PNG file
  const handleExportPNG = () => {
    const chartContainer = document.getElementById(chartId);
    const svgEl = chartContainer?.querySelector('svg');
    if (!chartContainer || !svgEl) {
      alert('Grafik tidak ditemukan');
      return;
    }

    const clonedSvg = getClonedSvgWithLegend(chartContainer, svgEl);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const rect = svgEl.getBoundingClientRect();

    const legendSpacing = 35;
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * 2;
    canvas.height = (rect.height + legendSpacing) * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `FINSIGHT_${filterState.sheet}_${filterState.chartType}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getUnitAbbreviation = (shortLabel: string) => {
    if (!shortLabel) return '';
    const l = shortLabel.toLowerCase();
    if (l.includes('triliun')) return ' T';
    if (l.includes('miliar')) return ' M';
    if (l.includes('juta')) return ' Jt';
    if (l.includes('ribu')) return ' Rb';
    return ` ${shortLabel}`;
  };

  const formatCurrencyLabel = (val: any) => {
    if (typeof val !== 'number') return val;
    const abbr = getUnitAbbreviation(unitSpec.shortLabel);
    const numStr = val.toLocaleString('id-ID');
    return `${numStr}${abbr}`;
  };

  // Custom tooltips (styled minimal, Vercel/Linear look)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-slate-100 p-3 rounded-xl shadow-premium backdrop-blur-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((pld: any, index: number) => {
              const isPercentage = pld.name.toLowerCase().includes('npl') || pld.name.toLowerCase().includes('ldr') || pld.name.toLowerCase().includes('%') || pld.name.toLowerCase().includes('rasio') || pld.name.toLowerCase().includes('pertumbuhan');
              
              // Read original value if it exists in the payload (because of overlay normalization)
              const displayVal = isPercentage && pld.payload && pld.payload[`${pld.dataKey}_original`] !== undefined
                ? pld.payload[`${pld.dataKey}_original`]
                : pld.value;

              const formattedVal = typeof displayVal === 'number'
                ? isPercentage
                  ? `${displayVal.toLocaleString('id-ID')}%`
                  : formatCurrencyLabel(displayVal)
                : displayVal;
              return (
                <div key={index} className="flex items-center gap-4 justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pld.color || pld.fill }} />
                    <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[150px]">{pld.name}</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-900 shrink-0 ml-2">
                    {formattedVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render Chart based on Selected Chart Type
  const renderChart = (): React.ReactElement | null => {
    const margin = { top: 20, right: 10, left: 10, bottom: 10 };

    if (filterState.overlayRatio) {
      const hasPercentIndicator = filterState.yAxis.some((indicator) => {
        const indicatorName = indicator.toLowerCase();
        return (
          indicatorName.includes('npl') || 
          indicatorName.includes('ldr') || 
          indicatorName.includes('car') || 
          indicatorName.includes('roa') || 
          indicatorName.includes('roe') || 
          indicatorName.includes('nim') || 
          indicatorName.includes('bopo') || 
          indicatorName.includes('%') || 
          indicatorName.includes('rasio') || 
          indicatorName.includes('ratio') || 
          indicatorName.includes('pertumbuhan') || 
          indicatorName.includes('growth') || 
          indicatorName.includes('rate')
        );
      });

      return (
        <ComposedChart data={chartData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
          
          {/* Left Y Axis for all elements (nominal bars and normalized percentage lines) */}
          <YAxis 
            yAxisId="left" 
            stroke="#64748B" 
            tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
          
          {/* First, render all Bar components (nominal indicators) */}
          {activeYAxis.map((indicator) => {
            const indIdx = activeSheetData.indicators.indexOf(indicator);
            const safeKey = `ind_${indIdx}`;
            
            const indicatorName = indicator.toLowerCase();
            const isPercent = 
              indicatorName.includes('npl') || 
              indicatorName.includes('ldr') || 
              indicatorName.includes('car') || 
              indicatorName.includes('roa') || 
              indicatorName.includes('roe') || 
              indicatorName.includes('nim') || 
              indicatorName.includes('bopo') || 
              indicatorName.includes('%') || 
              indicatorName.includes('rasio') || 
              indicatorName.includes('ratio') || 
              indicatorName.includes('pertumbuhan') || 
              indicatorName.includes('growth') || 
              indicatorName.includes('rate');

            if (!isPercent) {
              return (
                <Bar 
                  key={indicator} 
                  name={indicator}
                  dataKey={safeKey} 
                  yAxisId="left"
                  fill={CHART_COLORS[indIdx % CHART_COLORS.length]} 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                  label={{
                    position: 'top',
                    fill: '#475569',
                    fontSize: 9,
                    fontWeight: 'bold',
                    formatter: (val: any) => formatCurrencyLabel(val)
                  }}
                />
              );
            }
            return null;
          })}

          {/* Second, render all Line components (percentage indicators) so they are drawn ON TOP of the bars */}
          {activeYAxis.map((indicator) => {
            const indIdx = activeSheetData.indicators.indexOf(indicator);
            const safeKey = `ind_${indIdx}`;
            
            const indicatorName = indicator.toLowerCase();
            const isPercent = 
              indicatorName.includes('npl') || 
              indicatorName.includes('ldr') || 
              indicatorName.includes('car') || 
              indicatorName.includes('roa') || 
              indicatorName.includes('roe') || 
              indicatorName.includes('nim') || 
              indicatorName.includes('bopo') || 
              indicatorName.includes('%') || 
              indicatorName.includes('rasio') || 
              indicatorName.includes('ratio') || 
              indicatorName.includes('pertumbuhan') || 
              indicatorName.includes('growth') || 
              indicatorName.includes('rate');

            if (isPercent) {
              return (
                <Line
                  key={indicator}
                  name={indicator}
                  type="monotone"
                  dataKey={safeKey}
                  yAxisId="left"
                  stroke={CHART_COLORS[indIdx % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={{ r: 4, strokeWidth: 1 }}
                  connectNulls={true}
                  label={(labelProps: any) => (
                    <CustomizedLineLabel 
                      {...labelProps} 
                      dataKey={safeKey} 
                      chartData={chartData} 
                    />
                  )}
                />
              );
            }
            return null;
          })}
          {showZoom && <Brush dataKey="period" height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
        </ComposedChart>
      );
    }

    switch (filterState.chartType) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            {useDualAxis && (
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#C61E1E" 
                tick={{ fontSize: 10, fill: '#C61E1E', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                domain={rightAxisDomain}
                tickFormatter={(tick) => `${tick}%`}
              />
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {activeYAxis
              .filter((indicator) => {
                const indicatorName = indicator.toLowerCase();
                const isPercent = 
                  indicatorName.includes('npl') || 
                  indicatorName.includes('ldr') || 
                  indicatorName.includes('car') || 
                  indicatorName.includes('roa') || 
                  indicatorName.includes('roe') || 
                  indicatorName.includes('nim') || 
                  indicatorName.includes('bopo') || 
                  indicatorName.includes('%') || 
                  indicatorName.includes('rasio') || 
                  indicatorName.includes('ratio') || 
                  indicatorName.includes('pertumbuhan') || 
                  indicatorName.includes('growth') || 
                  indicatorName.includes('rate');
                return !isPercent;
              })
              .map((indicator) => {
                const indIdx = activeSheetData.indicators.indexOf(indicator);
                const safeKey = `ind_${indIdx}`;
                const axisId = useDualAxis && smallKeys.has(safeKey) ? 'right' : 'left';
                return (
                  <Bar
                    key={indicator}
                    name={indicator}
                    dataKey={safeKey}
                    yAxisId={axisId}
                    fill={CHART_COLORS[indIdx % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                    label={{
                      position: 'top',
                      fill: '#475569',
                      fontSize: 9,
                      fontWeight: 'bold',
                      formatter: (val: any) => formatCurrencyLabel(val)
                    }}
                  />
                );
              })}
            {showZoom && <Brush dataKey="period" height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={chartData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            {useDualAxis && (
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#C61E1E" 
                tick={{ fontSize: 10, fill: '#C61E1E', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                domain={rightAxisDomain}
                tickFormatter={(tick) => `${tick}%`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {activeYAxis.map((indicator) => {
              const indIdx = activeSheetData.indicators.indexOf(indicator);
              const safeKey = `ind_${indIdx}`;
              const axisId = useDualAxis && smallKeys.has(safeKey) ? 'right' : 'left';
              return (
                <Line
                  key={indicator}
                  name={indicator}
                  type="monotone"
                  dataKey={safeKey}
                  yAxisId={axisId}
                  stroke={CHART_COLORS[indIdx % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={{ r: 3, strokeWidth: 1 }}
                  connectNulls={true}
                />
              );
            })}
            {showZoom && <Brush dataKey="period" height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData} margin={margin}>
            <defs>
              {activeYAxis.map((indicator) => {
                const indIdx = activeSheetData.indicators.indexOf(indicator);
                return (
                  <linearGradient key={indicator} id={`grad-${indIdx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[indIdx % CHART_COLORS.length]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS[indIdx % CHART_COLORS.length]} stopOpacity={0.01} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            {useDualAxis && (
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#C61E1E" 
                tick={{ fontSize: 10, fill: '#C61E1E', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                domain={rightAxisDomain}
                tickFormatter={(tick) => `${tick}%`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {activeYAxis.map((indicator) => {
              const indIdx = activeSheetData.indicators.indexOf(indicator);
              const safeKey = `ind_${indIdx}`;
              const axisId = useDualAxis && smallKeys.has(safeKey) ? 'right' : 'left';
              return (
                <Area
                  key={indicator}
                  name={indicator}
                  type="monotone"
                  dataKey={safeKey}
                  yAxisId={axisId}
                  stroke={CHART_COLORS[indIdx % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#grad-${indIdx})`}
                  connectNulls={true}
                />
              );
            })}
            {showZoom && <Brush dataKey="period" height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
          </AreaChart>
        );

      case 'pie':
        // Sum values across filtered periods for each indicator
        const pieData = activeYAxis.map((indicator) => {
          const indIdx = activeSheetData.indicators.indexOf(indicator);
          const safeKey = `ind_${indIdx}`;
          let sum = 0;
          chartData.forEach(pt => {
            sum += pt[safeKey] || 0;
          });
          return {
            name: indicator,
            value: parseFloat(sum.toFixed(2)),
            colorIndex: indIdx
          };
        }).filter(item => item.value > 0);

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.colorIndex % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B' }} iconType="circle" />
          </PieChart>
        );

      case 'horizontal_bar':
        return (
          <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="period" type="category" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.01)' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {activeYAxis
              .filter((indicator) => {
                const indicatorName = indicator.toLowerCase();
                const isPercent = 
                  indicatorName.includes('npl') || 
                  indicatorName.includes('ldr') || 
                  indicatorName.includes('car') || 
                  indicatorName.includes('roa') || 
                  indicatorName.includes('roe') || 
                  indicatorName.includes('nim') || 
                  indicatorName.includes('bopo') || 
                  indicatorName.includes('%') || 
                  indicatorName.includes('rasio') || 
                  indicatorName.includes('ratio') || 
                  indicatorName.includes('pertumbuhan') || 
                  indicatorName.includes('growth') || 
                  indicatorName.includes('rate');
                return !isPercent;
              })
              .map((indicator) => {
                const indIdx = activeSheetData.indicators.indexOf(indicator);
                const safeKey = `ind_${indIdx}`;
                return (
                  <Bar
                    key={indicator}
                    name={indicator}
                    dataKey={safeKey}
                    fill={CHART_COLORS[indIdx % CHART_COLORS.length]}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                    label={{
                      position: 'right',
                      fill: '#475569',
                      fontSize: 9,
                      fontWeight: 'bold',
                      formatter: (val: any) => formatCurrencyLabel(val)
                    }}
                  />
                );
              })}
          </BarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 w-full flex flex-col space-y-4">
      {/* Chart Card Header Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Visualisasi Tren ({filterState.chartType.replace('_', ' ')})
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Menampilkan data sheet '{filterState.sheet}'
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Selector */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[9px] font-black text-slate-400 uppercase hidden sm:inline">Satuan:</span>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 text-[10px] font-extrabold text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
            >
              <option value="auto">Otomatis</option>
              <option value="raw">Nilai Asli</option>
              <option value="thousand">Ribuan (Rp)</option>
              <option value="million">Jutaan (Rp)</option>
              <option value="billion">Miliaran (Rp)</option>
              <option value="trillion">Triliunan (Rp)</option>
            </select>
          </div>
          {/* Zoom toggle brush slider */}
          {['bar', 'line', 'area'].includes(filterState.chartType) && filterState.yAxis.length > 0 && (
            <button
              onClick={() => setShowZoom(!showZoom)}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold ${showZoom
                  ? 'bg-red-50 text-[#C61E1E] border-red-100'
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                }`}
              title="Aktifkan Slider Zoom Data"
            >
              <ZoomIn size={14} />
              <span className="hidden sm:inline">Zoom</span>
            </button>
          )}

          {/* SVG Downloader */}
          <button
            onClick={handleExportSVG}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Download Vector format SVG"
          >
            <Download size={14} />
            <span className="hidden sm:inline">SVG</span>
          </button>

          {/* PNG Downloader */}
          <button
            onClick={handleExportPNG}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Download Image format PNG"
          >
            <Download size={14} />
            <span className="hidden sm:inline">PNG</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div id={chartId} className="w-full h-[400px] flex items-center justify-center relative">
        {unitSpec.label && (
          <div className="absolute -top-6 left-2 text-[10px] font-black text-slate-400 select-none pointer-events-none z-10">
            *{unitSpec.label}
          </div>
        )}
        {filterState.yAxis.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 py-16">
            <FileWarning size={32} className="text-[#C61E1E] opacity-40 mb-2 animate-bounce" />
            <p className="text-xs font-bold text-slate-700">Harap Pilih Indikator Keuangan</p>
            <p className="text-[10px] text-slate-400 mt-1">Centang setidaknya satu indikator keuangan pada menu filter untuk memicu grafik visualisasi.</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 py-16">
            <p className="text-xs font-semibold">Tidak ada data untuk filter periode yang dipilih</p>
            <p className="text-[10px] text-slate-400">Silakan sesuaikan filter bulan, tahun, atau gunakan data sampel.</p>
          </div>
        ) : (
          (() => {
            const chart = renderChart();
            return chart ? (
              <ResponsiveContainer width="100%" height="100%">
                {chart}
              </ResponsiveContainer>
            ) : null;
          })()
        )}
      </div>
    </div>
  );
}
