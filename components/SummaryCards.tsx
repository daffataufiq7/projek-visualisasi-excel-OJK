import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Calendar, Database, Hash } from 'lucide-react';
import { ActiveFile, FilterState } from '../types/dashboard';

interface SummaryCardsProps {
  activeFile: ActiveFile;
  filterState: FilterState;
}

export default function SummaryCards({ activeFile, filterState }: SummaryCardsProps) {
  const activeSheetData = activeFile.sheets[filterState.sheet];

  // 1. Total Sheets
  const totalSheets = activeFile.sheetNames.length;
  
  // 2. Total Years
  // Find distinct years across ALL sheets to represent file-wide scope
  const distinctYears = new Set<string>();
  Object.values(activeFile.sheets).forEach(sheet => {
    sheet.years.forEach(y => {
      if (y && y !== 'All') distinctYears.add(y);
    });
  });
  const totalYears = distinctYears.size || 1;

  // 3. Total Data Points (Sum of rows across all sheets or current sheet rows)
  const currentSheetRows = activeSheetData?.data.length || 0;
  const fileTotalRows = activeFile.rowCount;

  // 4. Numeric Columns in active sheet
  const numericColumnsCount = activeSheetData?.numericColumns.length || 0;

  const cardData = [
    {
      title: 'Total Sheet',
      value: `${totalSheets} Sheet`,
      sub: 'Jumlah sheet dokumen',
      icon: Layers,
      color: 'bg-red-50 text-[#C61E1E] border-red-100/50',
    },
    {
      title: 'Total Tahun',
      value: `${totalYears} Tahun`,
      sub: 'Rentang data terdeteksi',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600 border-blue-100/50',
    },
    {
      title: 'Total Titik Data',
      value: `${fileTotalRows.toLocaleString('id-ID')} Titik`,
      sub: `Indikator aktif: ${currentSheetRows} baris`,
      icon: Database,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
    },
    {
      title: 'Jumlah Periode',
      value: `${numericColumnsCount} Periode`,
      sub: 'Periode waktu terdeteksi',
      icon: Hash,
      color: 'bg-purple-50 text-purple-600 border-purple-100/50',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={idx}
            variants={item}
            whileHover={{ y: -3, scale: 1.005 }}
            className="bg-white rounded-2xl border border-slate-100/80 shadow-soft p-5 flex items-center justify-between transition-all"
          >
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {card.title}
              </span>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight truncate">
                {card.value}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 truncate">
                {card.sub}
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border flex items-center justify-center shrink-0 ${card.color}`}>
              <Icon size={20} />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
