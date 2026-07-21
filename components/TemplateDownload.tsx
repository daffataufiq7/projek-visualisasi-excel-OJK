import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Download, Info, CheckCircle2, Layers, Table } from 'lucide-react';
import { downloadOjkTemplate, downloadKreditJenisTemplate, downloadDpkTemplate } from '../services/excelService';

export default function TemplateDownload() {
  const [activeTemplateType, setActiveTemplateType] = useState<'kredit_jenis' | 'dpk_portofolio' | 'master_bertingkat'>('dpk_portofolio');

  const kreditJenisSample = {
    headersRow1: ['Kredit per Jenis Penggunaan', '2024', '2025', '2026', '', ''],
    headersRow2: ['', 'Mei', 'Mei', 'Mei', 'YOY', 'SHARE'],
    rows: [
      ['Modal Kerja', '351,393,161,049,054', '338,810,328,055,006', '329,740,604,279,539', '-2.68%', '30.52%'],
      ['Investasi', '190,762,844,685,500', '216,723,091,364,230', '251,790,742,742,739', '16.18%', '23.30%'],
      ['Konsumsi', '442,899,398,544,257', '474,957,031,024,500', '499,029,032,369,175', '5.07%', '46.18%'],
      ['Total', '985,055,404,278,811', '1,030,490,450,443,740', '1,080,560,379,391,450', '4.86%', '100.00%'],
    ]
  };

  const dpkSample = {
    headersRow1: ['DPK', '2024', '2025', '2026', '', ''],
    headersRow2: ['', 'Mei', 'Mei', 'Mei', 'YOY', 'SHARE'],
    rows: [
      ['Giro', '136,614,038,441,794', '149,838,852,087,387', '174,830,850,692,072', '16.68%', '22.90%'],
      ['Tabungan', '318,730,159,773,855', '332,539,196,995,268', '361,901,013,518,981', '8.83%', '47.40%'],
      ['Deposito', '239,460,401,053,625', '232,504,312,637,831', '226,832,053,960,849', '-2.44%', '29.71%'],
      ['Total', '694,804,599,269,274', '714,882,361,720,486', '763,563,918,171,902', '6.81%', '100.00%'],
    ]
  };

  const masterSample = {
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
            Template Resmi OJK
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Download Template Excel OJK Jabar
          </h2>
          <p className="text-sm text-red-100 font-medium leading-relaxed">
            Gunakan template Excel standar OJK Jawa Barat untuk Kredit per Jenis Penggunaan dan DPK per Portofolio agar visualisasi otomatis berjalan presisi di FINSIGHT.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={downloadDpkTemplate}
              className="flex items-center gap-2 bg-white text-[#C61E1E] font-black text-xs px-5 py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              <Download size={16} />
              <span>Download Template DPK (.xlsx)</span>
            </button>
            <button
              onClick={downloadKreditJenisTemplate}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Download size={16} />
              <span>Download Template Kredit (.xlsx)</span>
            </button>
            <button
              onClick={downloadOjkTemplate}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Download size={16} />
              <span>Paket Master Template (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTemplateType('dpk_portofolio')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            activeTemplateType === 'dpk_portofolio'
              ? 'bg-red-50/50 border-[#C61E1E] shadow-soft'
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C61E1E] bg-red-100/60 px-2.5 py-0.5 rounded-full uppercase">
              Format DPK
            </span>
            {activeTemplateType === 'dpk_portofolio' && <CheckCircle2 size={16} className="text-[#C61E1E]" />}
          </div>
          <h3 className="font-bold text-slate-800 text-sm">DPK per Portofolio</h3>
          <p className="text-xs text-slate-500 mt-1">
            Format dengan baris Giro, Tabungan, Deposito, dilengkapi kolom YOY (%) & SHARE (%).
          </p>
        </div>

        <div 
          onClick={() => setActiveTemplateType('kredit_jenis')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            activeTemplateType === 'kredit_jenis'
              ? 'bg-red-50/50 border-[#C61E1E] shadow-soft'
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C61E1E] bg-red-100/60 px-2.5 py-0.5 rounded-full uppercase">
              Format Kredit per Jenis
            </span>
            {activeTemplateType === 'kredit_jenis' && <CheckCircle2 size={16} className="text-[#C61E1E]" />}
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Kredit per Jenis Penggunaan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Format dengan baris Modal Kerja, Investasi, Konsumsi, dilengkapi kolom YOY (%) & SHARE (%).
          </p>
        </div>

        <div 
          onClick={() => setActiveTemplateType('master_bertingkat')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            activeTemplateType === 'master_bertingkat'
              ? 'bg-red-50/50 border-[#C61E1E] shadow-soft'
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
              Format Bertingkat Umum
            </span>
            {activeTemplateType === 'master_bertingkat' && <CheckCircle2 size={16} className="text-[#C61E1E]" />}
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Perbankan Jawa Barat & Laporan Keuangan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Header 2 tingkat (Tahun & Bulan) untuk Aset, DPK, Kredit, NPL, LDR.
          </p>
        </div>
      </div>

      {/* Visual Preview of Selected Template */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {activeTemplateType === 'dpk_portofolio'
                ? 'Pratinjau Template DPK per Portofolio'
                : activeTemplateType === 'kredit_jenis' 
                ? 'Pratinjau Template Kredit per Jenis Penggunaan'
                : 'Pratinjau Struktur Template Excel Master'
              }
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Struktur tabel wajib mengikuti tata letak di bawah ini agar lolos validasi sistem.
            </p>
          </div>
          <button
            onClick={activeTemplateType === 'dpk_portofolio' ? downloadDpkTemplate : activeTemplateType === 'kredit_jenis' ? downloadKreditJenisTemplate : downloadOjkTemplate}
            className="flex items-center gap-1.5 text-xs font-bold text-[#C61E1E] bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Download size={14} />
            <span>Download Template Ini</span>
          </button>
        </div>

        {/* Scrollable Pivot Preview */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          {activeTemplateType === 'dpk_portofolio' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center">
                  <th className="p-3 border-r border-slate-200 bg-slate-200/60 text-slate-800 text-left font-black">
                    {dpkSample.headersRow1[0]}
                  </th>
                  <th className="p-3 border-r border-slate-200">{dpkSample.headersRow1[1]}</th>
                  <th className="p-3 border-r border-slate-200">{dpkSample.headersRow1[2]}</th>
                  <th className="p-3 border-r border-slate-200">{dpkSample.headersRow1[3]}</th>
                  <th className="p-3 border-r border-slate-200"></th>
                  <th className="p-3"></th>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200 text-center">
                  <th className="p-2.5 border-r border-slate-200 bg-slate-100/40"></th>
                  <th className="p-2.5 border-r border-slate-200 text-[#C61E1E] font-black">{dpkSample.headersRow2[1]}</th>
                  <th className="p-2.5 border-r border-slate-200 text-[#C61E1E] font-black">{dpkSample.headersRow2[2]}</th>
                  <th className="p-2.5 border-r border-slate-200 text-[#C61E1E] font-black">{dpkSample.headersRow2[3]}</th>
                  <th className="p-2.5 border-r border-slate-200 bg-amber-50 text-amber-700 font-black">{dpkSample.headersRow2[4]}</th>
                  <th className="p-2.5 bg-blue-50 text-blue-700 font-black">{dpkSample.headersRow2[5]}</th>
                </tr>
              </thead>
              <tbody>
                {dpkSample.rows.map((row, rIdx) => {
                  const isTotal = rIdx === dpkSample.rows.length - 1;
                  return (
                    <tr key={rIdx} className={`border-b border-slate-200 ${isTotal ? 'bg-slate-100/80 font-black' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-800">
                        {row[0]}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono text-slate-700">{row[1]}</td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono text-slate-700">{row[2]}</td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono text-slate-700">{row[3]}</td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono font-bold text-amber-700 bg-amber-50/30">{row[4]}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">{row[5]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : activeTemplateType === 'kredit_jenis' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center">
                  <th className="p-3 border-r border-slate-200 bg-slate-200/60 text-slate-800 text-left font-black">
                    {kreditJenisSample.headersRow1[0]}
                  </th>
                  <th className="p-3 border-r border-slate-200">{kreditJenisSample.headersRow1[1]}</th>
                  <th className="p-3 border-r border-slate-200">{kreditJenisSample.headersRow1[2]}</th>
                  <th className="p-3 border-r border-slate-200">{kreditJenisSample.headersRow1[3]}</th>
                  <th className="p-3 border-r border-slate-200"></th>
                  <th className="p-3"></th>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200 text-center">
                  <th className="p-2.5 border-r border-slate-200 bg-slate-100/40"></th>
                  <th className="p-2.5 border-r border-slate-200 text-[#C61E1E] font-black">{kreditJenisSample.headersRow2[1]}</th>
                  <th className="p-2.5 border-r border-slate-200 text-[#C61E1E] font-black">{kreditJenisSample.headersRow2[2]}</th>
                  <th className="p-2.5 border-r border-slate-200 text-[#C61E1E] font-black">{kreditJenisSample.headersRow2[3]}</th>
                  <th className="p-2.5 border-r border-slate-200 bg-amber-50 text-amber-700 font-black">{kreditJenisSample.headersRow2[4]}</th>
                  <th className="p-2.5 bg-blue-50 text-blue-700 font-black">{kreditJenisSample.headersRow2[5]}</th>
                </tr>
              </thead>
              <tbody>
                {kreditJenisSample.rows.map((row, rIdx) => {
                  const isTotal = rIdx === kreditJenisSample.rows.length - 1;
                  return (
                    <tr key={rIdx} className={`border-b border-slate-200 ${isTotal ? 'bg-slate-100/80 font-black' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-800">
                        {row[0]}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono text-slate-700">{row[1]}</td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono text-slate-700">{row[2]}</td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono text-slate-700">{row[3]}</td>
                      <td className="p-3 border-r border-slate-200 text-right font-mono font-bold text-amber-700 bg-amber-50/30">{row[4]}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">{row[5]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                  <th className="p-3 border-r border-slate-100 bg-slate-100/50 w-44">Tahun &rarr;</th>
                  {masterSample.headersRow1.slice(1).map((val, idx) => (
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
                  {masterSample.headersRow2.slice(1).map((val, idx) => (
                    <th key={idx} className="p-3 border-r border-slate-100 text-center bg-slate-50/70">
                      {val}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {masterSample.rows.map((row, rIdx) => (
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
          )}
        </div>

        {/* Alert Rules */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex gap-3">
          <Info className="text-slate-400 shrink-0" size={20} />
          <div className="space-y-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-700">Aturan Pengisian Template:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong className="text-slate-600">DPK per Portofolio & Kredit per Jenis:</strong> Baris pertama berisi nama indikator di sel A1, diikuti kolom 4 digit tahun (2024, 2025, 2026). Baris kedua berisi Bulan (misal: Mei) serta kolom <code>YOY</code> dan <code>SHARE</code>.
              </li>
              <li>
                <strong className="text-slate-600">Nama Portofolio (Kolom A):</strong> Tuliskan nama portofolio DPK seperti <code>Giro</code>, <code>Tabungan</code>, <code>Deposito</code>, dan baris <code>Total</code>.
              </li>
              <li>
                <strong className="text-slate-600">Data Numerik & Persentase:</strong> Isi nilai nominal dalam bentuk angka murni. Untuk YOY dan SHARE, Anda dapat mengisikan format persentase (misal: <code>16.68%</code>) atau desimal (<code>0.1668</code>).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
