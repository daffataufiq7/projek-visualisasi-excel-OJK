import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Info,
  Layers,
  Activity
} from 'lucide-react';
import { ActiveFile } from '../types/dashboard';

interface YoyAnalysisProps {
  activeFile: ActiveFile;
  defaultSheet?: string;
  hideSheetSelect?: boolean;
}

interface YoyItem {
  indicator: string;
  isRatio: boolean;
  prevVal: number | null;
  currentVal: number | null;
  changeVal: number | null;
  pctChange: number | null;
  status: 'success' | 'failed';
  errorMessage: string;
}

export default function YoyAnalysis({ activeFile, defaultSheet, hideSheetSelect = false }: YoyAnalysisProps) {
  const sheetNames = activeFile.sheetNames;
  const [selectedSheet, setSelectedSheet] = useState<string>(defaultSheet || sheetNames[0] || '');

  // Keep selectedSheet in sync with defaultSheet if it changes
  React.useEffect(() => {
    if (defaultSheet && defaultSheet !== selectedSheet && sheetNames.includes(defaultSheet)) {
      setSelectedSheet(defaultSheet);
    }
  }, [defaultSheet, selectedSheet, sheetNames]);

  const sheetData = useMemo(() => {
    return activeFile.sheets[selectedSheet];
  }, [activeFile, selectedSheet]);

  // All available years in the sheet sorted ascending
  const targetYears = useMemo(() => {
    if (!sheetData) return [];
    const validYears = sheetData.years.filter(yr => yr && yr !== 'All' && /^\d{4}$/.test(yr)).sort();
    return validYears.length > 0 ? validYears : sheetData.years.filter(yr => yr && yr !== 'All').sort();
  }, [sheetData]);

  const [selectedYear, setSelectedYear] = useState<string>('');

  // Set default target year when invalid or empty, preserving user's choice
  React.useEffect(() => {
    if (targetYears.length > 0) {
      if (!selectedYear || !targetYears.includes(selectedYear)) {
        setSelectedYear(targetYears[targetYears.length - 1]);
      }
    } else {
      setSelectedYear('');
    }
  }, [targetYears, selectedYear]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Previous comparison year: either selectedYear - 1, or the previous year in targetYears array
  const prevYear = useMemo(() => {
    if (!selectedYear || targetYears.length === 0) return '';
    const numericYear = Number(selectedYear);
    const directPrev = String(numericYear - 1);
    if (targetYears.includes(directPrev)) return directPrev;
    
    const currIdx = targetYears.indexOf(selectedYear);
    if (currIdx > 0) return targetYears[currIdx - 1];
    if (targetYears.length > 1) return targetYears[0];
    return selectedYear;
  }, [selectedYear, targetYears]);

  // Available months for YoY analysis: only months that exist in BOTH selectedYear and prevYear
  const availableYoyMonths = useMemo(() => {
    if (!sheetData || !sheetData.months || sheetData.months.length === 0) return [];
    if (!selectedYear) return sheetData.months;

    const targetMonths = sheetData.periods
      .filter(p => p.startsWith(`${selectedYear}-`))
      .map(p => p.split('-')[1])
      .filter(Boolean);

    if (!prevYear || prevYear === selectedYear) {
      return targetMonths.length > 0 ? targetMonths : sheetData.months;
    }

    const prevMonths = sheetData.periods
      .filter(p => p.startsWith(`${prevYear}-`))
      .map(p => p.split('-')[1])
      .filter(Boolean);

    const commonMonths = targetMonths.filter(m => prevMonths.includes(m));

    if (commonMonths.length > 0) {
      return commonMonths;
    }
    return targetMonths.length > 0 ? targetMonths : sheetData.months;
  }, [sheetData, selectedYear, prevYear]);

  const hasMonths = availableYoyMonths.length > 0;

  // Preserve selected month if valid in availableYoyMonths; otherwise default to the latest available month
  React.useEffect(() => {
    if (availableYoyMonths.length > 0) {
      if (!selectedMonth || !availableYoyMonths.includes(selectedMonth)) {
        setSelectedMonth(availableYoyMonths[availableYoyMonths.length - 1]);
      }
    } else {
      setSelectedMonth('');
    }
  }, [availableYoyMonths, selectedMonth]);

  // Initialize indicators from sheetData on mount (so initial render has all checked)
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(() => {
    const initialSheet = activeFile.sheets[defaultSheet || sheetNames[0] || ''];
    return initialSheet?.indicators ?? [];
  });
  const [indicatorDropdownOpen, setIndicatorDropdownOpen] = useState(false);

  // Re-select all indicators ONLY when the selected sheet changes (not on every sheetData re-reference)
  React.useEffect(() => {
    if (sheetData) {
      setSelectedIndicators(sheetData.indicators);
    } else {
      setSelectedIndicators([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSheet]);

  const getSelectedIndicatorsLabel = () => {
    if (selectedIndicators.length === 0) return 'Pilih Indikator';
    if (selectedIndicators.length === sheetData?.indicators?.length) return 'Semua Indikator';
    return selectedIndicators.map(ind => ind.split('/')[0].split('(')[0].trim()).join(', ');
  };

  // Calculate YoY for all indicators in the sheet (with robust fallbacks for explicit YOY columns)
  const yoyDataList = useMemo((): YoyItem[] => {
    if (!sheetData) return [];

    const indicators = sheetData.indicators;
    const result: YoyItem[] = [];

    // Build the list of non-YOY periods (exclude 'YOY' and 'SHARE' keys)
    const dataPeriods = sheetData.periods.filter(p => p !== 'YOY' && p !== 'SHARE');

    indicators.forEach((ind) => {
      // Check if indicator is a ratio/percentage
      const isRatio = /npl|ldr|%|rasio|ratio|growth|pertumbuhan/i.test(ind);

      // --- Step 1: ALWAYS try reading the explicit YOY column first ---
      const explicitYoyRaw = sheetData.indicatorsData[ind]?.['YOY'];
      let explicitYoyPct: number | null = null;
      if (explicitYoyRaw !== undefined && explicitYoyRaw !== null) {
        const rawNum = typeof explicitYoyRaw === 'number'
          ? explicitYoyRaw
          : parseFloat(String(explicitYoyRaw).replace('%', '').trim());
        if (!isNaN(rawNum) && rawNum !== 0) {
          explicitYoyPct = Math.abs(rawNum) <= 1.0 ? rawNum * 100 : rawNum;
        }
      }

      // Fallback explicit YOY from grid row data object
      if (explicitYoyPct === null) {
        const gridRow = sheetData.data.find(d => d.indicator === ind || d.indicator?.toLowerCase() === ind.toLowerCase());
        const gridYoy = gridRow?.['YOY'] ?? gridRow?.['yoy'] ?? gridRow?.['YoY'];
        if (gridYoy !== undefined && gridYoy !== null && gridYoy !== '') {
          const rawNum = typeof gridYoy === 'number' ? gridYoy : parseFloat(String(gridYoy).replace('%', '').trim());
          if (!isNaN(rawNum) && rawNum !== 0) {
            explicitYoyPct = Math.abs(rawNum) <= 1.5 ? rawNum * 100 : rawNum;
          }
        }
      }

      // --- Step 2: Determine current & prev period ---
      let currentPeriod = '';
      let prevPeriod = '';

      if (hasMonths && selectedMonth && selectedYear) {
        currentPeriod = `${selectedYear}-${selectedMonth}`;
        prevPeriod = `${prevYear}-${selectedMonth}`;
      } else if (selectedYear) {
        currentPeriod = selectedYear;
        prevPeriod = prevYear;
      }

      // Get current value — prefer the selected period, fallback to the last available period
      let currentVal: number | undefined = undefined;
      if (currentPeriod && sheetData.indicatorsData[ind]?.[currentPeriod] !== undefined) {
        currentVal = sheetData.indicatorsData[ind][currentPeriod];
      } else if (dataPeriods.length > 0) {
        currentVal = sheetData.indicatorsData[ind]?.[dataPeriods[dataPeriods.length - 1]];
      }

      // Get prev value — prefer the selected prev period, fallback to the first available period
      let prevVal: number | undefined = undefined;
      if (prevPeriod && sheetData.indicatorsData[ind]?.[prevPeriod] !== undefined) {
        prevVal = sheetData.indicatorsData[ind][prevPeriod];
      } else if (dataPeriods.length > 1) {
        prevVal = sheetData.indicatorsData[ind]?.[dataPeriods[0]];
      }

      let calculated = false;

      // --- Step 3: Calculate from period data if both values available ---
      if (
        currentVal !== undefined && prevVal !== undefined &&
        prevVal !== 0 && currentPeriod !== prevPeriod && currentPeriod !== '' && prevPeriod !== ''
      ) {
        const changeVal = currentVal - prevVal;
        const pctChange = isRatio ? changeVal : (changeVal / prevVal) * 100;

        result.push({
          indicator: ind,
          isRatio,
          prevVal,
          currentVal,
          changeVal: parseFloat(changeVal.toFixed(4)),
          pctChange: parseFloat(pctChange.toFixed(2)),
          status: 'success',
          errorMessage: ''
        });
        calculated = true;
      }

      // --- Step 4: Use explicit YOY column value as fallback ---
      if (!calculated && explicitYoyPct !== null) {
        result.push({
          indicator: ind,
          isRatio,
          prevVal: prevVal ?? 0,
          currentVal: currentVal ?? 0,
          changeVal: null,
          pctChange: parseFloat(explicitYoyPct.toFixed(2)),
          status: 'success',
          errorMessage: ''
        });
        calculated = true;
      }

      if (!calculated) {
        result.push({
          indicator: ind,
          isRatio,
          prevVal: prevVal ?? null,
          currentVal: currentVal ?? null,
          changeVal: null,
          pctChange: null,
          status: 'failed',
          errorMessage: 'YoY tidak dapat dihitung'
        });
      }
    });

    return result;
  }, [sheetData, selectedYear, prevYear, hasMonths, selectedMonth]);

  // Separate nominal and ratio indicators for charts
  const nominalData = useMemo(() => {
    return yoyDataList
      .filter(item => selectedIndicators.includes(item.indicator))
      .filter(item => !item.isRatio);
  }, [yoyDataList, selectedIndicators]);

  const ratioData = useMemo(() => {
    return yoyDataList
      .filter(item => selectedIndicators.includes(item.indicator))
      .filter(item => item.isRatio);
  }, [yoyDataList, selectedIndicators]);

  // Comparative charts data
  const nominalComparativeData = useMemo(() => {
    if (!sheetData || !selectedYear) return [];

    return nominalData.map(item => {
      const yoyText = item.status === 'failed' 
        ? 'N/A' 
        : item.pctChange !== null 
          ? `${item.pctChange > 0 ? '+' : ''}${item.pctChange.toFixed(2)}%`
          : '0.00%';
      return {
        name: item.indicator,
        [prevYear]: item.prevVal || 0,
        [selectedYear]: item.currentVal || 0,
        yoyLabel: yoyText
      };
    });
  }, [nominalData, prevYear, selectedYear, sheetData]);

  const ratioComparativeData = useMemo(() => {
    return ratioData.map(item => {
      const yoyText = item.status === 'failed'
        ? 'N/A'
        : item.changeVal !== null
          ? `${item.changeVal > 0 ? '+' : ''}${item.changeVal.toFixed(2)} ppt`
          : '0.00 ppt';
      return {
        name: item.indicator,
        [prevYear]: item.prevVal || 0,
        [selectedYear]: item.currentVal || 0,
        yoyLabel: yoyText
      };
    });
  }, [ratioData, prevYear, selectedYear]);

  // Growth rate chart data (X: indicator, Y: pctChange)
  const nominalGrowthData = useMemo(() => {
    return nominalData.map(item => ({
      name: item.indicator,
      growth: item.status === 'failed' ? 0 : item.pctChange || 0,
      label: item.status === 'failed' ? 'N/A' : `${item.pctChange || 0}%`
    }));
  }, [nominalData]);

  const ratioGrowthData = useMemo(() => {
    return ratioData.map(item => ({
      name: item.indicator,
      change: item.status === 'failed' ? 0 : item.changeVal || 0,
      label: item.status === 'failed' ? 'N/A' : `${item.changeVal || 0} ppt`
    }));
  }, [ratioData]);

  // Tooltip content helper
  const CustomYoyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const indName = label;
      const targetItem = yoyDataList.find(d => d.indicator === indName);
      if (!targetItem) return null;

      const formatVal = (val: number | null) => {
        if (val === null) return '-';
        return val.toLocaleString('id-ID');
      };

      const formatChange = (val: number | null, pct: number | null) => {
        if (targetItem.status === 'failed') return 'YoY tidak dapat dihitung';
        if (val === null || pct === null) return '-';
        
        const sign = pct > 0 ? '+' : '';
        return `${sign}${pct.toFixed(2)}% (${val > 0 ? 'Naik' : val < 0 ? 'Turun' : 'Netral'})`;
      };

      return (
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-premium">
          <p className="text-xs font-black text-slate-800 mb-2">{indName}</p>
          <div className="space-y-1 text-[11px] font-semibold text-slate-500">
            <div className="flex justify-between gap-6">
              <span>Nilai Periode {prevYear}:</span>
              <span className="font-mono font-bold text-slate-700">{formatVal(targetItem.prevVal)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Nilai Periode {selectedYear}:</span>
              <span className="font-mono font-bold text-slate-700">{formatVal(targetItem.currentVal)}</span>
            </div>
            <div className="border-t border-slate-50 my-1.5 pt-1.5 flex justify-between gap-6">
              <span className="text-slate-800">Pertumbuhan YoY:</span>
              <span className={`font-bold ${
                targetItem.status === 'failed' 
                  ? 'text-slate-400' 
                  : (targetItem.changeVal || 0) > 0 
                    ? 'text-emerald-600' 
                    : (targetItem.changeVal || 0) < 0 
                      ? 'text-red-600' 
                      : 'text-slate-500'
              }`}>
                {formatChange(targetItem.changeVal, targetItem.pctChange)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderBadge = (item: YoyItem) => {
    if (item.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-slate-50 text-slate-400 border-slate-100">
          <AlertCircle size={12} />
          N/A
        </span>
      );
    }

    const value = item.isRatio ? item.changeVal : item.pctChange;
    const label = item.isRatio ? 'ppt' : '%';
    const sign = (value || 0) > 0 ? '+' : '';

    if ((value || 0) > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100/50">
          <TrendingUp size={12} />
          {sign}{value?.toFixed(2)}{label}
        </span>
      );
    }
    if ((value || 0) < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-red-50 text-red-600 border-red-100/50">
          <TrendingDown size={12} />
          {value?.toFixed(2)}{label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200">
        0.00{label}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="text-[#C61E1E]" size={20} />
            Analisis Pertumbuhan Year-on-Year (YoY)
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Perbandingan kinerja indikator keuangan regional OJK terhadap tahun sebelumnya.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Sheet Selector */}
          {!hideSheetSelect && (
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sektor/Sheet</span>
              <div className="relative min-w-[140px]">
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
                >
                  {sheetNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Year Target Selector */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tahun Target</span>
            <div className="relative min-w-[120px]">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={targetYears.length === 0}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer disabled:opacity-50"
              >
                {targetYears.length === 0 ? (
                  <option value="">Tidak ada tahun pembanding</option>
                ) : (
                  targetYears.map(yr => (
                    <option key={yr} value={yr}>{yr} vs {Number(yr) - 1}</option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Month Target Selector */}
          {hasMonths && (
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bulan Target</span>
              <div className="relative min-w-[100px]">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
                >
                  {availableYoyMonths.map(mo => (
                    <option key={mo} value={mo}>{mo}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Indicator Selector */}
          <div className="flex flex-col space-y-1 relative">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pilih Indikator</span>
            <div className="relative min-w-[170px]">
              <button
                type="button"
                disabled={!sheetData}
                onClick={() => {
                  setIndicatorDropdownOpen(!indicatorDropdownOpen);
                }}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#C61E1E] disabled:opacity-50"
              >
                <span className="truncate">{getSelectedIndicatorsLabel()}</span>
                <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
              </button>

              {indicatorDropdownOpen && sheetData?.indicators && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIndicatorDropdownOpen(false)} />
                  <div className="absolute top-full right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg z-40 max-h-[220px] overflow-y-auto p-2 space-y-1 w-[200px]">
                    {sheetData.indicators.map((ind) => {
                      const isSelected = selectedIndicators.includes(ind);
                      return (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => {
                            const next = selectedIndicators.includes(ind)
                              ? selectedIndicators.filter(item => item !== ind)
                              : [...selectedIndicators, ind];
                            setSelectedIndicators(next);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg font-semibold flex items-center justify-between ${isSelected
                              ? 'bg-[#C61E1E]/5 text-[#C61E1E] font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <span className="flex items-center gap-2 max-w-[85%] truncate">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-slate-300 text-[#C61E1E] focus:ring-[#C61E1E] w-3.5 h-3.5"
                            />
                            <span className="truncate" title={ind}>{ind}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {targetYears.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
          <AlertCircle className="mx-auto text-[#C61E1E] opacity-35 mb-2 animate-bounce" size={32} />
          <p className="text-xs font-bold text-slate-700">Analisis YoY tidak tersedia</p>
          <p className="text-[10px] text-slate-400 mt-1">Sheet harus memiliki setidaknya dua tahun berurutan untuk menghitung Year-on-Year.</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {yoyDataList
              .filter(item => selectedIndicators.includes(item.indicator))
              .map((item) => {
                const showVal = (val: number | null) => {
                  if (val === null) return '-';
                  return item.isRatio ? `${val.toLocaleString('id-ID')}%` : val.toLocaleString('id-ID');
                };

                return (
                  <div
                    key={item.indicator}
                    className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-soft flex flex-col justify-between space-y-3 hover:border-[#C61E1E]/20 transition-all group"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate" title={item.indicator}>
                        {item.indicator}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 font-mono tracking-tight">
                        {showVal(item.currentVal)}
                      </h4>
                      <p className="text-[9px] font-semibold text-slate-400">
                        Tahun {prevYear}: {showVal(item.prevVal)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                      <span className="text-[9px] font-extrabold text-slate-400 tracking-wide uppercase">YoY</span>
                      {renderBadge(item)}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Visualizations Area */}
          <div className="w-full">

            {/* 1. NOMINAL COMPARISON */}
            {nominalComparativeData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex flex-col space-y-4 w-full">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Perbandingan Nominal YoY ({prevYear} vs {selectedYear})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Membandingkan nilai Aset, DPK, dan Kredit
                  </p>
                </div>

                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={nominalComparativeData} 
                      margin={{ top: 25, right: 10, left: 15, bottom: 5 }}
                      barGap={4}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomYoyTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 10 }} />
                      <Bar dataKey={prevYear} fill="#94A3B8" radius={[6, 6, 0, 0]} barSize={45} maxBarSize={55} />
                      <Bar dataKey={selectedYear} fill="#C61E1E" radius={[6, 6, 0, 0]} barSize={45} maxBarSize={55}>
                        <LabelList dataKey="yoyLabel" position="top" style={{ fontSize: 10, fontWeight: 800, fill: '#1E293B' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>

          {/* Info Card footer */}
          <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex gap-3">
            <Info className="text-slate-400 shrink-0" size={18} />
            <div className="space-y-1 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Aturan Perhitungan Analisis YoY:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Membandingkan posisi pada bulan yang sama antara dua tahun berurutan (misalnya Mei 2026 terhadap Mei 2025).</li>
                <li>Indikator Nominal dihitung dalam pertumbuhan persentase: <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[9px] font-mono">((Sekarang - Sebelumnya) / Sebelumnya) × 100</code>.</li>
                <li>Indikator Rasio/Persentase (NPL, LDR) dihitung menggunakan selisih absolut dalam satuan <strong className="text-slate-600">poin persentase (ppt)</strong>: <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[9px] font-mono">Sekarang - Sebelumnya</code>.</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
