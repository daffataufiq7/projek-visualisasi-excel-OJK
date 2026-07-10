import React, { useMemo } from 'react';
import { FileSpreadsheet, Printer, Download, BookOpen, AlertCircle } from 'lucide-react';
import { ActiveFile, FilterState } from '../types/dashboard';

interface ReportsProps {
  activeFile: ActiveFile;
  filterState: FilterState;
}

interface ColumnReport {
  columnName: string;
  minVal: number;
  minLabel: string;
  maxVal: number;
  maxLabel: string;
  avgVal: number;
  latestVal: number;
}

export default function Reports({ activeFile, filterState }: ReportsProps) {
  const activeSheetData = activeFile.sheets[filterState.sheet];

  const reportMetrics = useMemo(() => {
    if (!activeSheetData || activeSheetData.indicators.length === 0) return [];

    const indicators = activeSheetData.indicators;
    const periods = activeSheetData.periods;
    const metrics: ColumnReport[] = [];

    indicators.forEach((indicatorName) => {
      let minVal = Infinity;
      let minLabel = '';
      let maxVal = -Infinity;
      let maxLabel = '';
      let sum = 0;
      let count = 0;

      periods.forEach((periodKey) => {
        const val = activeSheetData.indicatorsData[indicatorName]?.[periodKey];
        if (val !== undefined && val !== null) {
          sum += val;
          count++;

          const label = periodKey;
          if (val < minVal) {
            minVal = val;
            minLabel = label;
          }
          if (val > maxVal) {
            maxVal = val;
            maxLabel = label;
          }
        }
      });

      const avgVal = count > 0 ? sum / count : 0;
      const latestVal = count > 0 ? (activeSheetData.indicatorsData[indicatorName]?.[periods[periods.length - 1]] ?? 0) : 0;

      if (count > 0) {
        metrics.push({
          columnName: indicatorName,
          minVal: parseFloat(minVal.toFixed(2)),
          minLabel,
          maxVal: parseFloat(maxVal.toFixed(2)),
          maxLabel,
          avgVal: parseFloat(avgVal.toFixed(2)),
          latestVal: parseFloat(latestVal.toFixed(2))
        });
      }
    });

    return metrics;
  }, [activeSheetData]);

  const handlePrint = () => {
    window.print();
  };

  const executiveSummaryText = useMemo(() => {
    if (reportMetrics.length === 0) return '';

    // Find the main column (usually Total Aset, Total DPK, or similar containing 'total')
    let mainMetric = reportMetrics.find(m => m.columnName.toLowerCase().includes('total'));
    if (!mainMetric) mainMetric = reportMetrics[0];

    const sheetName = filterState.sheet;
    const { columnName, maxVal, maxLabel, avgVal, latestVal } = mainMetric;

    return `Laporan eksekutif sheet "${sheetName}" menunjukkan bahwa indikator utama "${columnName}" mencatat nilai rata-rata sebesar ${avgVal.toLocaleString('id-ID')} unit keuangan selama periode pelaporan. Pencapaian puncak tertinggi berada di angka ${maxVal.toLocaleString('id-ID')} yang tercatat pada periode ${maxLabel}. Data posisi terupdate berada pada nilai ${latestVal.toLocaleString('id-ID')}, mencerminkan kestabilan tata kelola jasa keuangan regional Jawa Barat.`;
  }, [reportMetrics, filterState.sheet]);

  if (!activeSheetData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
        <AlertCircle className="mx-auto text-[#C61E1E] opacity-35 mb-2" size={32} />
        <p className="text-xs font-semibold">Gagal memuat laporan data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-6 w-full max-w-4xl mx-auto printable-report">
      {/* Report Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50 pb-4 no-print">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-[#C61E1E]" />
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Laporan Analisis Ringkas</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Ringkasan data tabular & statistik variabel keuangan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 bg-[#C61E1E] hover:bg-[#A31818] text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <Printer size={14} />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* REPORT CONTENT LAYOUT FOR PRINTING */}
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center space-y-2 py-4 border-b border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Laporan Eksekutif OJK Jabar</span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            BRIEFING DATA KEUANGAN REGIONAL JAWA BARAT
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-400 pt-1">
            <span>Berkas: {activeFile.name}</span>
            <span>•</span>
            <span>Sheet Analisis: {filterState.sheet}</span>
            <span>•</span>
            <span>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
          </div>
        </div>

        {/* Section 1: Executive Briefing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <BookOpen size={16} className="text-[#C61E1E] no-print" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Ringkasan Narasi Eksekutif</h4>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-600 leading-relaxed font-semibold italic">
            "{executiveSummaryText || 'Data statistik sheet sedang dikalkulasi.'}"
          </div>
        </div>

        {/* Section 2: Metrics Table */}
        <div className="space-y-3 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-slate-700">
            <FileSpreadsheet size={16} className="text-[#C61E1E] no-print" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Matriks Indikator Finansial</h4>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Indikator Keuangan</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Nilai Terendah (Min)</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Nilai Tertinggi (Max)</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Nilai Rata-rata</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Posisi Terupdate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reportMetrics.map((metric) => (
                  <tr key={metric.columnName} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-700">{metric.columnName}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-600">
                      <div>{metric.minVal.toLocaleString('id-ID')}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">({metric.minLabel})</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-600">
                      <div>{metric.maxVal.toLocaleString('id-ID')}</div>
                      <div className="text-[9px] text-[#C61E1E] font-bold mt-0.5">({metric.maxLabel})</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                      {metric.avgVal.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 bg-red-50/10">
                      {metric.latestVal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer signature block */}
        <div className="grid grid-cols-2 gap-8 pt-10 text-[10px] text-slate-400 font-semibold border-t border-slate-50">
          <div>
            <p>FINSIGHT Analytics Engine v0.1.0</p>
            <p>OJK Jasa Keuangan Kantor Jawa Barat</p>
          </div>
          <div className="text-right">
            <p className="border-b border-slate-200 w-32 ml-auto pb-8"></p>
            <p className="pt-2">Tim Pengawas Internal Perbankan</p>
          </div>
        </div>
      </div>

      {/* Embedded style for print hide elements */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .printable-report {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
