import React from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Download, Info, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { downloadOjkTemplate } from '../services/excelService';

export default function TemplateDownload() {
  const tableSample = {
    headersRow1: ['Indikator', '2024', '', '', '2025', '', '', '2026', '', ''],
    headersRow2: ['Periode', 'Jan', 'Mei', 'Des', 'Jan', 'Mei', 'Des', 'Jan', 'Mei', 'Des'],
    rows: [
      ['Aset', '120.00', '135.00', '145.00', '150.00', '160.00', '175.00', '180.00', '195.00', '210.00'],
      ['Dana Pihak Ketiga', '100.00', '110.00', '125.00', '130.00', '142.00', '155.00', '160.00', '175.00', '190.00'],
      ['Kredit', '90.00', '100.00', '110.00', '115.00', '125.00', '135.00', '140.00', '152.00', '165.00'],
      ['NPL', '2.50', '2.30', '2.20', '2.10', '2.00', '1.90', '1.80', '1.70', '1.60'],
      ['LDR', '88.50', '86.20', '85.00', '84.10', '83.20', '82.00', '81.20', '79.50', '78.00'],
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 w-full max-w-5xl mx-auto"
    >
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#C61E1E] to-[#A31818] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <FileSpreadsheet size={300} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Template Resmi
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Download Template Excel OJK Jabar
          </h2>
          <p className="text-sm text-red-100 font-medium leading-relaxed">
            Gunakan template Excel standar OJK Jawa Barat untuk memastikan visualisasi data berjalan otomatis dan bebas hambatan di dashboard FINSIGHT.
          </p>
          <button
            onClick={downloadOjkTemplate}
            className="flex items-center gap-2 bg-white text-[#C61E1E] font-black text-xs px-5 py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-md active:scale-95"
          >
            <Download size={16} />
            <span>Download Template Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-soft space-y-3">
          <div className="w-8 h-8 rounded-full bg-red-50 text-[#C61E1E] flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Download & Buka</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unduh file template resmi dan buka menggunakan Microsoft Excel, Google Sheets, atau aplikasi sejenis.
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-soft space-y-3">
          <div className="w-8 h-8 rounded-full bg-red-50 text-[#C61E1E] flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Isi Sesuai Format</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Isikan nama indikator pada kolom pertama, lalu isikan tahun (Baris 1) dan bulan (Baris 2) secara berurutan ke samping.
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-soft space-y-3">
          <div className="w-8 h-8 rounded-full bg-red-50 text-[#C61E1E] flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Unggah ke FINSIGHT</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unggah berkas Excel yang telah diisi. Sistem kami akan memvalidasi struktur data dan menampilkan grafiknya secara instan.
          </p>
        </div>
      </div>

      {/* Visual Preview of Template */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Pratinjau Struktur Template Excel
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Struktur tabel wajib mengikuti tata letak di bawah ini agar lolos validasi sistem.
            </p>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
            Format Standar
          </span>
        </div>

        {/* Scrollable Pivot Preview */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                <th className="p-3 border-r border-slate-100 bg-slate-100/50 w-44">Tahun &rarr;</th>
                {tableSample.headersRow1.slice(1).map((val, idx) => (
                  <th
                    key={idx}
                    className={`p-3 border-r border-slate-100 text-center ${
                      val ? 'bg-red-50/50 text-[#C61E1E]' : 'bg-slate-50/30'
                    }`}
                  >
                    {val}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                <th className="p-3 border-r border-slate-100 bg-slate-100/50">Bulan &rarr;</th>
                {tableSample.headersRow2.slice(1).map((val, idx) => (
                  <th key={idx} className="p-3 border-r border-slate-100 text-center bg-slate-50/70">
                    {val}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableSample.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 border-r border-slate-100 font-bold text-slate-700 bg-slate-50/20">
                    {row[0]}
                  </td>
                  {row.slice(1).map((val, cIdx) => (
                    <td key={cIdx} className="p-3 border-r border-slate-100 text-center text-slate-600 font-medium font-mono">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alert Rules */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex gap-3">
          <Info className="text-slate-400 shrink-0" size={20} />
          <div className="space-y-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-700">Aturan Pengisian Template:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong className="text-slate-600">Baris 1 (Tahun):</strong> Wajib berisi 4 digit tahun (misal: 2025). Jika sel digabung (merged cells), tulis tahun di kolom pertama dan kosongkan kolom berikutnya. Sistem akan otomatis melacak penggabungannya.
              </li>
              <li>
                <strong className="text-slate-600">Baris 2 (Bulan):</strong> Tuliskan nama bulan singkat/lengkap (misal: Jan, Feb, Mei) atau nama periode lainnya. Seluruh kolom tahun harus memiliki bulan.
              </li>
              <li>
                <strong className="text-slate-600">Format Tahunan (Format 1):</strong> Jika data Anda hanya bersifat tahunan (tidak ada sub-header bulan), Anda dapat langsung menghapus Baris 2 (Bulan). Parser sistem akan mendeteksi secara otomatis dan mengatur bulan sebagai `null`.
              </li>
              <li>
                <strong className="text-slate-600">Kolom pertama (Kolom A):</strong> Tuliskan nama indikator (Aset, DPK, dll). Nama tidak boleh kosong.
              </li>
              <li>
                <strong className="text-slate-600">Data Numerik:</strong> Isi sel nilai dengan angka murni. Nilai kosong atau strip (`-`) akan otomatis dibaca sebagai `0` oleh sistem.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
