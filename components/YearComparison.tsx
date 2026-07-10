import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { ActiveFile, FilterState } from '../types/dashboard';

interface YearComparisonProps {
  activeFile: ActiveFile;
  filterState: FilterState;
}

interface YearStats {
  year: string;
  totalValue: number;
  avgValue: number;
  growthPct: number | null;
  changeVal: number | null;
  monthlyData: { month: string; value: number }[];
}

export default function YearComparison({ activeFile, filterState }: YearComparisonProps) {
  const activeSheetData = activeFile.sheets[filterState.sheet];

  const yearStatsList = useMemo(() => {
    if (!activeSheetData) return [];

    const years = activeSheetData.years.filter(y => y && y !== 'All').sort();
    if (years.length === 0) return [];

    // Find target indicator (use first selected, or first in sheet)
    const targetCol = filterState.yAxis[0] || activeSheetData.indicators[0];
    if (!targetCol) return [];

    const stats: YearStats[] = [];

    years.forEach((yr, idx) => {
      // Find periods for this year
      const periodsForYear = activeSheetData.periods.filter(p => p.startsWith(yr));

      let sum = 0;
      let validCount = 0;
      const monthlyValues: { month: string; value: number }[] = [];

      periodsForYear.forEach((period) => {
        const val = activeSheetData.indicatorsData[targetCol]?.[period] ?? 0;
        const mName = period.split('-')[1];
        
        sum += val;
        validCount++;
        
        monthlyValues.push({
          month: mName,
          value: val
        });
      });

      const avg = validCount > 0 ? sum / validCount : 0;

      // YoY changes
      let growthPct: number | null = null;
      let changeVal: number | null = null;

      if (idx > 0) {
        const prevYearSum = stats[idx - 1].totalValue;
        if (prevYearSum > 0) {
          changeVal = sum - prevYearSum;
          growthPct = (changeVal / prevYearSum) * 100;
        }
      }

      stats.push({
        year: yr,
        totalValue: parseFloat(sum.toFixed(2)),
        avgValue: parseFloat(avg.toFixed(2)),
        growthPct: growthPct !== null ? parseFloat(growthPct.toFixed(1)) : null,
        changeVal: changeVal !== null ? parseFloat(changeVal.toFixed(2)) : null,
        monthlyData: monthlyValues.slice(0, 12),
      });
    });

    return stats;
  }, [activeSheetData, filterState.yAxis]);

  if (yearStatsList.length === 0) return null;

  // Determine grid column width layout classes based on the number of years
  const numYears = yearStatsList.length;
  const gridColsClass = 
    numYears === 2 ? 'grid-cols-1 md:grid-cols-2' :
    numYears === 3 ? 'grid-cols-1 md:grid-cols-3' :
    numYears >= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1';

  // Target label for visual description
  const targetColLabel = filterState.yAxis[0] || activeSheetData.indicators[0];

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-[#C61E1E]" />
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Analisis Tren Tahunan & Pertumbuhan ({targetColLabel})
        </h3>
      </div>

      <div className={`grid ${gridColsClass} gap-4 w-full`}>
        {yearStatsList.map((stat, idx) => {
          const isGrowing = stat.growthPct !== null && stat.growthPct >= 0;
          
          return (
            <div 
              key={stat.year}
              className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 space-y-4 hover:shadow-md hover:border-slate-200/50 transition-all duration-300"
            >
              {/* Year & Growth badge */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-800">{stat.year}</span>
                
                {stat.growthPct !== null ? (
                  <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    isGrowing 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                      : 'bg-red-50 text-[#C61E1E] border-red-100/50'
                  }`}>
                    {isGrowing ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>{isGrowing ? '+' : ''}{stat.growthPct}% YoY</span>
                  </div>
                ) : (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    Base Year
                  </span>
                )}
              </div>

              {/* Annual Summary Values */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Tahunan
                </span>
                <p className="text-2xl font-black tracking-tight text-slate-800">
                  {stat.totalValue.toLocaleString('id-ID')}
                </p>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-1">
                  <span>Rerata Bulanan: {stat.avgValue.toLocaleString('id-ID')}</span>
                  {stat.changeVal !== null && (
                    <span className={isGrowing ? 'text-emerald-600' : 'text-[#C61E1E]'}>
                      {isGrowing ? 'Naik' : 'Turun'}: {Math.abs(stat.changeVal).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>

              {/* Sparkline Visualizers */}
              {stat.monthlyData.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                  {/* Mini Line Chart */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mini Line Chart</span>
                    <div className="h-[40px] bg-slate-50 rounded-lg overflow-hidden p-1 flex items-end">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stat.monthlyData}>
                          <YAxis domain={['auto', 'auto']} hide />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#C61E1E"
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Mini Bar Chart */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mini Bar Chart</span>
                    <div className="h-[40px] bg-slate-50 rounded-lg overflow-hidden p-1 flex items-end">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stat.monthlyData}>
                          <Bar
                            dataKey="value"
                            fill="#1E293B"
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
