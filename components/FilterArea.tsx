import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, BarChart, X, Check } from 'lucide-react';
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
  onApplyFilters,
  onSheetChange
}: FilterAreaProps) {
  const [yDropdownOpen, setYDropdownOpen] = useState(false);
  const yDropdownRef = useRef<HTMLDivElement>(null);

  const activeSheetData = activeFile.sheets[filterState.sheet] || activeFile.sheets[activeFile.activeSheetName];
  
  const columns = activeSheetData?.columns || [];
  const numericColumns = activeSheetData?.numericColumns || [];
  const years = ['All', ...(activeSheetData?.years || [])];
  const months = ['All', ...(activeSheetData?.months || [])];

  // Close multi-select dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (yDropdownRef.current && !yDropdownRef.current.contains(event.target as Node)) {
        setYDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYToggle = (columnName: string) => {
    const isSelected = filterState.yAxis.includes(columnName);
    let newY: string[];
    if (isSelected) {
      newY = filterState.yAxis.filter(item => item !== columnName);
    } else {
      newY = [...filterState.yAxis, columnName];
    }
    onFilterChange({ yAxis: newY });
  };

  const handleYRemove = (e: React.MouseEvent, columnName: string) => {
    e.stopPropagation();
    onFilterChange({
      yAxis: filterState.yAxis.filter(item => item !== columnName)
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* 1. Pilih Sheet */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Pilih Sheet</label>
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

        {/* 2. Pilih Sumbu X */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Pilih Sumbu X</label>
          <div className="relative">
            <select
              value={filterState.xAxis}
              onChange={(e) => onFilterChange({ xAxis: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
            >
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 3. Pilih Nilai (Sumbu Y) - Custom Multi-select */}
        <div className="flex flex-col space-y-1.5 relative" ref={yDropdownRef}>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">3. Pilih Nilai (Sumbu Y)</label>
          <div 
            onClick={() => setYDropdownOpen(!yDropdownOpen)}
            className="w-full min-h-[42px] bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-[#C61E1E] focus-within:border-[#C61E1E]"
          >
            <div className="flex flex-wrap gap-1 items-center">
              {filterState.yAxis.length === 0 ? (
                <span className="text-xs text-slate-400 font-medium pl-1">Pilih kolom</span>
              ) : (
                filterState.yAxis.map((col) => (
                  <span 
                    key={col} 
                    className="inline-flex items-center gap-1 bg-white border border-red-100 text-[#C61E1E] pl-2 pr-1 py-0.5 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                  >
                    <span className="truncate max-w-[80px]">{col}</span>
                    <button 
                      onClick={(e) => handleYRemove(e, col)}
                      className="hover:bg-red-50 p-0.5 rounded text-[#C61E1E]"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-2" />
          </div>

          {/* Y Axis Select Dropdown Panel */}
          {yDropdownOpen && (
            <div className="absolute left-0 right-0 top-[102%] bg-white border border-slate-100 rounded-xl shadow-premium z-30 p-2 max-h-56 overflow-y-auto">
              {columns.length === 0 ? (
                <div className="text-[11px] font-medium text-slate-400 text-center py-4">Tidak ada kolom di sheet ini</div>
              ) : (
                columns.map((col) => {
                  const isChecked = filterState.yAxis.includes(col);
                  return (
                    <div
                      key={col}
                      onClick={() => handleYToggle(col)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-red-50/50 text-[#C61E1E]' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate pr-2">{col}</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-[#C61E1E] border-[#C61E1E] text-white' : 'border-slate-300'
                      }`}>
                        {isChecked && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 4. Pilih Jenis Grafik */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">4. Pilih Jenis Grafik</label>
          <div className="relative">
            <select
              value={filterState.chartType}
              onChange={(e) => onFilterChange({ chartType: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="horizontal_bar">Horizontal Bar</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 2: Date Filters & Action Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-4 pt-4 border-t border-slate-50">
        {/* Filter Tahun */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filter Tahun</label>
          <div className="relative">
            <select
              value={filterState.year}
              onChange={(e) => onFilterChange({ year: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Filter Bulan */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filter Bulan</label>
          <div className="relative">
            <select
              value={filterState.month}
              onChange={(e) => onFilterChange({ month: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#C61E1E] focus:border-[#C61E1E] cursor-pointer"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onApplyFilters}
          className="w-full bg-[#C61E1E] hover:bg-[#A31818] active:scale-[0.99] text-white rounded-xl py-3 px-6 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-red-950/15"
        >
          <BarChart size={16} />
          Tampilkan Visualisasi
        </button>
      </div>
    </div>
  );
}
