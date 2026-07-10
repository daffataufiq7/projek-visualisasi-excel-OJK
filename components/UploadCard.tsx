import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, FileText, BarChart3, ListCollapse, Database, Calendar } from 'lucide-react';
import { formatBytes } from '../services/excelService';
import { ActiveFile } from '../types/dashboard';

interface UploadCardProps {
  onUpload: (file: File) => void;
  activeFile: ActiveFile | null;
  loading: boolean;
  progress: number;
}

export default function UploadCard({ onUpload, activeFile, loading, progress }: UploadCardProps) {
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
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-soft p-8"
      >
        <h2 className="text-lg font-bold text-slate-800 mb-2">Unggah File Keuangan</h2>
        <p className="text-sm text-slate-500 mb-6">
          Unggah dokumen laporan keuangan berformat Microsoft Excel (.xls, .xlsx) untuk divisualisasikan secara instan.
        </p>

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
                <span>Memproses file keuangan...</span>
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

      {/* Success Metadata Display */}
      <AnimatePresence>
        {activeFile && !loading && (
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
                <h3 className="text-sm font-bold text-slate-800">File Berhasil Diproses</h3>
                <p className="text-xs text-slate-500">Seluruh data telah divalidasi dan siap divisualisasikan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* File details card */}
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

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <ListCollapse size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Sheet</span>
                  <p className="text-xs font-bold text-slate-800">{activeFile.sheetNames.length} Sheet</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <Database size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Baris</span>
                  <p className="text-xs font-bold text-slate-800">{activeFile.rowCount} Baris Data</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ukuran File</span>
                  <p className="text-xs font-bold text-slate-800">{formatBytes(activeFile.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100/50">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tanggal Upload</span>
                  <p className="text-xs font-bold text-slate-800">{activeFile.uploadDate}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
