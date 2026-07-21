import React, { useState } from 'react';
import { Info, HelpCircle, ShieldAlert, Cpu, Heart, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export default function About() {
  const [activeSlide, setActiveSlide] = useState<'info' | 'team'>('info');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-6 w-full max-w-4xl mx-auto overflow-hidden">
      {/* Tab Switcher / Segmented Control */}
      <div className="flex justify-center border-b border-slate-50 pb-4">
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 relative border border-slate-200/50">
          <button
            onClick={() => setActiveSlide('info')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors relative select-none ${activeSlide === 'info' ? 'text-white' : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            {activeSlide === 'info' && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-[#C61E1E] rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ zIndex: 0 }}
              />
            )}
            <span className="relative z-10">Informasi Aplikasi</span>
          </button>

          <button
            onClick={() => setActiveSlide('team')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors relative select-none ${activeSlide === 'team' ? 'text-white' : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            {activeSlide === 'team' && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-[#C61E1E] rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ zIndex: 0 }}
              />
            )}
            <span className="relative z-10">Tim Pengembang</span>
          </button>
        </div>
      </div>

      {/* Content Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0, x: activeSlide === 'info' ? -15 : 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeSlide === 'info' ? 15 : -15 }}
          transition={{ duration: 0.2 }}
          className="w-full space-y-6"
        >
          {activeSlide === 'info' ? (
            /* SLIDE 1: FINSIGHT INFO */
            <div className="space-y-6">
              {/* Brand Profile Banner */}
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-50">
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shrink-0 flex items-center justify-center">
                  <Logo />
                </div>
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">FINSIGHT</h2>
                  <p className="text-xs font-extrabold uppercase text-[#C61E1E] tracking-widest">
                    Financial Data Visualization Dashboard
                  </p>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    Sistem visualisasi internal OJK Kantor Perwakilan Jawa Barat yang dikembangkan untuk mempercepat analisis rasio-rasio perbankan, aset, DPK, penyaluran kredit, dan profitabilitas lembaga jasa keuangan regional Jawa Barat secara mandiri dan cepat.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tech Specs */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Cpu size={16} className="text-[#C61E1E]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Spesifikasi Teknologi (Tech Stack)</h4>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-[#C61E1E] shrink-0 mt-0.5" />
                      <span><strong>Next.js & React Core:</strong> Rendering framework cepat dengan dukungan TypeScript statis.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-[#C61E1E] shrink-0 mt-0.5" />
                      <span><strong>Tailwind CSS & Shadcn Design:</strong> Estetika premium minimalis terinspirasi dari Stripe Dashboard.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-[#C61E1E] shrink-0 mt-0.5" />
                      <span><strong>Recharts Canvas:</strong> Grafik responsif, zoom dinamis, ekspor langsung SVG & high-res PNG.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-[#C61E1E] shrink-0 mt-0.5" />
                      <span><strong>SheetJS (XLSX):</strong> Mesin kompilasi spreadsheet kilat terproses 100% aman di sisi klien.</span>
                    </li>
                  </ul>
                </div>

                {/* Security Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldAlert size={16} className="text-[#C61E1E]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Kebijakan Kerahasiaan Data (Data Privacy)</h4>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dashboard ini diatur agar beroperasi di <strong>Client-Side Environment</strong>. Ketika Anda mengunggah file Excel, seluruh proses ekstraksi baris dan pemetaan kolom diselesaikan langsung di dalam memory sandbox browser Anda (RAM lokal komputer Anda).
                  </p>
                  <div className="bg-red-50/50 border border-red-100/50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                      * Tidak ada data keuangan sensitif atau berkas laporan yang diunggah ke server eksternal, meminimalkan risiko kebocoran data lembaga perbankan sesuai regulasi keamanan informasi OJK.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Guidelines */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-700">
                  <HelpCircle size={16} className="text-[#C61E1E]" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Panduan Format File Excel (.xls, .xlsx)</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] text-slate-500 leading-relaxed">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h5 className="font-bold text-slate-700 mb-1">1. Struktur Baris</h5>
                    <span>Baris pertama wajib berisi nama header/kolom (misal: 'Periode', 'Tahun', 'Bulan', 'Aset Swasta'). Tidak boleh ada baris kosong di atas baris header.</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h5 className="font-bold text-slate-700 mb-1">2. Format Angka</h5>
                    <span>Pastikan kolom numerik diisi murni angka (contoh: 120.45) tanpa penulisan mata uang Rp manual, agar dibaca sebagai sumbu grafik dengan benar.</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h5 className="font-bold text-slate-700 mb-1">3. Kolom Periode</h5>
                    <span>Sangat disarankan menyertakan kolom bertuliskan 'Periode' (misal: Jan-24) atau 'Tanggal' untuk sumbu X utama pemetaan tren bulanan.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SLIDE 2: FINSIGHT TEAM */
            <div className="space-y-6 animate-fadeIn">
              {/* Brand Profile Banner */}
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shrink-0 flex items-center justify-center w-48 h-28">
                  <Logo />
                </div>
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">
                    FINSIGHT
                  </h2>
                  <p className="text-xs font-extrabold uppercase text-[#C61E1E] tracking-widest">
                    Financial Data Visualization Dashboard
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>FINSIGHT</strong> adalah aplikasi dashboard analisis dan visualisasi data keuangan terintegrasi yang dirancang untuk kebutuhan internal Kantor OJK Regional Jawa Barat. Aplikasi ini memudahkan penyaringan, analisis, dan visualisasi tren rasio keuangan lembaga jasa keuangan di Jawa Barat.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Melalui dashboard ini, pengguna dapat dengan cepat mengunggah berkas Excel, memetakan indikator perbankan penting, serta membandingkan data keuangan antar tahun (YoY) secara interaktif dan dinamis.
                  </p>
                </div>
              </div>

              {/* Tim Pengembang Aplikasi */}
              <div className="space-y-4">
                <div className="text-center py-2">
                  <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-[0.2em]">
                    TIM PENGEMBANG APLIKASI
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* UNY Card */}
                  <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-md transition-all duration-300">
                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                      <img
                        src="/uny_logo.png"
                        alt="Logo UNY"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 mb-1">UNY</h4>
                    <div className="w-full border-t border-slate-100/80 my-2 pt-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-600">Daffa Taufiqurahman</p>
                      <p className="text-xs font-semibold text-slate-600">Naufal Hanif R. D.</p>
                      <p className="text-xs font-semibold text-slate-600">Angga Baihaki Y.</p>
                    </div>
                  </div>

                  {/* ITB Card */}
                  <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-md transition-all duration-300">
                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                      <img
                        src="/itb_logo.png"
                        alt="Logo ITB"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 mb-1">ITB</h4>
                    <div className="w-full border-t border-slate-100/80 my-2 pt-2">
                      <p className="text-xs font-semibold text-slate-600">Ratukhansa Salsabila</p>
                    </div>
                  </div>

                  {/* Telkom Univ Card */}
                  <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-md transition-all duration-300">
                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                      <img
                        src="/telkom_logo.png"
                        alt="Logo Telkom"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 mb-1">Telkom Univ</h4>
                    <div className="w-full border-t border-slate-100/80 my-2 pt-2">
                      <p className="text-xs font-semibold text-slate-600">Bunga Nazwa S.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer credits */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-semibold pt-4 border-t border-slate-50 w-full mt-4">
        <span>© 2026 Otoritas Jasa Keuangan - Kantor Jawa Barat</span>
        <span className="flex items-center gap-1">
          Dibuat dengan <Heart size={10} className="fill-[#C61E1E] text-[#C61E1E]" /> untuk OJK Jawa Barat
        </span>
      </div>
    </div>
  );
}
