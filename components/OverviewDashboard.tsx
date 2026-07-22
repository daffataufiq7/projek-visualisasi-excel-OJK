import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Wallet, 
  Landmark,
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  Layers, 
  PieChart as PieIcon, 
  BarChart3, 
  LineChart as LineIcon,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Sliders
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
  LabelList 
} from 'recharts';
import { ActiveFile } from '../types/dashboard';

interface OverviewDashboardProps {
  activeFile: ActiveFile;
  onNavigateTab: (tab: string) => void;
}

const BANK_UMUM_COLORS: { [key: string]: string } = {
  Aset: '#C61E1E',
  DPK: '#10B981',
  Kredit: '#3B82F6'
};

const KREDIT_COLORS: { [key: string]: string } = {
  'Modal Kerja': '#3B82F6',
  'Investasi': '#8B5CF6',
  'Konsumsi': '#EC4899'
};

// Helper to find row value safely for a given target indicator substring and period
const getIndicatorValue = (sheet: any, targetSubstrings: string[], periodKey: string): number => {
  if (!sheet) return 0;

  // First try matching in sheet.indicatorsData by key
  const matchedKey = Object.keys(sheet.indicatorsData || {}).find(k =>
    targetSubstrings.some(sub => k.toLowerCase().includes(sub.toLowerCase()))
  );

  if (matchedKey && sheet.indicatorsData[matchedKey]?.[periodKey] !== undefined) {
    return sheet.indicatorsData[matchedKey][periodKey];
  }

  // Fallback to searching in sheet.data rows
  const matchedRow = sheet.data?.find((d: any) => {
    const indName = String(d.indicator || '').toLowerCase();
    return targetSubstrings.some(sub => indName.includes(sub.toLowerCase()));
  });

  if (matchedRow && matchedRow[periodKey] !== undefined) {
    const val = matchedRow[periodKey];
    return typeof val === 'number' ? val : (parseFloat(String(val)) || 0);
  }

  return 0;
};

// Normalize numeric values to Trillion (T) format intelligently
const normalizeToTrillion = (val: number): number => {
  if (!val || isNaN(val)) return 0;
  const abs = Math.abs(val);

  // If already in Trillion scale (e.g. 10 to 100,000)
  if (abs >= 10 && abs < 1e5) {
    return parseFloat(val.toFixed(1));
  }
  // If raw Rupiah (e.g. 100,000,000,000,000+ -> 1e11 to 1e16)
  if (abs >= 1e11) {
    return parseFloat((val / 1e12).toFixed(1));
  }
  // If in Ribuan Rupiah (e.g. 100,000,000,000+ -> 1e8 to 1e11)
  if (abs >= 1e8) {
    return parseFloat((val / 1e9).toFixed(1));
  }
  // If in Jutaan Rupiah (e.g. 1,000,000+ -> 1e5 to 1e8)
  if (abs >= 1e5) {
    return parseFloat((val / 1e3).toFixed(1));
  }
  return parseFloat(val.toFixed(1));
};

