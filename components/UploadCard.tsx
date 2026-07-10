import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  CheckCircle, 
  FileText, 
  BarChart3, 
  ListCollapse, 
  Database, 
  Calendar, 
  X, 
  FileWarning, 
  Download 
} from 'lucide-react';
import { formatBytes, downloadOjkTemplate } from '../services/excelService';
import { ActiveFile } from '../types/dashboard';

interface UploadCardProps {
  onUpload: (file: File) => void;
  activeFile: ActiveFile | null;
  loading: boolean;
  progress: number;
  error?: string | null;
  onErrorClose?: () => void;
}

export default function UploadCard({ 
  onUpload, 
  activeFile, 
  loading, 
  progress, 
  error, 
  onErrorClose 
}: UploadCardProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      onUpload(file);
    } else {
      alert('Format file tidak didukung. Harap upload file .xlsx atau .xls');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* 1. Validation Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 relative overflow-hidden"
          >
            <button 
              onClick={onErrorClose}
              className="absolute right-4 top-4 p-1 hover:bg-red-100 text-red-600 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#C61E1E] flex items-center justify-center shrink-0">
                <FileWarning size={20} />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-red-900">
                    ❌ Format Excel tidak sesuai.
                  </h3>
                  <p className="text-xs text-red-700 font-medium">
                    Silakan gunakan Template Excel OJK yang direkomendasikan sistem.
                  </p>
                </div>
                
                {/* Specific Validation Failure Reason */}
                <div className="bg-white/80 border border-red-100 p-3 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">Detail Kesalahan:</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">
                    {error}
                  </p>
                </div>

                {/* Download Template Button */}
                <button
                  onClick={downloadOjkTemplate}
                  className="flex items-center gap-2 bg-[#C61E1E] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#A31818] transition-colors shadow-sm"
                >
                  <Download size={14} />
                  <span>Download Template Excel OJK</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Upload Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-soft p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Unggah Laporan Keuangan OJK</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah berkas Excel yang mengikuti Template Resmi OJK Jawa Barat.
            </p>
          </div>
          
          <button
            onClick={downloadOjkTemplate}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
          >
            <Download size={13} />
            <span>Download Template</span>
          </button>
        </div>

        {/* Drag & Drop Container */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-[#C61E1E] bg-[#C61E1E]/5 scale-[1.01]' 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={loading}
          />
          
          <div className={`p-4 rounded-full bg-slate-50 text-slate-400 mb-4 transition-colors ${isDragActive ? 'text-[#C61E1E] bg-[#C61E1E]/10' : ''}`}>
            <UploadCloud size={32} />
          </div>

          <p className="text-sm font-semibold text-slate-700 mb-1">
            Drag & drop file Excel Anda di sini, atau <span className="text-[#C61E1E] hover:underline">pilih file</span>
          </p>
          <p className="text-xs text-slate-400">
            Mendukung format .xlsx dan .xls (maksimal 15MB)
          </p>
        </div>

        {/* Loading Progress Bar */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-2 overflow-hidden"
            >
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Memvalidasi format & memproses data keuangan...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#C61E1E]" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3. Success Metadata Display */}
      <AnimatePresence>
        {activeFile && !loading && !activeFile.validationError && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-soft p-8"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">✔ File Berhasil Diproses</h3>
                <p className="text-xs text-slate-500">Seluruh struktur data telah terverifikasi sesuai template resmi OJK</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* File name */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama File</span>
                  <p className="text-xs font-bold text-slate-800 truncate" title={activeFile.name}>
                    {activeFile.name}
                  </p>
                </div>
              </div>

              {/* Sheet count */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <ListCollapse size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Sheet</span>
                  <p className="text-xs font-bold text-slate-800">{activeFile.sheetNames.length} Sheet</p>
                </div>
              </div>

              {/* Indicator count */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Indikator</span>
                  <p className="text-xs font-bold text-slate-800">{activeFile.totalIndicators || 5} Indikator</p>
                </div>
              </div>

              {/* Period count */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Periode</span>
                  <p className="text-xs font-bold text-slate-800">{activeFile.totalPeriods || 12} Bulan</p>
                </div>
              </div>

              {/* Data points count */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <Database size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Data</span>
                  <p className="text-xs font-bold text-slate-800">{(activeFile.rowCount || 0).toLocaleString('id-ID')} Data</p>
                </div>
              </div>

              {/* File Size */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ukuran File</span>
                  <p className="text-xs font-bold text-slate-800">{formatBytes(activeFile.size)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
