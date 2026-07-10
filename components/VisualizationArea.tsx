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
import { Download, SlidersHorizontal, ZoomIn } from 'lucide-react';
import { ActiveFile, FilterState } from '../types/dashboard';

interface VisualizationAreaProps {
  activeFile: ActiveFile;
  filterState: FilterState;
}

// Professional color palette using shades of Red OJK, slate, and charcoal
const CHART_COLORS = [
  '#C61E1E', // OJK Red
  '#1E293B', // Dark Slate
  '#64748B', // Medium Slate
  '#A31818', // Crimson Dark
  '#E2E8F0', // Soft Gray
];

export default function VisualizationArea({ activeFile, filterState }: VisualizationAreaProps) {
  const [showZoom, setShowZoom] = useState(false);
  
  const activeSheetData = activeFile.sheets[filterState.sheet];
  
  // Filter the data based on selected Year and Month
  const filteredData = useMemo(() => {
    if (!activeSheetData) return [];
    
    let result = [...activeSheetData.data];
    
    // Filter by year if selected and exists
    if (filterState.year !== 'All') {
      // Look for year columns: "Tahun", "Year", or within Date/Periode
      const yearCol = activeSheetData.columns.find(c => /tahun|year/i.test(c));
      if (yearCol) {
        result = result.filter(row => String(row[yearCol]) === filterState.year);
      } else {
        // Fallback search in all categorical keys
        result = result.filter(row => {
          return Object.values(row).some(val => String(val).includes(filterState.year));
        });
      }
    }

    // Filter by month if selected and exists
    if (filterState.month !== 'All') {
      const monthCol = activeSheetData.columns.find(c => /bulan|month/i.test(c));
      if (monthCol) {
        result = result.filter(row => String(row[monthCol]).toLowerCase().includes(filterState.month.toLowerCase()));
      } else {
        result = result.filter(row => {
          return Object.values(row).some(val => String(val).toLowerCase().includes(filterState.month.toLowerCase()));
        });
      }
    }

    return result;
  }, [activeSheetData, filterState.year, filterState.month]);

  // Unique ID for SVG extraction
  const chartId = 'finsight-recharts-canvas';

  // Export SVG file
  const handleExportSVG = () => {
    const chartContainer = document.getElementById(chartId);
    const svgEl = chartContainer?.querySelector('svg');
    if (!svgEl) {
      alert('Grafik tidak ditemukan');
      return;
    }

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgEl);
    
    // Add namespace if missing
    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

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
    // Save with 2x scale for high crispness
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Draw white background
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
              const cellCoord = pld.payload?._cellCoordinates?.[pld.name] || '';

              return (
                <div key={index} className="flex items-center gap-4 justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pld.color || pld.fill }} />
                    <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[120px]">{pld.name}</span>
                    {cellCoord && (
                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100/80 px-1 py-0.5 rounded font-mono select-none" title={`Sel Excel: ${cellCoord}`}>
                        {cellCoord}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-900 shrink-0 ml-2">
                    {typeof pld.value === 'number' ? pld.value.toLocaleString('id-ID') : pld.value}
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
    if (filteredData.length === 0) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 py-16">
          <p className="text-xs font-semibold">Tidak ada data untuk filter yang dipilih</p>
          <p className="text-[10px] text-slate-400">Silakan sesuaikan filter bulan, tahun, atau rentang data Anda.</p>
        </div>
      );
    }

    const { xAxis, yAxis, chartType } = filterState;

    if (!xAxis || yAxis.length === 0) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 py-16">
          <p className="text-xs font-semibold">Harap tentukan sumbu X dan sumbu Y</p>
          <p className="text-[10px] text-slate-400">Pilih kolom X (misal: Periode) dan setidaknya satu kolom Y (nilai numerik) pada area filter.</p>
        </div>
      );
    }

    // Standard Recharts layout variables
    const margin = { top: 20, right: 10, left: 10, bottom: 10 };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={filteredData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey={xAxis} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {yAxis.map((col, idx) => (
              <Bar 
                key={col} 
                dataKey={col} 
                fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            ))}
            {showZoom && <Brush dataKey={xAxis} height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={filteredData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey={xAxis} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {yAxis.map((col, idx) => (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2.5}
                activeDot={{ r: 6, strokeWidth: 0 }}
                dot={{ r: 3, strokeWidth: 1 }}
              />
            ))}
            {showZoom && <Brush dataKey={xAxis} height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={filteredData} margin={margin}>
            <defs>
              {yAxis.map((col, idx) => (
                <linearGradient key={col} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.01}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey={xAxis} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {yAxis.map((col, idx) => (
              <Area
                key={col}
                type="monotone"
                dataKey={col}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#grad-${idx})`}
              />
            ))}
            {showZoom && <Brush dataKey={xAxis} height={20} stroke="#E2E8F0" tickFormatter={() => ''} />}
          </AreaChart>
        );

      case 'pie':
        // For Pie chart, we aggregate the first Y-Axis column values per X-Axis category
        const pieData = (() => {
          const firstY = yAxis[0];
          const grouped: { [key: string]: number } = {};
          
          filteredData.forEach(row => {
            const key = String(row[xAxis] || 'Lainnya');
            const val = Number(row[firstY] || 0);
            grouped[key] = (grouped[key] || 0) + val;
          });

          return Object.keys(grouped).map(key => ({
            name: key,
            value: parseFloat(grouped[key].toFixed(2))
          })).slice(0, 10); // Limit to top 10 slices for clean formatting
        })();

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
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B' }} iconType="circle" />
          </PieChart>
        );

      case 'horizontal_bar':
        // Display ranked largest values first
        const firstY = yAxis[0];
        const sortedData = [...filteredData]
          .sort((a, b) => Number(b[firstY] || 0) - Number(a[firstY] || 0))
          .slice(0, 12); // top 12 items

        return (
          <BarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis dataKey={xAxis} type="category" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.01)' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconType="circle" />
            {yAxis.map((col, idx) => (
              <Bar 
                key={col} 
                dataKey={col} 
                fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              />
            ))}
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
            Visualisasi Data ({filterState.chartType.replace('_', ' ')})
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Menampilkan {filteredData.length} entri sheet '{filterState.sheet}'
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom toggle brush slider */}
          {['bar', 'line', 'area'].includes(filterState.chartType) && (
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
