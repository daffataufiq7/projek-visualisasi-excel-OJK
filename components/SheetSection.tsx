import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BarChart3, Database, FileSpreadsheet, Eye } from 'lucide-react';
import { ActiveFile, SheetData } from '../types/dashboard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SheetSectionProps {
  activeFile: ActiveFile;
  onActivateSheet: (sheetName: string) => void;
}

export default function SheetSection({ activeFile, onActivateSheet }: SheetSectionProps) {
  const [expandedSheets, setExpandedSheets] = useState<{ [key: string]: boolean }>({
    [activeFile.sheetNames[0] || '']: true
  });

  const toggleExpand = (sheetName: string) => {
    setExpandedSheets(prev => ({
      ...prev,
      [sheetName]: !prev[sheetName]
    }));
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <FileSpreadsheet size={16} className="text-[#C61E1E]" />
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Rincian Per Sheet ({activeFile.sheetNames.length} Terdeteksi)
        </h3>
      </div>

      <div className="space-y-3">
        {activeFile.sheetNames.map((sheetName) => {
          const sheetData = activeFile.sheets[sheetName];
          const isExpanded = !!expandedSheets[sheetName];
          
          if (!sheetData || sheetData.indicators.length === 0) return null;

          // Local preview chart for the first indicator of the sheet over time
          const firstIndicator = sheetData.indicators[0];
          const previewChartData = sheetData.periods.map(period => ({
            period,
            value: sheetData.indicatorsData[firstIndicator]?.[period] ?? 0
          }));

          return (
            <div 
              key={sheetName}
              className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden"
            >
              {/* Accordion Header */}
              <div 
                onClick={() => toggleExpand(sheetName)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black tracking-wider text-slate-800 uppercase">
                    {sheetName}
                  </span>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                      <Database size={10} />
                      {sheetData.indicators.length} Indikator
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                      <BarChart3 size={10} />
                      {sheetData.periods.length} Periode
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onActivateSheet(sheetName);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-red-50 text-[#C61E1E] hover:bg-[#C61E1E] hover:text-white rounded-lg transition-all"
                  >
                    <Eye size={12} />
                    Fokus Dashboard
                  </button>
                  <div className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-slate-50"
                  >
                    <div className="p-5 space-y-4">
                      {/* Local Sheet Statistics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                            Daftar Indikator
                          </span>
                          <p className="text-xs font-bold text-slate-700 mt-1 truncate" title={sheetData.indicators.join(', ')}>
                            {sheetData.indicators.slice(0, 3).join(', ') + (sheetData.indicators.length > 3 ? '...' : '')}
                          </p>
                        </div>
                        <div className="bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                            Rentang Periode
                          </span>
                          <p className="text-xs font-bold text-slate-700 mt-1 truncate" title={sheetData.periods.join(', ')}>
                            {sheetData.periods.slice(0, 3).join(', ') + (sheetData.periods.length > 3 ? '...' : '')}
                          </p>
                        </div>
                        <div className="bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                            Tahun Tercover
                          </span>
                          <p className="text-xs font-bold text-slate-700 mt-1">
                            {sheetData.years.filter(y => y !== 'All').join(', ') || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Local Preview Area Chart */}
                      {firstIndicator && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Tren Pratinjau Indikator Utama ({firstIndicator})
                          </span>
                          <div className="h-[180px] bg-slate-50/30 border border-slate-100 rounded-xl p-3">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={previewChartData} margin={{ top: 10, right: 10, left: -20, bottom: -10 }}>
                                <defs>
                                  <linearGradient id={`sheet-grad-${sheetName}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C61E1E" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#C61E1E" stopOpacity={0.01}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ fontSize: 10, borderRadius: 8, borderColor: '#F1F5F9' }} 
                                  labelStyle={{ fontWeight: 'bold', color: '#64748B' }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#C61E1E" 
                                  strokeWidth={1.5}
                                  fillOpacity={1}
                                  fill={`url(#sheet-grad-${sheetName})`}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
