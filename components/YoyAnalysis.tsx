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

export default function YoyAnalysis({ activeFile }: YoyAnalysisProps) {
  const sheetNames = activeFile.sheetNames;
  const [selectedSheet, setSelectedSheet] = useState<string>(sheetNames[0] || '');

  const sheetData = useMemo(() => {
    return activeFile.sheets[selectedSheet];
  }, [activeFile, selectedSheet]);

  // Target years that have a previous year available in the sheet
  const targetYears = useMemo(() => {
    if (!sheetData) return [];
    return sheetData.years.filter(yr => {
      const prevYr = String(Number(yr) - 1);
      return sheetData.years.includes(prevYr);
    }).sort();
  }, [sheetData]);

  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // Set default target year when sheet changes
  React.useEffect(() => {
    if (targetYears.length > 0) {
      setSelectedYear(targetYears[targetYears.length - 1]);
    } else {
      setSelectedYear('');
    }
  }, [targetYears]);

  const hasMonths = sheetData?.months && sheetData.months.length > 0;
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Set default target month when sheet changes
  React.useEffect(() => {
    if (hasMonths && sheetData.months.length > 0) {
      setSelectedMonth(sheetData.months[0]);
    } else {
      setSelectedMonth('');
    }
  }, [sheetData, hasMonths]);

  const prevYear = useMemo(() => {
    if (!selectedYear) return '';
    return String(Number(selectedYear) - 1);
  }, [selectedYear]);

  // Calculate YoY for all indicators in the sheet
  const yoyDataList = useMemo((): YoyItem[] => {
    if (!sheetData || !selectedYear) return [];

    const indicators = sheetData.indicators;
    const result: YoyItem[] = [];

    indicators.forEach((ind) => {
      // Check if indicator is a ratio/percentage
      const isRatio = /npl|ldr|%|rasio|ratio|growth|pertumbuhan/i.test(ind);

      let currentPeriod = selectedYear;
      let prevPeriod = prevYear;

      if (hasMonths && selectedMonth) {
        currentPeriod = `${selectedYear}-${selectedMonth}`;
        prevPeriod = `${prevYear}-${selectedMonth}`;
      }

      const currentVal = sheetData.indicatorsData[ind]?.[currentPeriod];
      const prevVal = sheetData.indicatorsData[ind]?.[prevPeriod];

      if (currentVal === undefined || prevVal === undefined || prevVal === null || prevVal === 0) {
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
      } else {
        const changeVal = currentVal - prevVal;
        let pctChange = 0;

        if (isRatio) {
          // Poin persentase (ppt)
          pctChange = changeVal;
        } else {
          // Nominal percentage
          pctChange = (changeVal / prevVal) * 100;
        }

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
      }
    });

    return result;
  }, [sheetData, selectedYear, prevYear, hasMonths, selectedMonth]);

  // Separate nominal and ratio indicators for charts
  const nominalData = useMemo(() => {
    return yoyDataList.filter(item => !item.isRatio);
  }, [yoyDataList]);

  const ratioData = useMemo(() => {
    return yoyDataList.filter(item => item.isRatio);
  }, [yoyDataList]);

  // Comparative charts data
  const nominalComparativeData = useMemo(() => {
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
  }, [nominalData, prevYear, selectedYear]);

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
  const CustomYoyTooltip = ({ active, payload, label, isRatio }: any) => {
    if (active && payload && payload.length) {
      const indName = label;
      const targetItem = yoyDataList.find(d => d.indicator === indName);
      if (!targetItem) return null;

      const formatVal = (val: number | null) => {
        if (val === null) return '-';
        return isRatio ? `${val.toLocaleString('id-ID')}%` : val.toLocaleString('id-ID');
      };

      const formatChange = (val: number | null, pct: number | null) => {
        if (targetItem.status === 'failed') return 'YoY tidak dapat dihitung';
        if (val === null || pct === null) return '-';
        
        if (isRatio) {
          const sign = val > 0 ? '+' : '';
          return `${sign}${val.toFixed(2)} poin persentase (ppt)`;
        } else {
          const sign = pct > 0 ? '+' : '';
          return `${sign}${pct.toFixed(2)}% (${val > 0 ? 'Naik' : val < 0 ? 'Turun' : 'Netral'})`;
        }
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
                  {sheetData.months.map(mo => (
                    <option key={mo} value={mo}>{mo}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
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
            {yoyDataList.map((item) => {
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. NOMINAL COMPARISON */}
            {nominalComparativeData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex flex-col space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Perbandingan Nominal YoY ({prevYear} vs {selectedYear})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Membandingkan nilai Aset, DPK, dan Kredit
                  </p>
                </div>

                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nominalComparativeData} margin={{ top: 25, right: 10, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomYoyTooltip isRatio={false} />} />
                      <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700, paddingTop: 10 }} />
                      <Bar dataKey={prevYear} fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey={selectedYear} fill="#C61E1E" radius={[4, 4, 0, 0]} maxBarSize={30}>
                        <LabelList dataKey="yoyLabel" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#1E293B' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 2. RATIO COMPARISON */}
            {ratioComparativeData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex flex-col space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Perbandingan Rasio Keuangan YoY ({prevYear} vs {selectedYear})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Membandingkan rasio NPL dan LDR
                  </p>
                </div>

                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratioComparativeData} margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<CustomYoyTooltip isRatio={true} />} />
                      <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700, paddingTop: 10 }} />
                      <Bar dataKey={prevYear} fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey={selectedYear} fill="#1E293B" radius={[4, 4, 0, 0]} maxBarSize={30}>
                        <LabelList dataKey="yoyLabel" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#C61E1E' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 3. GROWTH RATE CHART (Nominal %) */}
            {nominalGrowthData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex flex-col space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Grafik Khusus "Pertumbuhan YoY" (Nominal)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Persentase Pertumbuhan Nominal Keuangan
                  </p>
                </div>

                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nominalGrowthData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Pertumbuhan']} />
                      <Bar dataKey="growth" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {nominalGrowthData.map((entry, index) => {
                          const isPositive = entry.growth > 0;
                          const isNegative = entry.growth < 0;
                          const color = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#94A3B8';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                        <LabelList dataKey="label" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 4. POINT CHANGE CHART (Ratio ppt) */}
            {ratioGrowthData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex flex-col space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Grafik Khusus "Perubahan YoY" (Rasio/Persentase)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Kenaikan/Penurunan Poin Persentase (ppt)
                  </p>
                </div>

                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratioGrowthData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} ppt`} />
                      <Tooltip formatter={(value) => [`${value} ppt`, 'Perubahan']} />
                      <Bar dataKey="change" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {ratioGrowthData.map((entry, index) => {
                          const isPositive = entry.change > 0;
                          const isNegative = entry.change < 0;
                          const color = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#94A3B8';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                        <LabelList dataKey="label" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} />
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
