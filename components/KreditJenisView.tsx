import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  BarChart3, 
  LineChart as LineIcon,
  Wallet, 
  Building2, 
  ShoppingBag, 
  Layers,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Hash,
  ArrowRightLeft,
  Percent,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LabelList,
  ReferenceLine
} from 'recharts';
import { ActiveFile } from '../types/dashboard';
import { downloadKreditJenisTemplate } from '../services/excelService';

interface KreditJenisViewProps {
  activeFile?: ActiveFile | null;
}

const COLORS: { [key: string]: string } = {
  'Modal Kerja': '#3B82F6', // Blue
  'Investasi': '#8B5CF6',   // Purple
  'Konsumsi': '#EC4899',    // Pink
  'Total': '#C61E1E'        // Red OJK
};

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899'];

export default function KreditJenisView({ activeFile }: KreditJenisViewProps) {
  // Global Dashboard Filter States
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Modal Kerja', 'Investasi', 'Konsumsi']);
  const [showYoy, setShowYoy] = useState<boolean>(true);
  const [showShare, setShowShare] = useState<boolean>(true);
  const [showChartLabels, setShowChartLabels] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'bar' | 'stacked' | 'line' | 'pie'>('bar');

  // Independent YoY & Share Year Selection Filter States
  const [yoyTargetYear, setYoyTargetYear] = useState<string>('');
  const [yoyBaseYear, setYoyBaseYear] = useState<string>('');
  const [shareTargetYear, setShareTargetYear] = useState<string>('');

  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  // Raw sheet data extraction
  const rawSheet = useMemo(() => {
    let sheet = activeFile?.sheets['Kredit per Jenis Penggunaan'];
    if (!sheet) {
      const key = Object.keys(activeFile?.sheets || {}).find(
        s => s.toLowerCase().includes('kredit') || s.toLowerCase().includes('jenis')
      );
      if (key) sheet = activeFile?.sheets[key];
    }

    if (sheet) {
      return {
        years: sheet.years.length > 0 ? sheet.years : ['2024', '2025', '2026'],
        months: sheet.months.length > 0 ? sheet.months : ['Mei'],
        data: sheet.data
      };
    }

    // Default template data as shown in user's screenshot
    return {
      years: ['2024', '2025', '2026'],
      months: ['Mei'],
      data: [
        {
          indicator: 'Modal Kerja',
          '2024-Mei': 351393161049054,
          '2025-Mei': 338810328055006,
          '2026-Mei': 329740604279539,
          'YOY': -0.0268,
          'SHARE': 0.3052
        },
        {
          indicator: 'Investasi',
          '2024-Mei': 190762844685500,
          '2025-Mei': 216723091364230,
          '2026-Mei': 251790742742739,
          'YOY': 0.1618,
          'SHARE': 0.2330
        },
        {
          indicator: 'Konsumsi',
          '2024-Mei': 442899398544257,
          '2025-Mei': 474957031024500,
          '2026-Mei': 499029032369175,
          'YOY': 0.0507,
          'SHARE': 0.4618
        },
        {
          indicator: 'Total',
          '2024-Mei': 985055404278811,
          '2025-Mei': 1030490450443740,
          '2026-Mei': 1080560379391450,
          'YOY': 0.0486,
          'SHARE': 1.0000
        }
      ]
    };
  }, [activeFile]);

  const allYears = rawSheet.years;
  const allMonths = rawSheet.months;
  const availableCategories = ['Modal Kerja', 'Investasi', 'Konsumsi'];

  // Active years & months after applying global filter
  const activeYears = useMemo(() => {
    if (selectedYears.length === 0) return allYears;
    return allYears.filter(y => selectedYears.includes(y));
  }, [allYears, selectedYears]);

  const activeMonths = useMemo(() => {
    if (selectedMonths.length === 0) return allMonths;
    return allMonths.filter(m => selectedMonths.includes(m));
  }, [allMonths, selectedMonths]);

  // Selected Target and Base Years for YoY Comparison Chart
  const rawYoyTarget = yoyTargetYear || (activeYears[activeYears.length - 1] || '2026');
  const rawYoyBase = yoyBaseYear || (activeYears.length > 1 ? activeYears[activeYears.length - 2] : (allYears[allYears.indexOf(rawYoyTarget) - 1] || '2025'));

  // Smart Order: Identify Newer Year and Older Year to prevent reversed formula output
  const numTarget = parseInt(rawYoyTarget) || 2026;
  const numBase = parseInt(rawYoyBase) || 2025;

  const effYoyTarget = numTarget >= numBase ? rawYoyTarget : rawYoyBase; // Newer year
  const effYoyBase = numTarget >= numBase ? rawYoyBase : rawYoyTarget;   // Older year

  // Effective Selected Year for Share Breakdown Visual Chart
  const effShareYear = shareTargetYear || (activeYears[activeYears.length - 1] || '2026');

  const activeMonthLabel = activeMonths[0] || 'Mei';
  const latestPeriodKey = `${effYoyTarget}-${activeMonthLabel}`;

  // Compute active period columns (e.g. ['2024-Mei', '2025-Mei', '2026-Mei'])
  const activePeriods = useMemo(() => {
    const periods: { year: string; month: string; key: string }[] = [];
    activeYears.forEach(y => {
      activeMonths.forEach(m => {
        periods.push({
          year: y,
          month: m,
          key: m ? `${y}-${m}` : y
        });
      });
    });
    return periods;
  }, [activeYears, activeMonths]);

  // Filtered rows for table & cards
  const filteredData = useMemo(() => {
    const mainRows = rawSheet.data.filter(row => {
      const ind = row.indicator;
      if (!ind || ind.toLowerCase() === 'total') return false;
      return selectedCategories.includes(ind);
    });

    const totalRow = rawSheet.data.find(row => row.indicator?.toLowerCase() === 'total' || row.indicator === 'Total');

    return {
      mainRows,
      totalRow
    };
  }, [rawSheet, selectedCategories]);

  // Handle category multi-select toggle
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return; // keep at least 1
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Helper formatting
  const safeToTrillion = (val: number): number => {
    if (!val || isNaN(val)) return 0;
    const abs = Math.abs(val);

    if (abs >= 10 && abs < 1e5) {
      return val;
    }
    if (abs >= 1e11) {
      return val / 1e12;
    }
    if (abs >= 1e8) {
      return val / 1e9;
    }
    if (abs >= 1e5) {
      return val / 1e3;
    }
    return val;
  };

  const formatRupiahTrillion = (val: number) => {
    if (!val) return 'Rp 0';
    const trillion = safeToTrillion(val);
    return `Rp ${trillion.toFixed(2)} T`;
  };

  const formatPercent = (val: number) => {
    if (val === null || val === undefined) return '0.00%';
    const pct = val > 1 || val < -1 ? val : val * 100;
    const prefix = pct > 0 ? '+' : '';
    return `${prefix}${pct.toFixed(2)}%`;
  };

  // Dedicated YoY Calculation Dataset comparing Selected Target Year (Newer) vs Selected Base Year (Older)
  const yoyComparisonData = useMemo(() => {
    const categoriesToCompare = [...selectedCategories];
    const targetKey = `${effYoyTarget}-${activeMonthLabel}`;
    const baseKey = `${effYoyBase}-${activeMonthLabel}`;

    const result = categoriesToCompare.map(cat => {
      const row = rawSheet.data.find(r => r.indicator?.toLowerCase() === cat.toLowerCase());
      const rawTarget = row ? (row[targetKey] ?? row[effYoyTarget] ?? 0) : 0;
      const rawBase = row ? (row[baseKey] ?? row[effYoyBase] ?? 0) : 0;
      const valTarget = safeToTrillion(rawTarget);
      const valBase = safeToTrillion(rawBase);

      const diffTrillion = valTarget - valBase;

      let yoyPct = 0;
      if (valBase !== 0) {
        yoyPct = ((valTarget - valBase) / valBase) * 100;
      } else if (effYoyTarget === '2026' && effYoyBase === '2025' && row && typeof row['YOY'] === 'number') {
        yoyPct = row['YOY'] > 1 || row['YOY'] < -1 ? row['YOY'] : row['YOY'] * 100;
      }

      return {
        category: cat,
        valTarget,
        valBase,
        diffTrillion,
        yoyPct,
        isPositive: yoyPct >= 0
      };
    });

    // Add Total Row to YoY Comparison
    const totalRowData = rawSheet.data.find(r => r.indicator?.toLowerCase() === 'total' || r.indicator === 'Total');
    if (totalRowData) {
      const rawTotTarget = totalRowData[targetKey] ?? totalRowData[effYoyTarget] ?? 0;
      const rawTotBase = totalRowData[baseKey] ?? totalRowData[effYoyBase] ?? 0;
      const totTarget = safeToTrillion(rawTotTarget);
      const totBase = safeToTrillion(rawTotBase);
      const totDiff = totTarget - totBase;
      let totYoy = 0;
      if (totBase !== 0) {
        totYoy = ((totTarget - totBase) / totBase) * 100;
      } else if (effYoyTarget === '2026' && effYoyBase === '2025' && totalRowData['YOY']) {
        totYoy = totalRowData['YOY'] > 1 || totalRowData['YOY'] < -1 ? totalRowData['YOY'] : totalRowData['YOY'] * 100;
      }

      result.push({
        category: 'TOTAL KREDIT',
        valTarget: totTarget,
        valBase: totBase,
        diffTrillion: totDiff,
        yoyPct: totYoy,
        isPositive: totYoy >= 0
      });
    }

    return result;
  }, [selectedCategories, rawSheet, effYoyTarget, effYoyBase, activeMonthLabel]);

  // Dedicated Share Calculation Dataset for Selected Share Year
  const shareComparisonData = useMemo(() => {
    const shareKey = `${effShareYear}-${activeMonthLabel}`;

    let totalVal = 0;
    const totalRowData = rawSheet.data.find(r => r.indicator?.toLowerCase() === 'total' || r.indicator === 'Total');
    if (totalRowData && (totalRowData[shareKey] !== undefined || totalRowData[effShareYear] !== undefined)) {
      totalVal = safeToTrillion(totalRowData[shareKey] ?? totalRowData[effShareYear] ?? 0);
    }

    if (totalVal === 0) {
      // Sum selected categories
      selectedCategories.forEach(cat => {
        const row = rawSheet.data.find(r => r.indicator?.toLowerCase() === cat.toLowerCase());
        if (row) {
          totalVal += safeToTrillion(row[shareKey] ?? row[effShareYear] ?? 0);
        }
      });
    }

    const items = selectedCategories.map(cat => {
      const row = rawSheet.data.find(r => r.indicator?.toLowerCase() === cat.toLowerCase());
      const val = row ? safeToTrillion(row[shareKey] ?? row[effShareYear] ?? 0) : 0;
      let sharePct = 0;
      if (effShareYear === '2026' && row && typeof row['SHARE'] === 'number') {
        sharePct = row['SHARE'] > 1 ? row['SHARE'] : row['SHARE'] * 100;
      } else if (totalVal > 0) {
        sharePct = (val / totalVal) * 100;
      }
      return {
        name: cat,
        value: val,
        share: sharePct
      };
    });

    return {
      items,
      totalVal
    };
  }, [selectedCategories, rawSheet, effShareYear, activeMonthLabel]);

  // Main Recharts Data according to selected years & categories
  const chartBarData = useMemo(() => {
    return activePeriods.map(p => {
      const entry: any = {
        periodLabel: `${p.year} (${p.month || 'Tahunan'})`
      };
      selectedCategories.forEach(cat => {
        const row = rawSheet.data.find(r => r.indicator?.toLowerCase() === cat.toLowerCase());
        const rawVal = row ? (row[p.key] || row[p.year] || 0) : 0;
        entry[cat] = safeToTrillion(rawVal);
      });
      return entry;
    });
  }, [activePeriods, selectedCategories, rawSheet]);

  const modalKerjaRow = rawSheet.data.find(d => d.indicator?.toLowerCase().includes('modal'));
  const investasiRow = rawSheet.data.find(d => d.indicator?.toLowerCase().includes('invest'));
  const konsumsiRow = rawSheet.data.find(d => d.indicator?.toLowerCase().includes('konsum'));
  const totalRow = rawSheet.data.find(d => d.indicator?.toLowerCase().includes('total') || d.indicator === 'Total');

  const getSelectedYearsLabel = () => {
    if (selectedYears.length === 0) return 'Semua Tahun (2024 - 2026)';
    return selectedYears.join(', ');
  };

  const getSelectedMonthsLabel = () => {
    if (selectedMonths.length === 0) return 'Semua Bulan';
    return selectedMonths.join(', ');
  };

  const getClonedSvgWithLegend = (container: HTMLElement, svgEl: SVGSVGElement) => {
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const legendItems = container.querySelectorAll('.recharts-legend-item');
    if (!legendItems || legendItems.length === 0) return clonedSvg;

    const items: { text: string; color: string }[] = [];
    legendItems.forEach((item) => {
      const text = item.querySelector('.recharts-legend-item-text')?.textContent || '';
      const icon = item.querySelector('.recharts-legend-icon') || item.querySelector('path') || item.querySelector('circle');
      const color = icon?.getAttribute('fill') || icon?.getAttribute('stroke') || '#64748B';
      items.push({ text, color });
    });

    const originalHeight = parseFloat(svgEl.getAttribute('height') || '320');
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

    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendGroup.setAttribute('transform', `translate(0, ${originalHeight + 15})`);

    const itemGap = 20;
    let totalWidth = 0;
    items.forEach((item, i) => {
      totalWidth += 16 + (item.text.length * 6) + (i < items.length - 1 ? itemGap : 0);
    });

    let startX = Math.max(10, (originalWidth - totalWidth) / 2);

    items.forEach((item) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(startX));
      circle.setAttribute('cy', '-3');
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', item.color);
      legendGroup.appendChild(circle);

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

  const handleExportSVG = () => {
    const chartContainer = document.getElementById('kredit-chart-container');
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
    link.download = `FINSIGHT_Kredit_Jenis_${chartType}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handleExportPNG = () => {
    const chartContainer = document.getElementById('kredit-chart-container');
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
      link.download = `FINSIGHT_Kredit_Jenis_${chartType}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 w-full"
    >
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-50 text-[#C61E1E] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Template Resmi OJK
            </span>
            <span className="text-xs text-slate-400 font-medium">| Kredit per Jenis Penggunaan</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Kredit per Jenis Penggunaan
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Visualisasi penyaluran kredit interaktif dengan opsi filter langsung pada kartu grafik (Bar, Stacked, Line, Pie).
          </p>
        </div>

        <button
          onClick={downloadKreditJenisTemplate}
          className="flex items-center gap-2 bg-[#C61E1E] text-white font-bold text-xs px-4 py-3 rounded-2xl hover:bg-[#A31818] transition-all shadow-md active:scale-95 shrink-0"
        >
          <FileSpreadsheet size={16} />
          <span>Download Template Excel</span>
        </button>
      </div>

      {/* Interactive Filter Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 w-full space-y-5">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#C61E1E]" />
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Filter Utama Grafik & Tabel Data
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
            Terhubung Real-Time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Filter Rentang Tahun */}
          <div className="flex flex-col space-y-1.5 relative">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1. Filter Tahun
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setYearDropdownOpen(!yearDropdownOpen);
                  setMonthDropdownOpen(false);
                }}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
              >
                <span className="truncate">{getSelectedYearsLabel()}</span>
                <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
              </button>

              {yearDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setYearDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg z-40 max-h-[220px] overflow-y-auto p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYears([]);
                        setYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold flex items-center justify-between ${
                        selectedYears.length === 0
                          ? 'bg-slate-50 text-[#C61E1E]'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Semua Tahun (Tren)</span>
                      {selectedYears.length === 0 && <Check size={12} className="text-[#C61E1E]" />}
                    </button>

                    <div className="border-t border-slate-50 my-1" />

                    {allYears.map((y) => {
                      const isSelected = selectedYears.includes(y);
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            const next = isSelected 
                              ? selectedYears.filter(item => item !== y) 
                              : [...selectedYears, y];
                            setSelectedYears(next);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg font-semibold flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#C61E1E]/5 text-[#C61E1E] font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-slate-300 text-[#C61E1E] focus:ring-[#C61E1E] w-3.5 h-3.5"
                            />
                            <span>{y}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. Filter Periode Bulan */}
          <div className="flex flex-col space-y-1.5 relative">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              2. Filter Bulan
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMonthDropdownOpen(!monthDropdownOpen);
                  setYearDropdownOpen(false);
                }}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
              >
                <span className="truncate">{getSelectedMonthsLabel()}</span>
                <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
              </button>

              {monthDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMonthDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg z-40 max-h-[220px] overflow-y-auto p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonths([]);
                        setMonthDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold flex items-center justify-between ${
                        selectedMonths.length === 0
                          ? 'bg-slate-50 text-[#C61E1E]'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Semua Bulan</span>
                      {selectedMonths.length === 0 && <Check size={12} className="text-[#C61E1E]" />}
                    </button>

                    <div className="border-t border-slate-50 my-1" />

                    {allMonths.map((m) => {
                      const isSelected = selectedMonths.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            const next = isSelected 
                              ? selectedMonths.filter(item => item !== m) 
                              : [...selectedMonths, m];
                            setSelectedMonths(next);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg font-semibold flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#C61E1E]/5 text-[#C61E1E] font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-slate-300 text-[#C61E1E] focus:ring-[#C61E1E] w-3.5 h-3.5"
                            />
                            <span>{m}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. Tipe Grafik Utama */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              3. Jenis Visualisasi Utama
            </label>
            <div className="relative">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
              >
                <option value="bar">Bar Chart (Batang Terpisah)</option>
                <option value="stacked">Stacked Bar Chart (Batang Tumpuk)</option>
                <option value="line">Line Chart (Tren Garis)</option>
                <option value="pie">Pie Chart (Pangsa Pasar / Share)</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 4. Toggle Tampilkan YOY, SHARE, & Angka Grafik */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              4. Opsi Tampilan & Label
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setShowYoy(!showYoy)}
                className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  showYoy 
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle Tampilan Kolom YOY"
              >
                {showYoy ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>YOY</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShare(!showShare)}
                className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  showShare 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle Tampilan Kolom SHARE"
              >
                {showShare ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>SHARE</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChartLabels(!showChartLabels)}
                className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  showChartLabels 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle Tampilkan Angka Nominal pada Grafik"
              >
                <Hash size={12} />
                <span>Angka</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. Filter Pilih Jenis Penggunaan (Multi-select) */}
        <div className="flex flex-col space-y-2 border-t border-slate-50 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            5. Filter Jenis Penggunaan Kredit (Multi-Select)
          </span>
          <div className="flex flex-wrap gap-2.5">
            {availableCategories.map((cat) => {
              const isChecked = selectedCategories.includes(cat);
              const color = COLORS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isChecked
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                  {isChecked && <Check size={12} strokeWidth={3} />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Modal Kerja Card */}
        {selectedCategories.includes('Modal Kerja') && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-soft relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet size={20} />
              </div>
              {showShare && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Share: {(modalKerjaRow?.['SHARE'] ? (modalKerjaRow['SHARE'] * 100).toFixed(2) : '30.52')}%
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modal Kerja ({effYoyTarget})</p>
            <h3 className="text-lg font-black text-slate-800 font-mono mt-1">
              {formatRupiahTrillion(modalKerjaRow?.[latestPeriodKey] || modalKerjaRow?.['2026-Mei'] || 329740604279539)}
            </h3>
            {showYoy && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50 text-xs font-semibold">
                {Number(modalKerjaRow?.['YOY']) < 0 ? (
                  <TrendingDown size={14} className="text-red-500" />
                ) : (
                  <TrendingUp size={14} className="text-emerald-500" />
                )}
                <span className={Number(modalKerjaRow?.['YOY']) < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {formatPercent(modalKerjaRow?.['YOY'] ?? -0.0268)}
                </span>
                <span className="text-slate-400 font-normal">YoY</span>
              </div>
            )}
          </div>
        )}

        {/* Investasi Card */}
        {selectedCategories.includes('Investasi') && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-soft relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              {showShare && (
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Share: {(investasiRow?.['SHARE'] ? (investasiRow['SHARE'] * 100).toFixed(2) : '23.30')}%
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investasi ({effYoyTarget})</p>
            <h3 className="text-lg font-black text-slate-800 font-mono mt-1">
              {formatRupiahTrillion(investasiRow?.[latestPeriodKey] || investasiRow?.['2026-Mei'] || 251790742742739)}
            </h3>
            {showYoy && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50 text-xs font-semibold">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-emerald-600 font-bold">
                  {formatPercent(investasiRow?.['YOY'] ?? 0.1618)}
                </span>
                <span className="text-slate-400 font-normal">YoY</span>
              </div>
            )}
          </div>
        )}

        {/* Konsumsi Card */}
        {selectedCategories.includes('Konsumsi') && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-soft relative overflow-hidden group hover:border-pink-200 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              {showShare && (
                <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                  Share: {(konsumsiRow?.['SHARE'] ? (konsumsiRow['SHARE'] * 100).toFixed(2) : '46.18')}%
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konsumsi ({effYoyTarget})</p>
            <h3 className="text-lg font-black text-slate-800 font-mono mt-1">
              {formatRupiahTrillion(konsumsiRow?.[latestPeriodKey] || konsumsiRow?.['2026-Mei'] || 499029032369175)}
            </h3>
            {showYoy && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50 text-xs font-semibold">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-emerald-600 font-bold">
                  {formatPercent(konsumsiRow?.['YOY'] ?? 0.0507)}
                </span>
                <span className="text-slate-400 font-normal">YoY</span>
              </div>
            )}
          </div>
        )}

        {/* Total Kredit Card */}
        <div className="bg-gradient-to-br from-[#C61E1E] to-[#9E1818] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Layers size={20} />
            </div>
            {showShare && (
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                Total 100%
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-red-200 uppercase tracking-wider">Total Penyaluran Kredit</p>
          <h3 className="text-lg font-black text-white font-mono mt-1">
            {formatRupiahTrillion(totalRow?.[latestPeriodKey] || totalRow?.['2026-Mei'] || 1080560379391450)}
          </h3>
          {showYoy && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/20 text-xs font-semibold text-red-100">
              <TrendingUp size={14} className="text-emerald-300" />
              <span className="text-white font-bold">
                {formatPercent(totalRow?.['YOY'] ?? 0.0486)}
              </span>
              <span className="text-red-200 font-normal">Total YoY</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Dynamic Chart Section with Dedicated Filter Buttons Inside Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-slate-50 pb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {chartType === 'line' ? <LineIcon size={16} className="text-[#C61E1E]" /> : chartType === 'pie' ? <PieIcon size={16} className="text-[#C61E1E]" /> : <BarChart3 size={16} className="text-[#C61E1E]" />}
              <span>Tren Nominal Kredit per Jenis Penggunaan (Triliun Rp)</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Pilih langsung jenis grafik (Bar, Stacked Bar, Line, atau Pie Chart) dan kontrol label angka
            </p>
          </div>

          {/* In-Card Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Quick Chart Type Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-0.5">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartType === 'bar' ? 'bg-white text-[#C61E1E] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Bar Chart Terpisah"
              >
                <BarChart3 size={13} />
                <span>Bar Chart</span>
              </button>

              <button
                type="button"
                onClick={() => setChartType('stacked')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartType === 'stacked' ? 'bg-white text-[#C61E1E] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Bar Chart Tumpuk (Stacked)"
              >
                <Layers size={13} />
                <span>Stacked Bar</span>
              </button>

              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartType === 'line' ? 'bg-white text-[#C61E1E] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Line Chart Garis Tren"
              >
                <LineIcon size={13} />
                <span>Line Chart</span>
              </button>

              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartType === 'pie' ? 'bg-white text-[#C61E1E] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pie / Donut Chart Pangsa Pasar"
              >
                <PieIcon size={13} />
                <span>Pie Chart</span>
              </button>
            </div>

            {/* 2. Number Labels Toggle */}
            <button
              type="button"
              onClick={() => setShowChartLabels(!showChartLabels)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                showChartLabels 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
              title="Toggle Label Angka pada Grafik"
            >
              <Hash size={13} />
              <span>Label Angka</span>
            </button>

            {/* 3. Export SVG & PNG Buttons */}
            <button
              onClick={handleExportSVG}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Download Vector format SVG"
            >
              <Download size={13} />
              <span className="hidden sm:inline">SVG</span>
            </button>

            <button
              onClick={handleExportPNG}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Download Image format PNG"
            >
              <Download size={13} />
              <span className="hidden sm:inline">PNG</span>
            </button>
          </div>
        </div>
        
        <div id="kredit-chart-container" className="h-80 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartBarData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `Rp ${v}T`} />
                <Tooltip 
                  formatter={(val: any) => [`Rp ${Number(val).toFixed(2)} Triliun`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {selectedCategories.map(cat => (
                  <Line 
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={COLORS[cat]}
                    strokeWidth={3}
                    dot={{ r: 5, fill: COLORS[cat] }}
                  >
                    {showChartLabels && (
                      <LabelList 
                        dataKey={cat} 
                        position="top" 
                        formatter={(val: any) => val ? `Rp ${Number(val).toFixed(1)}T` : ''} 
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: COLORS[cat] }} 
                      />
                    )}
                  </Line>
                ))}
              </LineChart>
            ) : chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={shareComparisonData.items}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={showChartLabels ? ({ name, value, share }) => `${name}: Rp ${Number(value).toFixed(1)}T (${Number(share).toFixed(1)}%)` : undefined}
                  labelLine={showChartLabels ? { stroke: '#94A3B8', strokeWidth: 1 } : false}
                >
                  {shareComparisonData.items.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any, item: any) => [
                    `Rp ${Number(val).toFixed(2)} T (${item.payload.share.toFixed(2)}%)`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            ) : (
              <BarChart data={chartBarData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `Rp ${v}T`} />
                <Tooltip 
                  formatter={(val: any) => [`Rp ${Number(val).toFixed(2)} Triliun`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {selectedCategories.map(cat => (
                  <Bar 
                    key={cat}
                    dataKey={cat}
                    stackId={chartType === 'stacked' ? 'a' : undefined}
                    fill={COLORS[cat]}
                    radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  >
                    {showChartLabels && (
                      <LabelList 
                        dataKey={cat} 
                        position={chartType === 'stacked' ? 'inside' : 'top'} 
                        formatter={(val: any) => val ? `Rp ${Number(val).toFixed(1)}T` : ''} 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 'bold', 
                          fill: chartType === 'stacked' ? '#FFFFFF' : '#475569' 
                        }} 
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DEDICATED STANDALONE VISUALIZATION SECTION: YOY & SHARE WITH CLEAR EXPICIT YEAR LABELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Standalone Visualization 1: Grafik Pertumbuhan YoY dengan Label Terang Tahun Evaluasi vs Tahun Dasar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-50 pb-3 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-amber-500" />
                  <span>Visualisasi Pertumbuhan YoY</span>
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono">
                    {effYoyBase} ➔ {effYoyTarget}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Membandingkan pertumbuhan dari <strong>Tahun Pembanding ({effYoyBase})</strong> ke <strong>Tahun Evaluasi ({effYoyTarget})</strong>
                </p>
              </div>

              {/* YoY Filter Dropdowns with explicit headers to avoid user confusion */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 text-xs font-bold shrink-0">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Tahun Evaluasi (Terbaru)</span>
                  <select
                    value={rawYoyTarget}
                    onChange={(e) => setYoyTargetYear(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
                  >
                    {allYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-black text-xs self-end mb-1">VS</span>

                <div className="flex flex-col space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Tahun Acuan (Pembanding)</span>
                  <select
                    value={rawYoyBase}
                    onChange={(e) => setYoyBaseYear(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
                  >
                    {['2023', '2024', '2025', '2026'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sub-header notification rule */}
            <div className="bg-amber-50/70 border border-amber-100 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-amber-800 flex items-center justify-between mt-2">
              <span>Formula: <code>(Nilai {effYoyTarget} - Nilai {effYoyBase}) / Nilai {effYoyBase}</code></span>
              <span className="font-bold">Pertumbuhan {effYoyBase} ke {effYoyTarget}</span>
            </div>

            {/* Visual Bar Chart for YoY % */}
            <div className="h-64 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={yoyComparisonData}
                  margin={{ top: 10, right: 40, left: 25, bottom: 0 }}
                >
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} width={110} />
                  <ReferenceLine x={0} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="3 3" />
                  <Tooltip 
                    formatter={(val: any, name: any, item: any) => [
                      `${Number(val) > 0 ? '+' : ''}${Number(val).toFixed(2)}% (${item.payload.diffTrillion > 0 ? '+' : ''}Rp ${item.payload.diffTrillion.toFixed(2)} T)`,
                      `Pertumbuhan YoY (${effYoyBase} ➔ ${effYoyTarget})`
                    ]}
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                  />
                  <Bar dataKey="yoyPct" radius={[0, 4, 4, 0]}>
                    {yoyComparisonData.map((entry, index) => (
                      <Cell 
                        key={`cell-yoy-${index}`} 
                        fill={entry.category === 'TOTAL KREDIT' ? '#C61E1E' : entry.isPositive ? '#10B981' : '#EF4444'} 
                      />
                    ))}
                    {showChartLabels && (
                      <LabelList 
                        dataKey="yoyPct" 
                        position="right" 
                        formatter={(val: any) => `${Number(val) > 0 ? '+' : ''}${Number(val).toFixed(2)}%`} 
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: '#334155' }} 
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* YoY Card Highlights summary */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
            {yoyComparisonData.map(item => (
              <div key={item.category} className="bg-slate-50 p-2.5 rounded-xl flex flex-col space-y-0.5 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</span>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black font-mono ${item.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatPercent(item.yoyPct)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 font-mono">
                    {item.diffTrillion > 0 ? '+' : ''}Rp {item.diffTrillion.toFixed(2)}T
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standalone Visualization 2: Grafik Distribusi Pangsa Pasar & Share (%) dengan Filter Bebas Pilih Tahun */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Percent size={16} className="text-blue-600" />
                  <span>Visualisasi Distribusi Share (%)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Proporsi kontribusi penyaluran kredit per kategori
                </p>
              </div>

              {/* Share Year Selection Dropdown Filter Control */}
              <div className="flex flex-col space-y-0.5 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 text-xs font-bold shrink-0">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Tahun Share</span>
                <select
                  value={effShareYear}
                  onChange={(e) => setShareTargetYear(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
                >
                  {allYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual Multi-Segment Progress Bar */}
            <div className="space-y-3 my-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Distribusi Portofolio Kredit ({effShareYear})</span>
                <span className="text-blue-600 font-mono">Total: Rp {shareComparisonData.totalVal.toFixed(2)} T</span>
              </div>
              <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 shadow-inner">
                {shareComparisonData.items.map((item) => (
                  <div
                    key={item.name}
                    style={{ width: `${item.share}%`, backgroundColor: COLORS[item.name] }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 relative group cursor-pointer"
                    title={`${item.name}: ${item.share.toFixed(2)}% (Rp ${item.value.toFixed(2)}T)`}
                  />
                ))}
              </div>
            </div>

            {/* Detailed Cards for each Share Category */}
            <div className="space-y-3">
              {shareComparisonData.items.map((item) => {
                const color = COLORS[item.name];
                return (
                  <div key={item.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-8 rounded-full" style={{ backgroundColor: color }} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold font-mono">Rp {item.value.toFixed(2)} Triliun</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 font-mono">{item.share.toFixed(2)}%</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Kontribusi</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-semibold">
            <span>Kategori Terbesar ({effShareYear}):</span>
            <span className="font-bold font-mono">
              {shareComparisonData.items.reduce((prev, current) => (prev.value > current.value ? prev : current), shareComparisonData.items[0])?.name} ({shareComparisonData.items.reduce((prev, current) => (prev.value > current.value ? prev : current), shareComparisonData.items[0])?.share.toFixed(2)}%)
            </span>
          </div>
        </div>

      </div>

      {/* Dynamic Master Table View with Filter Toggles */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Struktur Tabel Template Excel (Filter Aktif)
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Menampilkan {activePeriods.length} periode & {filteredData.mainRows.length} kategori terpilih
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Format Standar OJK
            </span>
          </div>
        </div>

        {/* Scrollable Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Row 1 Header (Years) */}
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center">
                <th className="p-3.5 border-r border-slate-200 bg-slate-200/60 text-slate-800 text-left font-black w-60">
                  Kredit per Jenis Penggunaan
                </th>
                {activeYears.map(y => (
                  <th key={y} className="p-3.5 border-r border-slate-200 bg-slate-100 font-black">
                    {y}
                  </th>
                ))}
                {showYoy && <th className="p-3.5 border-r border-slate-200 bg-slate-100/50"></th>}
                {showShare && <th className="p-3.5 bg-slate-100/50"></th>}
              </tr>
              {/* Row 2 Header (Months / YOY / SHARE) */}
              <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200 text-center">
                <th className="p-3 border-r border-slate-200 bg-slate-100/40"></th>
                {activeYears.map(y => (
                  <th key={y} className="p-3 border-r border-slate-200 bg-red-50/60 text-[#C61E1E] font-black">
                    {activeMonths.join(', ') || 'Mei'}
                  </th>
                ))}
                {showYoy && <th className="p-3 border-r border-slate-200 bg-amber-50 text-amber-700 font-black">YOY</th>}
                {showShare && <th className="p-3 bg-blue-50 text-blue-700 font-black">SHARE</th>}
              </tr>
            </thead>
            <tbody>
              {/* Filtered Data Rows */}
              {filteredData.mainRows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 border-r border-slate-200 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[row.indicator] || '#64748B' }}></span>
                      <span>{row.indicator}</span>
                    </div>
                  </td>
                  {activeYears.map(y => {
                    const periodKey = `${y}-${activeMonths[0] || 'Mei'}`;
                    const val = row[periodKey] ?? row[y];
                    return (
                      <td key={y} className="p-3.5 border-r border-slate-200 text-right font-mono text-slate-700">
                        {typeof val === 'number' ? val.toLocaleString('id-ID') : (val || '-')}
                      </td>
                    );
                  })}
                  {showYoy && (
                    <td className={`p-3.5 border-r border-slate-200 text-right font-mono font-bold ${
                      Number(row['YOY']) < 0 ? 'text-red-600 bg-red-50/30' : 'text-emerald-700 bg-emerald-50/30'
                    }`}>
                      {formatPercent(row['YOY'])}
                    </td>
                  )}
                  {showShare && (
                    <td className="p-3.5 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                      {typeof row['SHARE'] === 'number' 
                        ? `${(row['SHARE'] > 1 ? row['SHARE'] : row['SHARE'] * 100).toFixed(2)}%`
                        : (row['SHARE'] || '0.00%')
                      }
                    </td>
                  )}
                </tr>
              ))}

              {/* Total Row */}
              {filteredData.totalRow && (
                <tr className="bg-slate-100/70 font-black text-[#1E293B] border-t-2 border-t-slate-300 border-b border-slate-200">
                  <td className="p-3.5 border-r border-slate-200 font-black text-slate-900 bg-slate-200/40">
                    Total
                  </td>
                  {activeYears.map(y => {
                    const periodKey = `${y}-${activeMonths[0] || 'Mei'}`;
                    const val = filteredData.totalRow?.[periodKey] ?? filteredData.totalRow?.[y];
                    return (
                      <td key={y} className="p-3.5 border-r border-slate-200 text-right font-mono font-black text-slate-900">
                        {typeof val === 'number' ? val.toLocaleString('id-ID') : (val || '-')}
                      </td>
                    );
                  })}
                  {showYoy && (
                    <td className="p-3.5 border-r border-slate-200 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                      {formatPercent(filteredData.totalRow?.['YOY'] ?? 0.0486)}
                    </td>
                  )}
                  {showShare && (
                    <td className="p-3.5 text-right font-mono font-black text-blue-700 bg-blue-50/50">
                      100.00%
                    </td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
