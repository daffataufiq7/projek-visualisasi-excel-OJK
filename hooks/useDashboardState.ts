import { useState, useEffect, useMemo, useCallback } from 'react';
import { ActiveFile, FilterState, UploadHistoryItem } from '../types/dashboard';
import { parseExcelFile, generateMockFile } from '../services/excelService';

const LOCAL_STORAGE_HISTORY_KEY = 'finsight_upload_history';
const LOCAL_STORAGE_ACTIVE_IDS_KEY = 'finsight_active_file_ids';

export function useDashboardState() {
  const [activeFileIds, setActiveFileIds] = useState<{ [category: string]: string }>({
    bank_umum: 'default-mock-bank',
    kredit_jenis: 'default-mock-kredit',
    dpk_portofolio: 'default-mock-dpk',
  });
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [filterStates, setFilterStates] = useState<{ [category: string]: FilterState }>({
    bank_umum: {
      sheet: '', year: 'All', month: 'All', xAxis: 'period', yAxis: [], chartType: 'bar',
      selectedYears: [], selectedMonths: []
    },
    kredit_jenis: {
      sheet: '', year: 'All', month: 'All', xAxis: 'period', yAxis: [], chartType: 'bar',
      selectedYears: [], selectedMonths: []
    },
    dpk_portofolio: {
      sheet: '', year: 'All', month: 'All', xAxis: 'period', yAxis: [], chartType: 'bar',
      selectedYears: [], selectedMonths: []
    },
  });

  const getActiveCategory = (tab: string) => {
    if (tab.startsWith('kredit_jenis')) return 'kredit_jenis';
    if (tab.startsWith('dpk_portofolio')) return 'dpk_portofolio';
    return 'bank_umum';
  };

  const activeCategory = getActiveCategory(activeTab);
  const filterState = filterStates[activeCategory];

  const setFilterState = (update: Partial<FilterState> | ((prev: FilterState) => FilterState)) => {
    setFilterStates(prev => {
      const current = prev[activeCategory];
      const next = typeof update === 'function' ? update(current) : { ...current, ...update };
      return {
        ...prev,
        [activeCategory]: next
      };
    });
  };

  const activeFile = useMemo(() => {
    const activeId = activeFileIds[activeCategory];
    const item = history.find(h => h.id === activeId);
    return item?.fileData || null;
  }, [activeCategory, activeFileIds, history]);

  // Unified mock item definitions
  const defaultMockItems = useMemo(() => {
    const mockFile = generateMockFile();
    const initialHistoryBankUmum: UploadHistoryItem = {
      id: 'default-mock-bank',
      name: mockFile.name,
      size: mockFile.size,
      sheetCount: mockFile.sheetNames.length,
      rowCount: mockFile.rowCount,
      uploadDate: mockFile.uploadDate,
      status: 'success',
      fileData: mockFile,
      category: 'bank_umum',
      isSample: true,
    };

    const mockKreditFile = { ...mockFile, name: 'Data Sampel Kredit.xlsx', isSample: true };
    const initialHistoryKredit: UploadHistoryItem = {
      id: 'default-mock-kredit',
      name: mockKreditFile.name,
      size: mockKreditFile.size,
      sheetCount: mockKreditFile.sheetNames.length,
      rowCount: mockKreditFile.rowCount,
      uploadDate: mockKreditFile.uploadDate,
      status: 'success',
      fileData: mockKreditFile,
      category: 'kredit_jenis',
      isSample: true,
    };

    const mockDpkFile = { ...mockFile, name: 'Data Sampel DPK.xlsx', isSample: true };
    const initialHistoryDpk: UploadHistoryItem = {
      id: 'default-mock-dpk',
      name: mockDpkFile.name,
      size: mockDpkFile.size,
      sheetCount: mockDpkFile.sheetNames.length,
      rowCount: mockDpkFile.rowCount,
      uploadDate: mockDpkFile.uploadDate,
      status: 'success',
      fileData: mockDpkFile,
      category: 'dpk_portofolio',
      isSample: true,
    };

    return [initialHistoryBankUmum, initialHistoryKredit, initialHistoryDpk];
  }, []);

  // Sync with Server API (/api/data) to align Localhost & Ngrok users in real-time,
  // while preserving local user uploads on Vercel/production!
  const fetchServerState = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        const serverHistory = data.history || [];
        const serverActiveFileIds = data.activeFileIds || {};

        // Read local user uploads from localStorage
        const storedLocalHistoryRaw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
        let localUserUploads: UploadHistoryItem[] = [];
        if (storedLocalHistoryRaw) {
          try {
            const parsed = JSON.parse(storedLocalHistoryRaw) as UploadHistoryItem[];
            localUserUploads = parsed.filter(
              h => h.id !== 'default-mock' && h.id !== 'default-mock-bank' && h.id !== 'default-mock-kredit' && h.id !== 'default-mock-dpk'
            );
          } catch (e) {
            localUserUploads = [];
          }
        }

        const cleanedServerHistory = serverHistory.filter(
          (h: any) => h.id !== 'default-mock' && h.id !== 'default-mock-bank' && h.id !== 'default-mock-kredit' && h.id !== 'default-mock-dpk'
        );

        // Merge local user uploads with server history (local uploads take precedence)
        const mergedUserHistoryMap = new Map<string, UploadHistoryItem>();
        [...cleanedServerHistory, ...localUserUploads].forEach(item => {
          if (item && item.id) {
            mergedUserHistoryMap.set(item.id, item);
          }
        });
        const mergedUserUploads = Array.from(mergedUserHistoryMap.values());

        const combinedHistory = [...defaultMockItems, ...mergedUserUploads];
        setHistory(combinedHistory);

        // Restore active IDs from localStorage if available
        const storedActiveIdsRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_IDS_KEY);
        let localActiveIds = {};
        if (storedActiveIdsRaw) {
          try { localActiveIds = JSON.parse(storedActiveIdsRaw); } catch(e){}
        }

        setActiveFileIds(prev => ({
          ...prev,
          ...serverActiveFileIds,
          ...localActiveIds
        }));

        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(combinedHistory));
      }
    } catch (err) {
      console.warn('API sync failed, falling back to localStorage:', err);
    }
  }, [defaultMockItems]);

  // Load initial data & start auto-sync polling
  useEffect(() => {
    const mockFile = generateMockFile();
    const sheetBank = mockFile.sheetNames[0] || '';

    setFilterStates({
      bank_umum: {
        sheet: sheetBank, year: 'All', month: 'All', xAxis: 'period',
        yAxis: mockFile.sheets[sheetBank]?.indicators || [], chartType: 'bar',
        selectedYears: [], selectedMonths: []
      },
      kredit_jenis: {
        sheet: 'Kredit per Jenis Penggunaan', year: 'All', month: 'All', xAxis: 'period',
        yAxis: [], chartType: 'bar',
        selectedYears: [], selectedMonths: []
      },
      dpk_portofolio: {
        sheet: 'DPK per Portofolio', year: 'All', month: 'All', xAxis: 'period',
        yAxis: [], chartType: 'bar',
        selectedYears: [], selectedMonths: []
      },
    });

    // Try reading active file IDs from localStorage first
    const storedActiveIds = localStorage.getItem(LOCAL_STORAGE_ACTIVE_IDS_KEY);
    if (storedActiveIds) {
      try {
        const parsed = JSON.parse(storedActiveIds);
        if (parsed && typeof parsed === 'object') {
          setActiveFileIds(prev => ({
            ...prev,
            ...parsed
          }));
        }
      } catch (e) {}
    }

    // Try reading localStorage first for immediate render
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory) as UploadHistoryItem[];
        const cleanedHistory = parsedHistory.filter(
          h => h.id !== 'default-mock' && h.id !== 'default-mock-bank' && h.id !== 'default-mock-kredit' && h.id !== 'default-mock-dpk'
        );
        setHistory([...defaultMockItems, ...cleanedHistory]);
      } catch (e) {
        setHistory(defaultMockItems);
      }
    } else {
      setHistory(defaultMockItems);
    }

    // Sync with Server API immediately
    fetchServerState();

    // Set up auto-sync polling every 3 seconds
    const syncInterval = setInterval(() => {
      fetchServerState();
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [defaultMockItems, fetchServerState]);

  // Auto-populate filterState.yAxis (select all indicators) whenever the active file changes
  // This handles: server sync switching activeFileIds, loadHistoryItem, and initial load
  useEffect(() => {
    const categories = ['bank_umum', 'kredit_jenis', 'dpk_portofolio'] as const;
    setFilterStates(prev => {
      let changed = false;
      const next = { ...prev };
      for (const cat of categories) {
        const activeId = activeFileIds[cat];
        const item = history.find(h => h.id === activeId);
        if (!item?.fileData) continue;
        const file = item.fileData;
        const currentFilter = prev[cat];
        // Determine the correct sheet (use stored sheet if valid, else first sheet)
        const sheet = file.sheetNames.includes(currentFilter.sheet)
          ? currentFilter.sheet
          : (file.sheetNames[0] || '');
        const sheetData = file.sheets[sheet];
        if (!sheetData) continue;
        const allIndicators = sheetData.indicators || [];
        // Only update if yAxis is empty OR the file has changed (indicators differ)
        if (currentFilter.yAxis.length === 0 || currentFilter.sheet !== sheet) {
          next[cat] = {
            ...currentFilter,
            sheet,
            yAxis: allIndicators,
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeFileIds, history]);

  // Handle Excel Upload
  const handleUpload = async (file: File, redirectTab: string = 'bank_umum') => {
    setLoading(true);
    setUploadProgress(10);
    setUploadError(null);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const parsedFile = await parseExcelFile(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(async () => {
        const newId = `${Date.now()}-${file.name}`;
        const newItem: UploadHistoryItem = {
          id: newId,
          name: file.name,
          size: file.size,
          sheetCount: parsedFile.sheetNames.length,
          rowCount: parsedFile.rowCount,
          uploadDate: new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: 'success',
          fileData: parsedFile,
          category: redirectTab,
        };

        const updatedHistory = [newItem, ...history.filter(h => h.name !== file.name)];
        setHistory(updatedHistory);
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

        const updatedActiveIds = {
          ...activeFileIds,
          [redirectTab]: newId,
        };
        setActiveFileIds(updatedActiveIds);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_IDS_KEY, JSON.stringify(updatedActiveIds));

        // Sync uploaded data to Next.js server so Ngrok users see it instantly!
        try {
          await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              historyItem: newItem,
              activeFileIds: { [redirectTab]: newId }
            })
          });
        } catch (err) {
          console.warn('Failed to sync upload to server API:', err);
        }

        const firstSheet = parsedFile.sheetNames[0];
        const sheetData = parsedFile.sheets[firstSheet];

        setFilterStates(prev => ({
          ...prev,
          [redirectTab]: {
            sheet: firstSheet,
            year: 'All',
            month: 'All',
            xAxis: 'period',
            yAxis: sheetData?.indicators || [],
            chartType: 'bar',
            overlayRatio: false,
            selectedYears: [],
            selectedMonths: [],
          }
        }));

        setLoading(false);
        setActiveTab(redirectTab);
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setLoading(false);
      const errMsg = error instanceof Error ? error.message : 'Format template tidak sesuai';
      setUploadError(errMsg);

      const failedItem: UploadHistoryItem = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        sheetCount: 0,
        rowCount: 0,
        uploadDate: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'failed',
        errorMessage: errMsg,
        category: redirectTab,
        fileData: {
          name: file.name,
          size: file.size,
          sheetNames: [],
          sheets: {},
          activeSheetName: '',
          uploadDate: new Date().toLocaleDateString('id-ID'),
          rowCount: 0,
          totalIndicators: 0,
          totalPeriods: 0,
          validationError: errMsg
        }
      };

      const updatedHistory = [failedItem, ...history.filter(h => h.name !== file.name)];
      setHistory(updatedHistory);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

      alert('Gagal memproses file Excel:\n' + (error instanceof Error ? error.message : 'Format tidak didukung'));
    }
  };

  // Delete History Item
  const deleteHistoryItem = async (id: string) => {
    if (id === 'default-mock-bank' || id === 'default-mock-kredit' || id === 'default-mock-dpk') {
      alert('File sampel default tidak dapat dihapus');
      return;
    }
    const targetItem = history.find(h => h.id === id);
    const category = targetItem?.category || 'bank_umum';

    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

    try {
      await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.warn('Failed to sync deletion to server API:', err);
    }

    if (activeFileIds[category] === id) {
      const defaultId = category === 'kredit_jenis' ? 'default-mock-kredit' : category === 'dpk_portofolio' ? 'default-mock-dpk' : 'default-mock-bank';
      const newActive = {
        ...activeFileIds,
        [category]: defaultId
      };
      setActiveFileIds(newActive);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_IDS_KEY, JSON.stringify(newActive));

      const mockItem = updatedHistory.find(h => h.id === defaultId);
      if (mockItem && mockItem.fileData) {
        const sheet = mockItem.fileData.sheetNames[0];
        setFilterStates(prev => ({
          ...prev,
          [category]: {
            sheet,
            year: 'All',
            month: 'All',
            xAxis: 'period',
            yAxis: mockItem.fileData?.sheets[sheet]?.indicators || [],
            chartType: 'bar',
            overlayRatio: false,
            selectedYears: [],
            selectedMonths: [],
          }
        }));
      }
    }
  };

  // Load File from History
  const loadHistoryItem = async (id: string, redirectTab: string = 'bank_umum') => {
    const item = history.find(h => h.id === id);
    if (item && item.status === 'success' && item.fileData) {
      const file = item.fileData;
      const sheet = file.sheetNames[0];

      const newActive = {
        ...activeFileIds,
        [redirectTab]: id
      };
      setActiveFileIds(newActive);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_IDS_KEY, JSON.stringify(newActive));

      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activeFileIds: { [redirectTab]: id }
          })
        });
      } catch (err) {
        console.warn('Failed to sync active file to server API:', err);
      }

      setFilterStates(prev => ({
        ...prev,
        [redirectTab]: {
          sheet,
          year: 'All',
          month: 'All',
          xAxis: 'period',
          yAxis: file.sheets[sheet]?.indicators || [],
          chartType: 'bar',
          overlayRatio: false,
          selectedYears: [],
          selectedMonths: [],
        }
      }));

      setActiveTab(redirectTab);
    } else if (item && item.status === 'failed') {
      alert(`File ini gagal diproses sebelumnya dengan error:\n${item.errorMessage}\n\nSilakan unggah kembali file tersebut.`);
    }
  };

  // Triggered when user changes the active sheet inside Filter
  const handleSheetChange = (sheetName: string) => {
    if (!activeFile) return;
    const sheetData = activeFile.sheets[sheetName];
    if (!sheetData) return;

    setFilterState({
      sheet: sheetName,
      xAxis: 'period',
      yAxis: sheetData.indicators,
      selectedYears: [],
      selectedMonths: [],
    });
  };

  return {
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
  };
}