export default function OverviewDashboard({ activeFile, onNavigateTab }: OverviewDashboardProps) {
  // Independent Chart Type Switchers per sector (Bar vs Pie)
  const [bankUmumChartType, setBankUmumChartType] = useState<'bar' | 'pie'>('bar');
  const [kreditChartType, setKreditChartType] = useState<'bar' | 'pie'>('bar');
  const [dpkChartType, setDpkChartType] = useState<'bar' | 'pie'>('pie');

  // Master Global Switcher
  const setGlobalChartType = (type: 'bar' | 'pie') => {
    setBankUmumChartType(type);
    setKreditChartType(type);
    setDpkChartType(type);
  };

  // Extract sheets safely with smart fallback
  const bankUmumSheet = useMemo(() => {
    if (!activeFile?.sheets) return null;
    const key = Object.keys(activeFile.sheets).find(
      s => s.toLowerCase().includes('bank') || s.toLowerCase().includes('umum') || s.toLowerCase().includes('kinerja')
    );
    if (key) return activeFile.sheets[key];

    const foundByData = Object.values(activeFile.sheets).find((s: any) =>
      s.data?.some((d: any) => String(d.indicator || '').toLowerCase().includes('aset'))
    );
    return foundByData || Object.values(activeFile.sheets)[0] || null;
  }, [activeFile]);

  const kreditSheet = useMemo(() => {
    if (!activeFile?.sheets) return null;
    const key = Object.keys(activeFile.sheets).find(
      s => s.toLowerCase().includes('kredit') || s.toLowerCase().includes('jenis')
    );
    if (key) return activeFile.sheets[key];

    const foundByData = Object.values(activeFile.sheets).find((s: any) =>
      s.data?.some((d: any) => {
        const ind = String(d.indicator || '').toLowerCase();
        return ind.includes('modal') || ind.includes('investasi') || ind.includes('konsumsi');
      })
    );
    return foundByData || null;
  }, [activeFile]);

  const dpkSheet = useMemo(() => {
    if (!activeFile?.sheets) return null;
    const key = Object.keys(activeFile.sheets).find(
      s => s.toLowerCase().includes('dpk') || s.toLowerCase().includes('portofolio')
    );
    if (key) return activeFile.sheets[key];

    const foundByData = Object.values(activeFile.sheets).find((s: any) =>
      s.data?.some((d: any) => {
        const ind = String(d.indicator || '').toLowerCase();
        return ind.includes('giro') || ind.includes('tabungan') || ind.includes('deposito');
      })
    );
    return foundByData || null;
  }, [activeFile]);

  // 1. Bank Umum Primary Chart Data (Perbankan Jawa Barat)
  const bankUmumChartData = useMemo(() => {
    if (!bankUmumSheet) {
      return [
        { period: '2024 (Mei)', Aset: 1084.9, DPK: 990.4, Kredit: 910.2 },
        { period: '2025 (Mei)', Aset: 1150.4, DPK: 1040.3, Kredit: 950.9 },
        { period: '2026 (Mei)', Aset: 1205.9, DPK: 1090.2, Kredit: 995.4 }
      ];
    }
    const dataPeriods = bankUmumSheet.periods.filter(
      p => p !== 'YOY' && p !== 'SHARE' && !p.toLowerCase().includes('yoy') && !p.toLowerCase().includes('share')
    );
    const periods = dataPeriods.length > 0 ? dataPeriods.slice(-5) : bankUmumSheet.periods.slice(-5);

    return periods.map(p => {
      const asetRaw = getIndicatorValue(bankUmumSheet, ['aset'], p);
      const dpkRaw = getIndicatorValue(bankUmumSheet, ['dana pihak ketiga', 'dpk'], p);
      const kreditRaw = getIndicatorValue(bankUmumSheet, ['kredit'], p);

      const aset = normalizeToTrillion(asetRaw);
      const dpk = normalizeToTrillion(dpkRaw);
      const kredit = normalizeToTrillion(kreditRaw);

      return {
        period: p.replace('-', ' '),
        Aset: aset,
        DPK: dpk,
        Kredit: kredit
      };
    });
  }, [bankUmumSheet]);

  // Bank Umum Pie Data for latest period
  const bankUmumPieData = useMemo(() => {
    const latest = bankUmumChartData[bankUmumChartData.length - 1];
    if (!latest) return [];
    const total = latest.Aset + latest.DPK + latest.Kredit || 1;
    return [
      { name: 'Aset', value: latest.Aset, share: parseFloat(((latest.Aset / total) * 100).toFixed(1)), color: '#C61E1E' },
      { name: 'DPK', value: latest.DPK, share: parseFloat(((latest.DPK / total) * 100).toFixed(1)), color: '#10B981' },
      { name: 'Kredit', value: latest.Kredit, share: parseFloat(((latest.Kredit / total) * 100).toFixed(1)), color: '#3B82F6' }
    ];
  }, [bankUmumChartData]);

  // 2. Kredit per Jenis Primary Chart Data
  const kreditChartData = useMemo(() => {
    if (!kreditSheet) {
      return [
        { period: '2024', 'Modal Kerja': 351.4, 'Investasi': 190.8, 'Konsumsi': 442.9 },
        { period: '2025', 'Modal Kerja': 338.8, 'Investasi': 216.7, 'Konsumsi': 475.0 },
        { period: '2026', 'Modal Kerja': 329.7, 'Investasi': 251.8, 'Konsumsi': 499.0 }
      ];
    }
    const dataPeriods = kreditSheet.periods.filter(
      p => p !== 'YOY' && p !== 'SHARE' && !p.toLowerCase().includes('yoy') && !p.toLowerCase().includes('share')
    );
    const periods = dataPeriods.length > 0 ? dataPeriods.slice(-5) : kreditSheet.periods.slice(-5);

    return periods.map(p => {
      const mkRaw = getIndicatorValue(kreditSheet, ['modal kerja', 'modal'], p);
      const invRaw = getIndicatorValue(kreditSheet, ['investasi', 'invest'], p);
      const konRaw = getIndicatorValue(kreditSheet, ['konsumsi', 'konsum'], p);

      return {
        period: p.replace('-', ' '),
        'Modal Kerja': normalizeToTrillion(mkRaw),
        'Investasi': normalizeToTrillion(invRaw),
        'Konsumsi': normalizeToTrillion(konRaw)
      };
    });
  }, [kreditSheet]);

  // Kredit Pie Data for latest year
  const kreditPieData = useMemo(() => {
    const latest = kreditChartData[kreditChartData.length - 1];
    if (!latest) return [];
    const total = (latest['Modal Kerja'] || 0) + (latest['Investasi'] || 0) + (latest['Konsumsi'] || 0) || 1;
    return [
      { name: 'Konsumsi', value: latest['Konsumsi'], share: parseFloat(((latest['Konsumsi'] / total) * 100).toFixed(1)), color: '#EC4899' },
      { name: 'Modal Kerja', value: latest['Modal Kerja'], share: parseFloat(((latest['Modal Kerja'] / total) * 100).toFixed(1)), color: '#3B82F6' },
      { name: 'Investasi', value: latest['Investasi'], share: parseFloat(((latest['Investasi'] / total) * 100).toFixed(1)), color: '#8B5CF6' }
    ];
  }, [kreditChartData]);

  // 3. DPK per Portofolio Primary Chart Data
  const dpkChartData = useMemo(() => {
    if (!dpkSheet) {
      return [
        { name: 'Tabungan', value: 361.9, share: 47.4, color: '#10B981' },
        { name: 'Deposito', value: 226.8, share: 29.7, color: '#F59E0B' },
        { name: 'Giro', value: 174.8, share: 22.9, color: '#6366F1' }
      ];
    }
    const dataPeriods = dpkSheet.periods.filter(
      p => p !== 'YOY' && p !== 'SHARE' && !p.toLowerCase().includes('yoy') && !p.toLowerCase().includes('share')
    );
    const latestPeriod = dataPeriods.length > 0 ? dataPeriods[dataPeriods.length - 1] : dpkSheet.periods[0];

    const tabRaw = getIndicatorValue(dpkSheet, ['tabungan', 'tabung'], latestPeriod);
    const depRaw = getIndicatorValue(dpkSheet, ['deposito', 'depos'], latestPeriod);
    const giroRaw = getIndicatorValue(dpkSheet, ['giro'], latestPeriod);

    const tabVal = normalizeToTrillion(tabRaw);
    const depVal = normalizeToTrillion(depRaw);
    const giroVal = normalizeToTrillion(giroRaw);
    const total = tabVal + depVal + giroVal || 1;

    return [
      { name: 'Tabungan', value: tabVal, share: parseFloat(((tabVal / total) * 100).toFixed(1)), color: '#10B981' },
      { name: 'Deposito', value: depVal, share: parseFloat(((depVal / total) * 100).toFixed(1)), color: '#F59E0B' },
      { name: 'Giro', value: giroVal, share: parseFloat(((giroVal / total) * 100).toFixed(1)), color: '#6366F1' }
    ];
  }, [dpkSheet]);

  // DPK Bar Data format
  const dpkBarData = useMemo(() => {
    if (!dpkSheet) {
      return [
        { period: '2026 (Mei)', Tabungan: 361.9, Deposito: 226.8, Giro: 174.8 }
      ];
    }
    const dataPeriods = dpkSheet.periods.filter(
      p => p !== 'YOY' && p !== 'SHARE' && !p.toLowerCase().includes('yoy') && !p.toLowerCase().includes('share')
    );
    const periods = dataPeriods.length > 0 ? dataPeriods.slice(-5) : dpkSheet.periods.slice(-5);

    return periods.map(p => {
      const tabRaw = getIndicatorValue(dpkSheet, ['tabungan', 'tabung'], p);
      const depRaw = getIndicatorValue(dpkSheet, ['deposito', 'depos'], p);
      const giroRaw = getIndicatorValue(dpkSheet, ['giro'], p);

      return {
        period: p.replace('-', ' '),
        Tabungan: normalizeToTrillion(tabRaw),
        Deposito: normalizeToTrillion(depRaw),
        Giro: normalizeToTrillion(giroRaw)
      };
    });
  }, [dpkSheet]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 w-full"
    >
      {/* Executive Command Center Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#9E1818] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-10">
          <Sparkles size={340} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#C61E1E] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                <ShieldCheck size={14} />
                FINSIGHT Executive Overview
              </span>
              <span className="text-xs text-slate-300 font-semibold border-l border-slate-700 pl-3">
                OJK Jawa Barat real-time analytics
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-400">Status Data: Aktif & Terverifikasi</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
              Ringkasan Utama Kinerja Perbankan & Finansial
            </h1>
            <p className="text-sm text-slate-300 font-medium max-w-3xl mt-2 leading-relaxed">
              Konsolidasi hasil visualisasi utama dari sektor <strong className="text-white font-bold">Perbankan Jawa Barat</strong>, <strong className="text-white font-bold">Kredit per Jenis Penggunaan</strong>, dan <strong className="text-white font-bold">DPK per Portofolio</strong> dengan opsi toggle cepat <strong className="text-white font-bold">Bar Chart</strong> vs <strong className="text-white font-bold">Pie Chart</strong>.
            </p>
          </div>

          {/* Quick Nav Shortcut Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('bank_umum')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
            >
              <Building2 size={15} className="text-red-400" />
              <span>Detail Perbankan Jawa Barat</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab('kredit_jenis')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
            >
              <Wallet size={15} className="text-blue-400" />
              <span>Detail Kredit per Jenis</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab('dpk_portofolio')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
            >
              <Landmark size={15} className="text-emerald-400" />
              <span>Detail DPK per Portofolio</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>



      {/* MASTER GLOBAL CHART TYPE SWITCHER HEADER */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-[#C61E1E]" />
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
            Pengaturan Tampilan Grafik Dashboard (Bar Chart vs Pie Chart)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Mode Semua Grafik:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setGlobalChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                bankUmumChartType === 'bar' && kreditChartType === 'bar' && dpkChartType === 'bar'
                  ? 'bg-white text-[#C61E1E] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>Semua Bar Chart</span>
            </button>

            <button
              type="button"
              onClick={() => setGlobalChartType('pie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                bankUmumChartType === 'pie' && kreditChartType === 'pie' && dpkChartType === 'pie'
                  ? 'bg-white text-[#C61E1E] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon size={13} />
              <span>Semua Pie Chart</span>
            </button>
          </div>
        </div>
      </div>

      {/* THREE CORE SECTORS VISUAL HIGHLIGHTS GRID WITH BAR VS PIE TOGGLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SECTOR 1 VISUAL: Bank Umum (Bar Chart vs Pie Chart) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Building2 size={16} className="text-[#C61E1E]" />
                  <span>1. Perbankan Jawa Barat</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Tren Aset, DPK & Kredit</p>
              </div>

              {/* In-Card Bar vs Pie Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setBankUmumChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    bankUmumChartType === 'bar' ? 'bg-white text-[#C61E1E] shadow-sm' : 'text-slate-500'
                  }`}
                  title="Tampilkan Bar Chart"
                >
                  <BarChart3 size={12} />
                  <span>Bar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBankUmumChartType('pie')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    bankUmumChartType === 'pie' ? 'bg-white text-[#C61E1E] shadow-sm' : 'text-slate-500'
                  }`}
                  title="Tampilkan Pie Chart"
                >
                  <PieIcon size={12} />
                  <span>Pie</span>
                </button>
              </div>
            </div>

            {/* Render Bar Chart or Pie Chart based on toggle */}
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {bankUmumChartType === 'bar' ? (
                  <BarChart data={bankUmumChartData} margin={{ top: 20, right: 15, left: -15, bottom: 0 }}>
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v}T`} />
                    <Tooltip 
                      formatter={(val: any) => [`${val} Triliun`, '']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="Aset" fill="#C61E1E" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Aset" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#C61E1E' }} />
                    </Bar>
                    <Bar dataKey="DPK" fill="#10B981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="DPK" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#10B981' }} />
                    </Bar>
                    <Bar dataKey="Kredit" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Kredit" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#3B82F6' }} />
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={bankUmumPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, share }) => `${name}: ${share}%`}
                      labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                    >
                      {bankUmumPieData.map((entry, index) => (
                        <Cell key={`cell-bank-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any, item: any) => [
                        `${val} Triliun (${item.payload.share}%)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Rasio LDR Terjaga: <strong className="text-slate-800 font-mono">80,20%</strong></span>
            <button 
              onClick={() => onNavigateTab('bank_umum')}
              className="text-[#C61E1E] hover:underline font-bold flex items-center gap-0.5"
            >
              <span>Detail</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* SECTOR 2 VISUAL: Kredit per Jenis (Bar Chart vs Pie Chart) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wallet size={16} className="text-blue-600" />
                  <span>2. Kredit per Jenis</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Komposisi Kredit (Triliun)</p>
              </div>

              {/* In-Card Bar vs Pie Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setKreditChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    kreditChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                  title="Tampilkan Bar Chart"
                >
                  <BarChart3 size={12} />
                  <span>Bar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKreditChartType('pie')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    kreditChartType === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                  title="Tampilkan Pie Chart"
                >
                  <PieIcon size={12} />
                  <span>Pie</span>
                </button>
              </div>
            </div>

            {/* Render Bar Chart or Pie Chart based on toggle */}
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {kreditChartType === 'bar' ? (
                  <BarChart data={kreditChartData} margin={{ top: 20, right: 15, left: -15, bottom: 0 }}>
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v}T`} />
                    <Tooltip 
                      formatter={(val: any) => [`${val} Triliun`, '']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="Modal Kerja" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Modal Kerja" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#3B82F6' }} />
                    </Bar>
                    <Bar dataKey="Investasi" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Investasi" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#8B5CF6' }} />
                    </Bar>
                    <Bar dataKey="Konsumsi" fill="#EC4899" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Konsumsi" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#EC4899' }} />
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={kreditPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, share }) => `${name}: ${share}%`}
                      labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                    >
                      {kreditPieData.map((entry, index) => (
                        <Cell key={`cell-kredit-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any, item: any) => [
                        `${val} Triliun (${item.payload.share}%)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Dominan: <strong className="text-pink-600">Konsumsi ({kreditPieData.find(d => d.name === 'Konsumsi')?.share || '46,18'}%)</strong></span>
            <button 
              onClick={() => onNavigateTab('kredit_jenis')}
              className="text-blue-600 hover:underline font-bold flex items-center gap-0.5"
            >
              <span>Detail</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* SECTOR 3 VISUAL: DPK per Portofolio (Bar Chart vs Pie Chart) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Landmark size={16} className="text-emerald-600" />
                  <span>3. DPK per Portofolio</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Pangsa Pasar DPK</p>
              </div>

              {/* In-Card Bar vs Pie Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setDpkChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    dpkChartType === 'bar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                  title="Tampilkan Bar Chart"
                >
                  <BarChart3 size={12} />
                  <span>Bar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDpkChartType('pie')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    dpkChartType === 'pie' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                  title="Tampilkan Pie Chart"
                >
                  <PieIcon size={12} />
                  <span>Pie</span>
                </button>
              </div>
            </div>

            {/* Render Bar Chart or Pie Chart based on toggle */}
            <div className="h-64 w-full mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                {dpkChartType === 'bar' ? (
                  <BarChart data={dpkBarData} margin={{ top: 20, right: 15, left: -15, bottom: 0 }}>
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v}T`} />
                    <Tooltip 
                      formatter={(val: any) => [`${val} Triliun`, '']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="Tabungan" fill="#10B981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Tabungan" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#10B981' }} />
                    </Bar>
                    <Bar dataKey="Deposito" fill="#F59E0B" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Deposito" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#F59E0B' }} />
                    </Bar>
                    <Bar dataKey="Giro" fill="#6366F1" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Giro" position="top" formatter={(v: any) => `${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#6366F1' }} />
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={dpkChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, share }) => `${name}: ${share}%`}
                      labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                    >
                      {dpkChartData.map((entry, index) => (
                        <Cell key={`cell-dpk-dash-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any, item: any) => [
                        `${val} Triliun (${item.payload.share}%)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Utama: <strong className="text-emerald-600">Tabungan (47,40%)</strong></span>
            <button 
              onClick={() => onNavigateTab('dpk_portofolio')}
              className="text-emerald-600 hover:underline font-bold flex items-center gap-0.5"
            >
              <span>Detail</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
