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
import KreditJenisView from '../components/KreditJenisView';
import DpkView from '../components/DpkView';
import OverviewDashboard from '../components/OverviewDashboard';
import LoginPage from '../components/LoginPage';

import { useDashboardState } from '../hooks/useDashboardState';

export default function Home() {
  const {
    isAuthenticated,
    currentUser,
    login,
    logout,
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

  // Tab change handler that automatically presets the correct sheet
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (activeFile) {
      if (tab === 'bank_umum') {
        const sheet = Object.keys(activeFile.sheets).find(
          (s) => s.toLowerCase().includes('bank') || s.toLowerCase().includes('umum')
        );
        if (sheet) {
          handleSheetChange(sheet);
        }
      } else if (tab === 'kredit_jenis') {
        const sheet = Object.keys(activeFile.sheets).find(
          (s) => s.toLowerCase().includes('kredit') || s.toLowerCase().includes('jenis')
        );
        if (sheet) {
          handleSheetChange(sheet);
        }
      } else if (tab === 'dpk_portofolio') {
        const sheet = Object.keys(activeFile.sheets).find(
          (s) => s.toLowerCase().includes('dpk') || s.toLowerCase().includes('portofolio')
        );
        if (sheet) {
          handleSheetChange(sheet);
        }
      }
    }
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
                onClick={() => setActiveTab('bank_umum_upload')}
                className="flex items-center gap-1.5 bg-[#C61E1E] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#A31818] transition-colors"
              >
                <Upload size={14} />
                <span>Upload Sekarang</span>
              </button>
            </div>
          );
        }

        return (
          <motion.div {...pageTransition}>
            <OverviewDashboard activeFile={activeFile} onNavigateTab={handleTabChange} />
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

      case 'bank_umum_upload':
        return (
          <motion.div {...pageTransition}>
            <UploadCard
              onUpload={(file) => handleUpload(file, 'bank_umum')}
              activeFile={activeFile}
              loading={loading}
              progress={uploadProgress}
              error={uploadError}
              onErrorClose={() => setUploadError(null)}
            />
          </motion.div>
        );

      case 'kredit_jenis_upload':
        return (
          <motion.div {...pageTransition}>
            <UploadCard
              onUpload={(file) => handleUpload(file, 'kredit_jenis')}
              activeFile={activeFile}
              loading={loading}
              progress={uploadProgress}
              error={uploadError}
              onErrorClose={() => setUploadError(null)}
            />
          </motion.div>
        );

      case 'dpk_portofolio_upload':
        return (
          <motion.div {...pageTransition}>
            <UploadCard
              onUpload={(file) => handleUpload(file, 'dpk_portofolio')}
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

      case 'bank_umum_history':
        return (
          <motion.div {...pageTransition}>
            <UploadHistory
              history={history.filter(h => h.category === 'bank_umum')}
              onLoadItem={(id) => loadHistoryItem(id, 'bank_umum')}
              onDeleteItem={deleteHistoryItem}
              activeFileName={activeFile?.name}
            />
          </motion.div>
        );

      case 'kredit_jenis_history':
        return (
          <motion.div {...pageTransition}>
            <UploadHistory
              history={history.filter(h => h.category === 'kredit_jenis')}
              onLoadItem={(id) => loadHistoryItem(id, 'kredit_jenis')}
              onDeleteItem={deleteHistoryItem}
              activeFileName={activeFile?.name}
            />
          </motion.div>
        );

      case 'dpk_portofolio_history':
        return (
          <motion.div {...pageTransition}>
            <UploadHistory
              history={history.filter(h => h.category === 'dpk_portofolio')}
              onLoadItem={(id) => loadHistoryItem(id, 'dpk_portofolio')}
              onDeleteItem={deleteHistoryItem}
              activeFileName={activeFile?.name}
            />
          </motion.div>
        );

      case 'bank_umum':
        if (!activeFile) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl p-8 max-w-xl mx-auto shadow-soft mt-8">
              <FileWarning size={36} className="text-[#C61E1E] opacity-40 mb-3 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada File Excel Aktif</h3>
              <p className="text-xs text-slate-400 text-center mt-1 mb-6">
                Unggah berkas laporan keuangan terlebih dahulu untuk mulai memanfaatkan panel analisis FINSIGHT.
              </p>
              <button
                onClick={() => setActiveTab('bank_umum_upload')}
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
            <YoyAnalysis 
              activeFile={activeFile}
              defaultSheet={filterState.sheet}
              hideSheetSelect={true}
            />
            {(() => {
              const tableSheet = activeFile.sheets[filterState.sheet] 
                || activeFile.sheets[activeFile.activeSheetName]
                || activeFile.sheets[activeFile.sheetNames[0]];
              return tableSheet ? <DataTable sheetData={tableSheet} /> : null;
            })()}
          </motion.div>
        );

      case 'kredit_jenis':
        return (
          <motion.div {...pageTransition}>
            <KreditJenisView activeFile={activeFile} />
          </motion.div>
        );

      case 'dpk_portofolio':
        return (
          <motion.div {...pageTransition}>
            <DpkView activeFile={activeFile} />
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

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Login - FINSIGHT Financial Data Visualization Dashboard OJK Jabar</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <LoginPage onLogin={login} />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>FINSIGHT - Financial Data Visualization Dashboard OJK Jabar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeFile={activeFile}
        currentUser={currentUser}
        onLogout={logout}
      >
        <AnimatePresence mode="wait">
          {renderActiveContent()}
        </AnimatePresence>
      </Layout>
    </>
  );
}
