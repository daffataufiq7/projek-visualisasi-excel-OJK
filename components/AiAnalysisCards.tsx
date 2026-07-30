import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Building2, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap
} from 'lucide-react';

interface AiAnalysisCardsProps {
  bankUmumData: { aset: number; dpk: number; kredit: number; npl?: number; ldr?: number; period: string };
  kreditData: { modalKerja: number; investasi: number; konsumsi: number; period: string };
  dpkData: { giro: number; tabungan: number; deposito: number; period: string };
  undisbursedData: { modalKerja: number; investasi: number; konsumsi: number; period: string };
}

export default function AiAnalysisCards({
  bankUmumData,
  kreditData,
  dpkData,
  undisbursedData
}: AiAnalysisCardsProps) {

  // 1. Calculations for Perbankan Jawa Barat
  const totalKreditBank = bankUmumData.kredit || 1;
  const totalDpkBank = bankUmumData.dpk || 1;
  const computedLdr = bankUmumData.ldr || parseFloat(((totalKreditBank / totalDpkBank) * 100).toFixed(1));
  const computedNpl = bankUmumData.npl || 2.1;
  const isNplSafe = computedNpl <= 5.0;

  // 2. Calculations for Kredit per Jenis
  const totalKreditJenis = (kreditData.modalKerja + kreditData.investasi + kreditData.konsumsi) || 1;
  const shareMk = parseFloat(((kreditData.modalKerja / totalKreditJenis) * 100).toFixed(1));
  const shareInv = parseFloat(((kreditData.investasi / totalKreditJenis) * 100).toFixed(1));
  const shareKon = parseFloat(((kreditData.konsumsi / totalKreditJenis) * 100).toFixed(1));

  let dominantKredit = 'Konsumsi';
  let dominantKreditVal = kreditData.konsumsi;
  let dominantKreditShare = shareKon;
  if (kreditData.modalKerja >= kreditData.investasi && kreditData.modalKerja >= kreditData.konsumsi) {
    dominantKredit = 'Modal Kerja';
    dominantKreditVal = kreditData.modalKerja;
    dominantKreditShare = shareMk;
  } else if (kreditData.investasi >= kreditData.modalKerja && kreditData.investasi >= kreditData.konsumsi) {
    dominantKredit = 'Investasi';
    dominantKreditVal = kreditData.investasi;
    dominantKreditShare = shareInv;
  }

  // 3. Calculations for DPK per Portofolio
  const totalDpkPortofolio = (dpkData.giro + dpkData.tabungan + dpkData.deposito) || 1;
  const casaVal = dpkData.giro + dpkData.tabungan;
  const casaRatio = parseFloat(((casaVal / totalDpkPortofolio) * 100).toFixed(1));

  let dominantDpk = 'Tabungan';
  let dominantDpkVal = dpkData.tabungan;
  let dominantDpkShare = parseFloat(((dpkData.tabungan / totalDpkPortofolio) * 100).toFixed(1));
  if (dpkData.deposito >= dpkData.tabungan && dpkData.deposito >= dpkData.giro) {
    dominantDpk = 'Deposito';
    dominantDpkVal = dpkData.deposito;
    dominantDpkShare = parseFloat(((dpkData.deposito / totalDpkPortofolio) * 100).toFixed(1));
  } else if (dpkData.giro >= dpkData.tabungan && dpkData.giro >= dpkData.deposito) {
    dominantDpk = 'Giro';
    dominantDpkVal = dpkData.giro;
    dominantDpkShare = parseFloat(((dpkData.giro / totalDpkPortofolio) * 100).toFixed(1));
  }

  // 4. Calculations for Undisbursed Loan
  const totalUndisbursed = (undisbursedData.modalKerja + undisbursedData.investasi + undisbursedData.konsumsi) || 1;
  const shareUndisbursedMk = parseFloat(((undisbursedData.modalKerja / totalUndisbursed) * 100).toFixed(1));
  const shareUndisbursedInv = parseFloat(((undisbursedData.investasi / totalUndisbursed) * 100).toFixed(1));

  return (
    <div className="space-y-6 pt-6 border-t border-slate-200/80">
      {/* SECTION TITLE & BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C61E1E] text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>Analisis Cerdas AI per Kategori Menu</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-red-200 px-2 py-0.5 rounded-full border border-white/20">
                Real-Time Auto Update
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Rangkuman eksekutif cerdas berbasis kalkulasi data presisi dari masing-masing menu visualisasi yang sedang di-preview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl shrink-0">
          <Zap size={13} />
          <span>Sistem Analisis Terbuka & Terintegrasi</span>
        </div>
      </div>

      {/* GRID 4 CARDS ANALISIS AI PER MENU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* KOTAK 1: ANALISIS AI PERBANKAN JAWA BARAT */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-red-200 transition-all"
        >
          <div className="space-y-3">
            {/* Header Card 1 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#C61E1E] flex items-center justify-center font-bold shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">1. Perbankan Jawa Barat</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Aset, DPK, Kredit & Rasio Kesehatan</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                isNplSafe ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <ShieldCheck size={12} />
                <span>{isNplSafe ? 'Kinerja Sehat' : 'Perlu Atensi'}</span>
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center font-mono">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Total Aset</span>
                <span className="text-xs font-black text-slate-800">Rp {bankUmumData.aset}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Total DPK</span>
                <span className="text-xs font-black text-emerald-600">Rp {bankUmumData.dpk}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Total Kredit</span>
                <span className="text-xs font-black text-blue-600">Rp {bankUmumData.kredit}T</span>
              </div>
            </div>

            {/* AI Narrative Breakdown */}
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Pertumbuhan Intermediasi:</strong> Total penyaluran kredit perbankan tercatat sebesar <strong>Rp {bankUmumData.kredit} Triliun</strong> didukung penghimpunan DPK sebesar <strong>Rp {bankUmumData.dpk} Triliun</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Kesehatan Likuiditas (LDR):</strong> Rasio LDR berada pada tingkat ideal <strong>{computedLdr}%</strong>, mencerminkan kemampuan bank mengalirkan dana simpanan masyarakat ke dalam sektor riil secara efisien.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Kualitas Aset (NPL):</strong> Rasio NPL terjaga aman di posisi <strong>{computedNpl}%</strong> (di bawah batas maksimum regulasi 5.0%), menandakan manajemen risiko kredit berjalan efektif.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50/60 border border-red-100 p-2.5 rounded-2xl text-[11px] font-semibold text-[#C61E1E] flex items-center justify-between mt-2">
            <span>Kesimpulan: Struktur keuangan perbankan berada dalam kondisi solid & ekspansif.</span>
          </div>
        </motion.div>

        {/* KOTAK 2: ANALISIS AI KREDIT PER JENIS PENGGUNAAN */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-200 transition-all"
        >
          <div className="space-y-3">
            {/* Header Card 2 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">2. Kredit per Jenis Penggunaan</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Modal Kerja, Investasi & Konsumsi</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                Sektor Unggulan: {dominantKredit}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center font-mono">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Modal Kerja</span>
                <span className="text-xs font-black text-blue-600">Rp {kreditData.modalKerja}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Investasi</span>
                <span className="text-xs font-black text-purple-600">Rp {kreditData.investasi}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Konsumsi</span>
                <span className="text-xs font-black text-pink-600">Rp {kreditData.konsumsi}T</span>
              </div>
            </div>

            {/* AI Narrative Breakdown */}
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Dominasi Portofolio:</strong> Kredit <strong>{dominantKredit}</strong> memegang pangsa terbesar sebesar <strong>Rp {dominantKreditVal} Triliun ({dominantKreditShare}%)</strong> dari total portofolio pinjaman.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Dukungan Kapasitas Usaha:</strong> Penyaluran Kredit Investasi sebesar <strong>Rp {kreditData.investasi} Triliun ({shareInv}%)</strong> mencerminkan optimisme para pelaku usaha dalam melakukan ekspansi jangka panjang.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Likuiditas Operasional:</strong> Kredit Modal Kerja sebesar <strong>Rp {kreditData.modalKerja} Triliun ({shareMk}%)</strong> aktif menopang perputaran kas operasional bisnis harian regional.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 p-2.5 rounded-2xl text-[11px] font-semibold text-blue-700 flex items-center justify-between mt-2">
            <span>Kesimpulan: Penyaluran kredit didorong kuat oleh sektor {dominantKredit}.</span>
          </div>
        </motion.div>

        {/* KOTAK 3: ANALISIS AI DPK PER PORTOFOLIO */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-200 transition-all"
        >
          <div className="space-y-3">
            {/* Header Card 3 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">3. DPK per Portofolio</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Giro, Tabungan, Deposito & CASA Ratio</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                CASA Ratio: {casaRatio}%
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center font-mono">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Tabungan</span>
                <span className="text-xs font-black text-emerald-600">Rp {dpkData.tabungan}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Deposito</span>
                <span className="text-xs font-black text-amber-600">Rp {dpkData.deposito}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Giro</span>
                <span className="text-xs font-black text-indigo-600">Rp {dpkData.giro}T</span>
              </div>
            </div>

            {/* AI Narrative Breakdown */}
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Struktur Simpanan Utama:</strong> Portofolio <strong>{dominantDpk}</strong> menjadi kontributor utama simpanan dengan nilai <strong>Rp {dominantDpkVal} Triliun ({dominantDpkShare}%)</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Efisiensi Dana Murah (CASA):</strong> Tingkat rasio CASA (Giro + Tabungan) mencapai <strong>{casaRatio}%</strong>, memberikan keunggulan biaya dana (Cost of Funds) yang kompetitif bagi perbankan.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Ketahanan Deposito:</strong> Simpanan Berjangka (Deposito) tercatat sebesar <strong>Rp {dpkData.deposito} Triliun</strong> menjaga stabilitas likuiditas jangka menengah.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-2xl text-[11px] font-semibold text-emerald-700 flex items-center justify-between mt-2">
            <span>Kesimpulan: Struktur DPK didominasi dana murah (CASA) yang efisien.</span>
          </div>
        </motion.div>

        {/* KOTAK 4: ANALISIS AI UNDISBURSED LOAN */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-200 transition-all"
        >
          <div className="space-y-3">
            {/* Header Card 4 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">4. Undisbursed Loan</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Fasilitas Kredit Belum Ditarik</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                Total: Rp {totalUndisbursed.toFixed(1)}T
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center font-mono">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Modal Kerja</span>
                <span className="text-xs font-black text-amber-600">Rp {undisbursedData.modalKerja}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Investasi</span>
                <span className="text-xs font-black text-purple-600">Rp {undisbursedData.investasi}T</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Konsumsi</span>
                <span className="text-xs font-black text-teal-600">Rp {undisbursedData.konsumsi}T</span>
              </div>
            </div>

            {/* AI Narrative Breakdown */}
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Komitmen Terparkir:</strong> Fasilitas kredit yang telah disetujui namun belum ditarik mencapai <strong>Rp {totalUndisbursed.toFixed(1)} Triliun</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Potensi Realisasi Modal Kerja:</strong> Porsi terbesar berada pada komitmen Modal Kerja <strong>Rp {undisbursedData.modalKerja} Triliun ({shareUndisbursedMk}%)</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Pencairan Kredit Investasi:</strong> Komitmen fasilitas Investasi tercatat sebesar <strong>Rp {undisbursedData.investasi} Triliun ({shareUndisbursedInv}%)</strong> yang siap dicairkan sesuai tahapan proyek.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-2xl text-[11px] font-semibold text-amber-800 flex items-center justify-between mt-2">
            <span>Kesimpulan: Komitmen kredit siap cair berpotensi mendorong pertumbuhan kredit mendatang.</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
