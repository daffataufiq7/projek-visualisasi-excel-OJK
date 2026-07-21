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

  // All available years in the sheet sorted ascending
  const targetYears = useMemo(() => {
    if (!sheetData) return [];
    const validYears = sheetData.years.filter(yr => yr && yr !== 'All' && /^\d{4}$/.test(yr)).sort();
    return validYears.length > 0 ? validYears : sheetData.years.filter(yr => yr && yr !== 'All').sort();
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

  // Previous comparison year: either selectedYear - 1, or previous year in targetYears array
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
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Preserve selected month if valid in availableYoyMonths; otherwise default to latest available month
  React.useEffect(() => {
    if (availableYoyMonths.length > 0) {
      if (!selectedMonth || !availableYoyMonths.includes(selectedMonth)) {
        if (filterState.month !== 'All' && availableYoyMonths.includes(filterState.month)) {
          setSelectedMonth(filterState.month);
        } else {
          setSelectedMonth(availableYoyMonths[availableYoyMonths.length - 1]);
        }
      }
    } else {
      setSelectedMonth('');
    }
  }, [availableYoyMonths, filterState.month, selectedMonth]);



  const yoyCalculations = useMemo(() => {
    if (!sheetData) {
      return { available: false, chartData: [] };
    }

    // Non-YOY data periods (exclude meta-columns)
    const dataPeriods = sheetData.periods.filter(p => p !== 'YOY' && p !== 'SHARE');

    const currentPeriod = hasMonths && selectedMonth && selectedYear
      ? `${selectedYear}-${selectedMonth}`
      : selectedYear || '';
    const prevPeriod = hasMonths && selectedMonth && prevYear
      ? `${prevYear}-${selectedMonth}`
      : prevYear || '';

    const nominalInds = sheetData.indicators.filter(ind => !/npl|ldr|%|rasio|ratio|growth|pertumbuhan/i.test(ind));

    const chartData = nominalInds.map((ind) => {
      // Current val: prefer selected period, fallback to last data period
      let currentVal: number = 0;
      if (currentPeriod && sheetData.indicatorsData[ind]?.[currentPeriod] !== undefined) {
        currentVal = sheetData.indicatorsData[ind][currentPeriod];
      } else if (dataPeriods.length > 0) {
        currentVal = sheetData.indicatorsData[ind]?.[dataPeriods[dataPeriods.length - 1]] ?? 0;
      }

      // Prev val: prefer selected prev period, fallback to first data period
      let prevVal: number = 0;
      if (prevPeriod && sheetData.indicatorsData[ind]?.[prevPeriod] !== undefined) {
        prevVal = sheetData.indicatorsData[ind][prevPeriod];
      } else if (dataPeriods.length > 1) {
        prevVal = sheetData.indicatorsData[ind]?.[dataPeriods[0]] ?? 0;
      }

      let growth = 0;
      let status: 'success' | 'failed' = 'success';
      let label = '0.00%';
      let calculated = false;

      // Step 1: Always read explicit YOY column first
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
      // Fallback explicit YOY from grid row
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

      // Step 2: Calculate from period data if both periods differ and prevVal is non-zero
      if (prevVal !== 0 && currentPeriod !== prevPeriod && currentPeriod !== '' && prevPeriod !== '') {
        growth = ((currentVal - prevVal) / prevVal) * 100;
        label = `${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`;
        calculated = true;
      }

      // Step 3: Use explicit YOY as fallback
      if (!calculated && explicitYoyPct !== null) {
        growth = explicitYoyPct;
        label = `${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`;
        calculated = true;
      }

      if (!calculated) {
        status = 'failed';
        label = 'N/A';
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
                {availableYoyMonths.map(mo => (
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
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyCalculations.chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} />
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
                <Bar dataKey="growth" radius={[6, 6, 0, 0]} barSize={42} maxBarSize={50}>
                  {yoyCalculations.chartData.map((entry, index) => {
                    const isPositive = entry.growth > 0;
                    const isNegative = entry.growth < 0;
                    const color = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#94A3B8';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                  <LabelList dataKey="label" position="top" style={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} />
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
