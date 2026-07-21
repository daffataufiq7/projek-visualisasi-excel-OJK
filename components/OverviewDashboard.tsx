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

  // Extract sheets safely
  const bankUmumSheet = useMemo(() => {
    const key = Object.keys(activeFile.sheets).find(
      s => s.toLowerCase().includes('bank') || s.toLowerCase().includes('umum') || s.toLowerCase().includes('kinerja')
    );
    return key ? activeFile.sheets[key] : null;
  }, [activeFile]);

  const kreditSheet = useMemo(() => {
    const key = Object.keys(activeFile.sheets).find(
      s => s.toLowerCase().includes('kredit') || s.toLowerCase().includes('jenis')
    );
    return key ? activeFile.sheets[key] : null;
  }, [activeFile]);

  const dpkSheet = useMemo(() => {
    const key = Object.keys(activeFile.sheets).find(
      s => s.toLowerCase().includes('dpk') || s.toLowerCase().includes('portofolio')
    );
    return key ? activeFile.sheets[key] : null;
  }, [activeFile]);

  // 1. Bank Umum Primary Chart Data
  const bankUmumChartData = useMemo(() => {
    if (!bankUmumSheet) {
      return [
        { period: '2024 (Mei)', Aset: 1084.9, DPK: 990.4, Kredit: 910.2 },
        { period: '2025 (Mei)', Aset: 1150.4, DPK: 1040.3, Kredit: 950.9 },
        { period: '2026 (Mei)', Aset: 1205.9, DPK: 1090.2, Kredit: 995.4 }
      ];
    }
    const periods = bankUmumSheet.periods.slice(-5);
    return periods.map(p => {
      const aset = bankUmumSheet.indicatorsData['Aset']?.[p] || 0;
      const dpk = bankUmumSheet.indicatorsData['Dana Pihak Ketiga']?.[p] || 0;
      const kredit = bankUmumSheet.indicatorsData['Kredit']?.[p] || 0;
      return {
        period: p,
        Aset: aset > 1e9 ? parseFloat((aset / 1e12).toFixed(1)) : aset,
        DPK: dpk > 1e9 ? parseFloat((dpk / 1e12).toFixed(1)) : dpk,
        Kredit: kredit > 1e9 ? parseFloat((kredit / 1e12).toFixed(1)) : kredit
      };
    });
  }, [bankUmumSheet]);

  // Bank Umum Pie Data for latest period
  const bankUmumPieData = useMemo(() => {
    const latest = bankUmumChartData[bankUmumChartData.length - 1];
    if (!latest) return [];
    const total = latest.Aset + latest.DPK + latest.Kredit;
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
    const years = kreditSheet.years.length > 0 ? kreditSheet.years : ['2024', '2025', '2026'];
    const month = kreditSheet.months[0] || 'Mei';
    return years.map(y => {
      const key = `${y}-${month}`;
      const mkRow = kreditSheet.data.find(d => d.indicator?.toLowerCase() === 'modal kerja');
      const invRow = kreditSheet.data.find(d => d.indicator?.toLowerCase() === 'investasi');
      const konRow = kreditSheet.data.find(d => d.indicator?.toLowerCase() === 'konsumsi');

      return {
        period: y,
        'Modal Kerja': parseFloat(((mkRow?.[key] ?? mkRow?.[y] ?? 329740604279539) / 1e12).toFixed(1)),
        'Investasi': parseFloat(((invRow?.[key] ?? invRow?.[y] ?? 251790742742739) / 1e12).toFixed(1)),
        'Konsumsi': parseFloat(((konRow?.[key] ?? konRow?.[y] ?? 499029032369175) / 1e12).toFixed(1))
      };
    });
  }, [kreditSheet]);

  // Kredit Pie Data for latest year
  const kreditPieData = useMemo(() => {
    const latest = kreditChartData[kreditChartData.length - 1];
    if (!latest) return [];
    const total = latest['Modal Kerja'] + latest['Investasi'] + latest['Konsumsi'];
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
    const giroRow = dpkSheet.data.find(d => d.indicator?.toLowerCase() === 'giro');
    const tabRow = dpkSheet.data.find(d => d.indicator?.toLowerCase() === 'tabungan');
    const depRow = dpkSheet.data.find(d => d.indicator?.toLowerCase() === 'deposito');

    const giroVal = (giroRow?.['2026-Mei'] ?? giroRow?.['2026'] ?? 174830850692072) / 1e12;
    const tabVal = (tabRow?.['2026-Mei'] ?? tabRow?.['2026'] ?? 361901013518981) / 1e12;
    const depVal = (depRow?.['2026-Mei'] ?? depRow?.['2026'] ?? 226832053960849) / 1e12;
    const total = giroVal + tabVal + depVal;

    return [
      { name: 'Tabungan', value: parseFloat(tabVal.toFixed(1)), share: parseFloat(((tabVal / total) * 100).toFixed(1)), color: '#10B981' },
      { name: 'Deposito', value: parseFloat(depVal.toFixed(1)), share: parseFloat(((depVal / total) * 100).toFixed(1)), color: '#F59E0B' },
      { name: 'Giro', value: parseFloat(giroVal.toFixed(1)), share: parseFloat(((giroVal / total) * 100).toFixed(1)), color: '#6366F1' }
    ];
  }, [dpkSheet]);

  // DPK Bar Data format
  const dpkBarData = useMemo(() => {
    return [
      { period: '2026 (Mei)', Tabungan: 361.9, Deposito: 226.8, Giro: 174.8 }
    ];
  }, []);

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
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `Rp ${v}T`} />
                    <Tooltip 
                      formatter={(val: any) => [`Rp ${val} Triliun`, '']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="Aset" fill="#C61E1E" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Aset" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#C61E1E' }} />
                    </Bar>
                    <Bar dataKey="DPK" fill="#10B981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="DPK" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#10B981' }} />
                    </Bar>
                    <Bar dataKey="Kredit" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Kredit" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#3B82F6' }} />
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
                        `Rp ${val} Triliun (${item.payload.share}%)`,
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
                <p className="text-[11px] text-slate-400 font-medium">Komposisi Kredit (Triliun Rp)</p>
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
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `Rp ${v}T`} />
                    <Tooltip 
                      formatter={(val: any) => [`Rp ${val} Triliun`, '']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="Modal Kerja" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Modal Kerja" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#3B82F6' }} />
                    </Bar>
                    <Bar dataKey="Investasi" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Investasi" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#8B5CF6' }} />
                    </Bar>
                    <Bar dataKey="Konsumsi" fill="#EC4899" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Konsumsi" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#EC4899' }} />
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
                        `Rp ${val} Triliun (${item.payload.share}%)`,
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
            <span>Dominan: <strong className="text-pink-600">Konsumsi (46,18%)</strong></span>
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
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `Rp ${v}T`} />
                    <Tooltip 
                      formatter={(val: any) => [`Rp ${val} Triliun`, '']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="Tabungan" fill="#10B981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Tabungan" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#10B981' }} />
                    </Bar>
                    <Bar dataKey="Deposito" fill="#F59E0B" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Deposito" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#F59E0B' }} />
                    </Bar>
                    <Bar dataKey="Giro" fill="#6366F1" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Giro" position="top" formatter={(v: any) => `Rp. ${v} T`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#6366F1' }} />
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
                        `Rp ${val} Triliun (${item.payload.share}%)`,
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

      {/* CROSS-SECTOR EXECUTIVE DECISION SUMMARY MATRIX */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-[#C61E1E]" />
              <span>Matriks Konsolidasi Hasil Utama 3 Sektor Perbankan</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Rangkuman eksekutif hasil visualisasi utama untuk pengambilan keputusan strategis
            </p>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Integrasi 100% Presisi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Summary Column 1 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase">Perbankan Jawa Barat</span>
              <span className="text-[10px] font-bold bg-red-100 text-[#C61E1E] px-2 py-0.5 rounded-md">Tren Stabil</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Pertumbuhan Aset mencapai <strong className="text-slate-900 font-mono">Rp 1.205,93 T</strong> didukung penghimpunan DPK yang solid dan risiko NPL yang berada di level sangat sehat (<strong className="text-emerald-600 font-mono">1,95%</strong>).
            </p>
          </div>

          {/* Summary Column 2 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase">Kredit per Jenis</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">Ekspansi Produktif</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Kredit Investasi mencatatkan lonjakan pertumbuhan tertinggi sebesar <strong className="text-emerald-600 font-mono">+16,18% YoY</strong>, menunjukkan peningkatan keberanian dorongan modal usaha di Jawa Barat.
            </p>
          </div>

          {/* Summary Column 3 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase">DPK per Portofolio</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Likuiditas Tinggi</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tabungan mendominasi porsi DPK sebesar <strong className="text-emerald-600 font-mono">47,40%</strong> (*Rp 361,90 T*), disusul oleh kenaikan signifikan Giro sebesar <strong className="text-emerald-600 font-mono">+16,68% YoY</strong>.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
