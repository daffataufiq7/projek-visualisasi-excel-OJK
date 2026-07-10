import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  LabelList 
} from 'recharts';
import { TrendingUp, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { ActiveFile, FilterState } from '../types/dashboard';

interface YoyDashboardWidgetProps {
  activeFile: ActiveFile;
  filterState: FilterState;
}

export default function YoyDashboardWidget({ activeFile, filterState }: YoyDashboardWidgetProps) {
  const sheetNames = activeFile.sheetNames;
  const [selectedSheet, setSelectedSheet] = useState<string>(filterState.sheet || sheetNames[0]);

  // Sync selectedSheet when filterState.sheet changes
  React.useEffect(() => {
    if (filterState.sheet) {
      setSelectedSheet(filterState.sheet);
    }
  }, [filterState.sheet]);

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
  
  // Set target year when targetYears or filterState.year changes
  React.useEffect(() => {
    if (targetYears.length > 0) {
      if (filterState.year !== 'All' && targetYears.includes(filterState.year)) {
        setSelectedYear(filterState.year);
      } else {
        setSelectedYear(targetYears[targetYears.length - 1]);
      }
    } else {
      setSelectedYear('');
    }
  }, [targetYears, filterState.year]);

  const hasMonths = sheetData?.months && sheetData.months.length > 0;
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Set target month when hasMonths or filterState.month changes
  React.useEffect(() => {
    if (hasMonths && sheetData.months.length > 0) {
      if (filterState.month !== 'All' && sheetData.months.includes(filterState.month)) {
        setSelectedMonth(filterState.month);
      } else {
        setSelectedMonth(sheetData.months[sheetData.months.length - 1]);
      }
    } else {
      setSelectedMonth('');
    }
  }, [sheetData, hasMonths, filterState.month]);

  const prevYear = useMemo(() => {
    if (!selectedYear) return '';
    return String(Number(selectedYear) - 1);
  }, [selectedYear]);

  const yoyCalculations = useMemo(() => {
    if (!sheetData || !selectedYear) {
      return { available: false, chartData: [] };
    }

    const currentPeriod = hasMonths ? `${selectedYear}-${selectedMonth}` : selectedYear;
    const prevPeriod = hasMonths ? `${prevYear}-${selectedMonth}` : prevYear;

    const nominalInds = sheetData.indicators.filter(ind => !/npl|ldr|%|rasio|ratio|growth|pertumbuhan/i.test(ind));

    const chartData = nominalInds.map((ind) => {
      const currentVal = sheetData.indicatorsData[ind]?.[currentPeriod] ?? 0;
      const prevVal = sheetData.indicatorsData[ind]?.[prevPeriod] ?? 0;

      let growth = 0;
      let status: 'success' | 'failed' = 'success';
      let label = '0.00%';

      if (prevVal === 0) {
        status = 'failed';
        label = 'N/A';
      } else {
        growth = ((currentVal - prevVal) / prevVal) * 100;
        label = `${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`;
      }

      return {
        name: ind,
        growth: parseFloat(growth.toFixed(2)),
        label,
        status,
        currentVal,
        prevVal
      };
    });

    return {
      available: true,
      chartData
    };
  }, [sheetData, selectedYear, prevYear, hasMonths, selectedMonth]);

  if (!sheetData || yoyCalculations.chartData.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 w-full flex flex-col space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-50 pb-4 gap-4">
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[#C61E1E]" />
            Grafik Khusus "Pertumbuhan YoY" (Nominal)
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold">
            {selectedYear 
              ? `Pertumbuhan Nominal ${selectedYear} vs ${prevYear} ${hasMonths ? `(${selectedMonth})` : ''}`
              : 'Perbandingan pertumbuhan nominal terhadap tahun sebelumnya'
            }
          </p>
        </div>

        {/* Local Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sheet select */}
          <div className="relative min-w-[110px]">
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-600 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
            >
              {sheetNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Year select */}
          <div className="relative min-w-[90px]">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={targetYears.length === 0}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-600 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer disabled:opacity-50"
            >
              {targetYears.length === 0 ? (
                <option value="">N/A</option>
              ) : (
                targetYears.map(yr => (
                  <option key={yr} value={yr}>{yr} vs {Number(yr) - 1}</option>
                ))
              )}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Month select */}
          {hasMonths && (
            <div className="relative min-w-[80px]">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-600 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
              >
                {sheetData.months.map(mo => (
                  <option key={mo} value={mo}>{mo}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {!yoyCalculations.available ? (
        <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center">
          <AlertCircle size={24} className="text-slate-300 mb-1.5" />
          <p className="text-[11px] font-bold">Data pembanding tahun sebelumnya tidak tersedia</p>
          <p className="text-[9px] text-slate-400">Pilih tahun target lain yang memiliki tahun sebelumnya di data sheet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyCalculations.chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const row = props.payload;
                    return [
                      `${value}%`,
                      'Pertumbuhan',
                      `Prev: ${row.prevVal.toLocaleString('id-ID')} | Curr: ${row.currentVal.toLocaleString('id-ID')}`
                    ];
                  }}
                  contentStyle={{ fontSize: 10, borderRadius: 8 }}
                />
                <Bar dataKey="growth" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {yoyCalculations.chartData.map((entry, index) => {
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
          <div className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-semibold">
            <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <p>
              Nilai di atas dihitung dengan rumus persentase pertumbuhan: ((Sekarang - Sebelumnya) / Sebelumnya) × 100.
              Warna <span className="text-emerald-500 font-bold">Hijau</span> menandakan pertumbuhan positif, sedangkan warna <span className="text-red-500 font-bold">Merah</span> menandakan pertumbuhan negatif.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
