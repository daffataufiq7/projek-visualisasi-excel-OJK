import React from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { FileWarning, Upload } from 'lucide-react';

import Layout from '../components/Layout';
import UploadCard from '../components/UploadCard';
import FilterArea from '../components/FilterArea';
import SummaryCards from '../components/SummaryCards';
import VisualizationArea from '../components/VisualizationArea';
import YearComparison from '../components/YearComparison';
import SheetSection from '../components/SheetSection';
import DataTable from '../components/DataTable';
import UploadHistory from '../components/UploadHistory';
import Settings from '../components/Settings';
import About from '../components/About';
import Reports from '../components/Reports';
import TemplateDownload from '../components/TemplateDownload';
import YoyAnalysis from '../components/YoyAnalysis';
import YoyDashboardWidget from '../components/YoyDashboardWidget';

import { useDashboardState } from '../hooks/useDashboardState';

export default function Home() {
  const {
    activeFile,
    history,
    activeTab,
    sidebarCollapsed,
    loading,
    uploadProgress,
    uploadError,
    setUploadError,
    filterState,
    setActiveTab,
    setSidebarCollapsed,
    handleUpload,
    deleteHistoryItem,
    loadHistoryItem,
    setFilterState,
    handleSheetChange,
  } = useDashboardState();

  // Unified filter change handler
  const handleFilterChange = (filters: any) => {
    setFilterState(prev => ({
      ...prev,
      ...filters
    }));
  };

  // Run filters button
  const handleApplyFilters = () => {
    // We already update filters reactively on change, but this button
    // provides a premium haptic confirmation for users.
    const audio = new Audio();
    // Silent success animation trigger
  };

  const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.35, ease: 'easeOut' }
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (!activeFile) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl p-8 max-w-xl mx-auto shadow-soft mt-8">
              <FileWarning size={36} className="text-[#C61E1E] opacity-40 mb-3 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada File Excel Aktif</h3>
              <p className="text-xs text-slate-400 text-center mt-1 mb-6">
                Unggah berkas laporan keuangan terlebih dahulu untuk mulai memanfaatkan panel analisis FINSIGHT.
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-1.5 bg-[#C61E1E] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#A31818] transition-colors"
              >
                <Upload size={14} />
                <span>Upload Sekarang</span>
              </button>
            </div>
          );
        }

        return (
          <motion.div {...pageTransition} className="space-y-6">
            {/* Filter Panel Area */}
            <FilterArea
              activeFile={activeFile}
              filterState={filterState}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onSheetChange={handleSheetChange}
            />

            {/* Total summary status cards */}
            <SummaryCards 
              activeFile={activeFile}
              filterState={filterState}
            />

            {/* Visualizer Canvas Area */}
            <div className="w-full">
              <VisualizationArea
                activeFile={activeFile}
                filterState={filterState}
              />
            </div>

            {/* YoY Nominal Growth Chart widget */}
            <div className="w-full">
              <YoyDashboardWidget
                activeFile={activeFile}
                filterState={filterState}
              />
            </div>

            {/* Annual YoY comparison sparklines cards */}
            <YearComparison
              activeFile={activeFile}
              filterState={filterState}
            />

            {/* Collapsible Per-Sheet details accordion list */}
            <SheetSection
              activeFile={activeFile}
              onActivateSheet={handleSheetChange}
            />

            {/* Preview Data Grid Table */}
            {activeFile.sheets[filterState.sheet] && (
              <DataTable 
                sheetData={activeFile.sheets[filterState.sheet]}
              />
            )}
          </motion.div>
        );

      case 'yoy':
        if (!activeFile) {
          return (
            <div className="text-center py-20 text-slate-400">
              <p className="text-xs font-semibold">Harap unggah file Excel terlebih dahulu</p>
            </div>
          );
        }
        return (
          <motion.div {...pageTransition}>
            <YoyAnalysis activeFile={activeFile} />
          </motion.div>
        );

      case 'upload':
        return (
          <motion.div {...pageTransition}>
            <UploadCard
              onUpload={handleUpload}
              activeFile={activeFile}
              loading={loading}
              progress={uploadProgress}
              error={uploadError}
              onErrorClose={() => setUploadError(null)}
            />
          </motion.div>
        );

      case 'template':
        return (
          <motion.div {...pageTransition}>
            <TemplateDownload />
          </motion.div>
        );

      case 'history':
        return (
          <motion.div {...pageTransition}>
            <UploadHistory
              history={history}
              onLoadItem={loadHistoryItem}
              onDeleteItem={deleteHistoryItem}
              activeFileName={activeFile?.name}
            />
          </motion.div>
        );

      case 'visualisasi':
        if (!activeFile) {
          return (
            <div className="text-center py-20 text-slate-400">
              <p className="text-xs font-semibold">Harap unggah file Excel terlebih dahulu</p>
            </div>
          );
        }
        return (
          <motion.div {...pageTransition} className="space-y-6">
            <FilterArea
              activeFile={activeFile}
              filterState={filterState}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onSheetChange={handleSheetChange}
            />
            <VisualizationArea
              activeFile={activeFile}
              filterState={filterState}
            />
          </motion.div>
        );

      case 'laporan':
        if (!activeFile) {
          return (
            <div className="text-center py-20 text-slate-400">
              <p className="text-xs font-semibold">Harap unggah file Excel terlebih dahulu</p>
            </div>
          );
        }
        return (
          <motion.div {...pageTransition}>
            <Reports
              activeFile={activeFile}
              filterState={filterState}
            />
          </motion.div>
        );

      case 'pengaturan':
        return (
          <motion.div {...pageTransition}>
            <Settings />
          </motion.div>
        );

      case 'tentang':
        return (
          <motion.div {...pageTransition}>
            <About />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>FINSIGHT - Financial Data Visualization Dashboard OJK Jabar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeFile={activeFile}
      >
        <AnimatePresence mode="wait">
          {renderActiveContent()}
        </AnimatePresence>
      </Layout>
    </>
  );
}
