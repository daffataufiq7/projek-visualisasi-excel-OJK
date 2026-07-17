import React from 'react';
import { ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { ActiveFile, FilterState } from '../types/dashboard';

interface FilterAreaProps {
  activeFile: ActiveFile;
  filterState: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onApplyFilters: () => void;
  onSheetChange: (sheetName: string) => void;
}

export default function FilterArea({
  activeFile,
  filterState,
  onFilterChange,
  onSheetChange
}: FilterAreaProps) {
  const activeSheetData = activeFile.sheets[filterState.sheet] || activeFile.sheets[activeFile.activeSheetName];

  const indicators = activeSheetData?.indicators || [];
  const years = ['All', ...(activeSheetData?.years || [])];
  const months = ['All', ...(activeSheetData?.months || [])];

  const handleIndicatorToggle = (indName: string) => {
    const isSelected = filterState.yAxis.includes(indName);
    let newY: string[];
    if (isSelected) {
      newY = filterState.yAxis.filter(item => item !== indName);
    } else {
      newY = [...filterState.yAxis, indName];
    }
    onFilterChange({ yAxis: newY });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 w-full space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <SlidersHorizontal size={16} className="text-[#C61E1E]" />
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Filter Analisis Data Keuangan
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* 1. Pilih Sheet */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Sektor / Kategori Sheet</label>
          <div className="relative">
            <select
              value={filterState.sheet}
              onChange={(e) => onSheetChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
            >
              {activeFile.sheetNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 2. Pilih Tahun */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Rentang Tahun</label>
          <div className="relative">
            <select
              value={filterState.year}
              onChange={(e) => onFilterChange({ year: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y === 'All' ? 'Semua Tahun (Tren)' : y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 3. Pilih Bulan */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">3. Periode Bulan</label>
          <div className="relative">
            <select
              value={filterState.month}
              onChange={(e) => onFilterChange({ month: e.target.value })}
              disabled={activeSheetData?.months?.length === 0}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {activeSheetData?.months?.length === 0 ? (
                <option value="All">Tidak ada bulan (Tahunan)</option>
              ) : (
                months.map((m) => (
                  <option key={m} value={m}>{m === 'All' ? 'Semua Bulan' : m}</option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 4. Tipe Grafik */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">4. Jenis Grafik</label>
          <div className="relative">
            <select
              value={filterState.chartType}
              onChange={(e) => onFilterChange({ chartType: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
            >
              <option value="line">Line Chart (Tren Garis)</option>
              <option value="bar">Bar Chart (Batang Tegak)</option>
              <option value="area">Area Chart (Daerah Terisi)</option>
              <option value="pie">Pie Chart (Persentase Porsi)</option>
              <option value="horizontal_bar">Ranked Bar Chart (Batang Mendatar)</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 5. Overlay Rasio */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">5. Overlay Rasio</label>
          <div className="flex items-center h-full">
            <label className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors w-full select-none">
              <input
                type="checkbox"
                checked={filterState.overlayRatio || false}
                onChange={(e) => onFilterChange({ overlayRatio: e.target.checked })}
                className="rounded border-slate-300 text-[#C61E1E] focus:ring-[#C61E1E] w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600">Aktifkan Overlay Rasio (%)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Multi-Select Indicators Section */}
      <div className="flex flex-col space-y-2 border-t border-slate-50 pt-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          6. Pilih Indikator Keuangan (Multi-select)
        </span>
        <div className="flex flex-wrap gap-2.5">
          {indicators.map((ind) => {
            const isChecked = filterState.yAxis.includes(ind);
            return (
              <button
                key={ind}
                type="button"
                onClick={() => handleIndicatorToggle(ind)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${isChecked
                    ? 'bg-[#C61E1E] text-white border-[#C61E1E] shadow-sm shadow-red-900/10'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
              >
                {isChecked && <Check size={12} strokeWidth={3} />}
                <span>{ind}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 font-semibold italic">
          *Pilih beberapa indikator untuk membandingkan nilainya dalam satu grafik.
        </p>
      </div>
    </div>
  );
}
