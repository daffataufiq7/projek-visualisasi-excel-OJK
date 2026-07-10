import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Database, Key, Server, RefreshCw } from 'lucide-react';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api/v1/parse-excel');
  const [apiKey, setApiKey] = useState('ojk_jabar_sec_token_xxxxxxxx');
  const [threshold, setThreshold] = useState(70);
  const [saveStatus, setSaveStatus] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
      alert('Pengaturan berhasil diperbarui secara lokal');
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
        <SettingsIcon size={18} className="text-[#C61E1E]" />
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Pengaturan Sistem Dashboard</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Konfigurasi parameter visualisasi, ambang batas deteksi, dan integrasi backend API
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Backend API Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Server size={16} className="text-[#C61E1E]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Integrasi API Backend (Untuk Masa Depan)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoint Parser Excel</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
                placeholder="https://api.ojk.go.id/v1/parse"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kunci API / Bearer Token</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
                />
                <Key size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            * Menyiapkan hook endpoint agar di kemudian hari server Backend (NodeJS/Python) dapat menggantikan parser client-side untuk pengolahan file raksasa atau enkripsi database.
          </p>
        </div>

        {/* SECTION 2: Advanced Parsing Rules */}
        <div className="space-y-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-slate-700">
            <Database size={16} className="text-[#C61E1E]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Ambang Batas Deteksi Struktur (Threshold)</h4>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Akurasi Klasifikasi Numerik</span>
              <span className="text-[#C61E1E]">{threshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C61E1E]"
            />
            <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
              Toleransi minimal persentase angka pada suatu kolom untuk dideteksi sebagai nilai numerik grafik (default: 70%).
            </p>
          </div>
        </div>

        {/* Form Action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <button
            type="button"
            onClick={() => {
              if (confirm('Apakah Anda ingin mereset pengaturan ke default?')) {
                setApiUrl('http://localhost:8000/api/v1/parse-excel');
                setApiKey('ojk_jabar_sec_token_xxxxxxxx');
                setThreshold(70);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={14} />
            Reset Default
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 bg-[#C61E1E] hover:bg-[#A31818] text-white py-2.5 px-5 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950/15"
          >
            <Save size={14} />
            {saveStatus ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
