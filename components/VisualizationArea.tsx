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
  Brush 
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

export default function VisualizationArea({ activeFile, filterState }: VisualizationAreaProps) {
  const [showZoom, setShowZoom] = useState(false);
  
  const activeSheetData = activeFile.sheets[filterState.sheet] || activeFile.sheets[activeFile.activeSheetName];
  
  // Format and filter the data based on selected indicators, year, and month
  const filteredData = useMemo(() => {
    if (!activeSheetData) return [];
    
    const result: any[] = [];
    
    activeSheetData.periods.forEach((periodKey) => {
      const yr = periodKey.split('-')[0];
      const mo = periodKey.split('-')[1];
      
      // Filter by year if selected
      if (filterState.year !== 'All' && yr !== filterState.year) {
        return;
      }
      
      // Filter by month if selected (only if sheet contains months)
      const hasMonths = activeSheetData.months && activeSheetData.months.length > 0;
      if (hasMonths && filterState.month !== 'All' && mo !== filterState.month) {
        return;
      }
      
      const dataPoint: any = {
        period: periodKey,
        year: yr,
        month: mo
      };
      
      // Append values for selected indicators using safe alphanumeric keys
      filterState.yAxis.forEach((indicator) => {
        const indIdx = activeSheetData.indicators.indexOf(indicator);
        const safeKey = `ind_${indIdx}`;
        dataPoint[safeKey] = activeSheetData.indicatorsData[indicator]?.[periodKey] ?? 0;
      });
      
      result.push(dataPoint);
    });
    
    return result;
  }, [activeSheetData, filterState.year, filterState.month, filterState.yAxis]);

  // Determine if dual Y-axes are needed based on selected series scale differences
  const { useDualAxis, smallKeys } = useMemo(() => {
    if (!activeSheetData || filterState.yAxis.length === 0 || filteredData.length === 0) {
      return { useDualAxis: false, smallKeys: new Set<string>() };
    }

    const smallKeys = new Set<string>();
    const largeKeys = new Set<string>();

    filterState.yAxis.forEach((indicator) => {
      const indIdx = activeSheetData.indicators.indexOf(indicator);
      const safeKey = `ind_${indIdx}`;
      
      // Check maximum value in filtered data
      const vals = filteredData.map(d => Number(d[safeKey]) || 0);
      const maxVal = Math.max(...vals, 0);

      // If maxVal <= 200, it's considered small (like NPL % or LDR %)
      if (maxVal <= 200) {
        smallKeys.add(safeKey);
      } else {
        largeKeys.add(safeKey);
      }
    });

    const useDualAxis = smallKeys.size > 0 && largeKeys.size > 0;
    return { useDualAxis, smallKeys };
  }, [activeSheetData, filterState.yAxis, filteredData]);

  const chartId = 'dashboard-main-chart';

  // Export SVG file
  const handleExportSVG = () => {
    const chartContainer = document.getElementById(chartId);
    const svgEl = chartContainer?.querySelector('svg');
    if (!svgEl) {
      alert('Grafik tidak ditemukan');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
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
    if (!svgEl) {
      alert('Grafik tidak ditemukan');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const rect = svgEl.getBoundingClientRect();
    
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
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

  // Custom tooltips (styled minimal, Vercel/Linear look)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-slate-100 p-3 rounded-xl shadow-premium backdrop-blur-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((pld: any, index: number) => {
              const isPercentage = pld.name.toLowerCase().includes('npl') || pld.name.toLowerCase().includes('ldr') || pld.name.toLowerCase().includes('%') || pld.name.toLowerCase().includes('rasio') || pld.name.toLowerCase().includes('pertumbuhan');
              const formattedVal = typeof pld.value === 'number' 
                ? isPercentage 
                  ? `${pld.value.toLocaleString('id-ID')}%`
                  : pld.value.toLocaleString('id-ID')
                : pld.value;
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
  const renderChart = () => {
    if (filterState.yAxis.length === 0) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 py-16">
          <FileWarning size={32} className="text-[#C61E1E] opacity-40 mb-2 animate-bounce" />
          <p className="text-xs font-bold text-slate-700">Harap Pilih Indikator Keuangan</p>
          <p className="text-[10px] text-slate-400 mt-1">Centang setidaknya satu indikator keuangan pada menu filter untuk memicu grafik visualisasi.</p>
        </div>
      );
    }

    if (filteredData.length === 0) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 py-16">
          <p className="text-xs font-semibold">Tidak ada data untuk filter periode yang dipilih</p>
          <p className="text-[10px] text-slate-400">Silakan sesuaikan filter bulan, tahun, atau gunakan data sampel.</p>
        </div>
      );
    }

    const margin = { top: 20, right: 10, left: 10, bottom: 10 };

    switch (filterState.chartType) {
      case 'bar':
        return (
          <BarChart data={filteredData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            {useDualAxis && (
              <YAxis yAxisId="right" orientation="right" stroke="#C61E1E" tick={{ fontSize: 10, fill: '#C61E1E', fontWeight: 500 }} axisLine={false} tickLine={false} />
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {filterState.yAxis.map((indicator) => {
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
                />
              );
            })}
            {showZoom && <Brush dataKey="period" height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={filteredData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            {useDualAxis && (
              <YAxis yAxisId="right" orientation="right" stroke="#C61E1E" tick={{ fontSize: 10, fill: '#C61E1E', fontWeight: 500 }} axisLine={false} tickLine={false} />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {filterState.yAxis.map((indicator) => {
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
          <AreaChart data={filteredData} margin={margin}>
            <defs>
              {filterState.yAxis.map((indicator) => {
                const indIdx = activeSheetData.indicators.indexOf(indicator);
                return (
                  <linearGradient key={indicator} id={`grad-${indIdx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[indIdx % CHART_COLORS.length]} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={CHART_COLORS[indIdx % CHART_COLORS.length]} stopOpacity={0.01}/>
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            {useDualAxis && (
              <YAxis yAxisId="right" orientation="right" stroke="#C61E1E" tick={{ fontSize: 10, fill: '#C61E1E', fontWeight: 500 }} axisLine={false} tickLine={false} />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {filterState.yAxis.map((indicator) => {
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
        const pieData = filterState.yAxis.map((indicator) => {
          const indIdx = activeSheetData.indicators.indexOf(indicator);
          const safeKey = `ind_${indIdx}`;
          let sum = 0;
          filteredData.forEach(pt => {
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
          <BarChart data={filteredData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="period" type="category" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.01)' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {filterState.yAxis.map((indicator) => {
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
        <div className="flex items-center gap-2">
          {/* Zoom toggle brush slider */}
          {['bar', 'line', 'area'].includes(filterState.chartType) && filterState.yAxis.length > 0 && (
            <button
              onClick={() => setShowZoom(!showZoom)}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                showZoom 
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
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
