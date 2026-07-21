import React from 'react';
import * as XLSX from 'xlsx';
import { History, Eye, Download, Trash2, Calendar, FileCheck, Info, CheckCircle } from 'lucide-react';
import { UploadHistoryItem } from '../types/dashboard';
import { formatBytes } from '../services/excelService';

interface UploadHistoryProps {
  history: UploadHistoryItem[];
  onLoadItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  activeFileName?: string;
}

export default function UploadHistory({
  history,
  onLoadItem,
  onDeleteItem,
  activeFileName
}: UploadHistoryProps) {
  
  // Re-export historical spreadsheet from memory
  const handleDownload = (e: React.MouseEvent, item: UploadHistoryItem) => {
    e.stopPropagation();
    const fileData = item.fileData;
    if (!fileData) return;
    try {
      const wb = XLSX.utils.book_new();
      Object.keys(fileData.sheets).forEach(sheetName => {
        const ws = XLSX.utils.json_to_sheet(fileData.sheets[sheetName].data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30)); // Max 30 chars
      });
      XLSX.writeFile(wb, item.name);
    } catch (err) {
      alert('Gagal mendownload file dari memory: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-6 w-full">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
        <History size={18} className="text-[#C61E1E]" />
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Riwayat Unggahan Dokumen</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Daftar file Excel yang tersimpan di penyimpanan lokal penjelajah
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <History size={32} className="opacity-30 mb-3" />
          <p className="text-xs font-semibold">Tidak ada riwayat unggahan</p>
          <p className="text-[10px] text-slate-400">Upload file Excel pada halaman 'Upload Excel' terlebih dahulu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nama File</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Upload</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Sheets</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Rows</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Ukuran</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((item) => {
                const isActive = activeFileName === item.name;
                const isDefault = item.id === 'default-mock';

                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isActive ? 'bg-red-50/10' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className={isActive ? 'text-[#C61E1E]' : 'text-slate-400'} />
                        <span className="truncate max-w-[180px] md:max-w-[280px]" title={item.name}>
                          {item.name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100 text-[#C61E1E] text-[8px] font-extrabold uppercase tracking-wide">
                            Aktif
                          </span>
                        )}
                        {(item.isSample || item.id.includes('default-mock') || item.name.toLowerCase().includes('sampel') || item.name.toLowerCase().includes('sample')) && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-black uppercase tracking-wider">
                            SAMPLE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{item.uploadDate}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600 text-center">
                      {item.sheetCount} Sheet
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600 text-center">
                      {item.rowCount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-500">
                      {formatBytes(item.size)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                        <CheckCircle size={10} />
                        Sukses
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Lihat */}
                        <button
                          onClick={() => onLoadItem(item.id)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-bold ${
                            isActive 
                              ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                              : 'bg-white text-[#C61E1E] border-red-100 hover:bg-[#C61E1E] hover:text-white'
                          }`}
                          disabled={isActive}
                          title="Tampilkan di Dashboard"
                        >
                          <Eye size={12} />
                          <span>Lihat</span>
                        </button>

                        {/* 2. Download */}
                        <button
                          onClick={(e) => handleDownload(e, item)}
                          className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                          title="Download Spreadsheet Excel"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>

                        {/* 3. Hapus */}
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className={`p-1.5 border rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${
                            isDefault 
                              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                              : 'bg-white text-slate-500 border-slate-100 hover:bg-red-50 hover:text-[#C61E1E] hover:border-red-100'
                          }`}
                          disabled={isDefault}
                          title={isDefault ? "Sampel bawaan tidak dapat dihapus" : "Hapus Riwayat"}
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info notice */}
      <div className="flex gap-3 bg-red-50/50 border border-red-100/50 p-4 rounded-xl text-slate-600">
        <Info size={18} className="text-[#C61E1E] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed font-semibold">
          <strong className="text-[#C61E1E]">Informasi:</strong> Dokumen diunggah secara lokal di browser Anda. Tidak ada data keuangan yang dikirim ke server luar, menjaga kerahasiaan data internal OJK Jawa Barat sepenuhnya sesuai regulasi perlindungan data.
        </p>
      </div>
    </div>
  );
}
