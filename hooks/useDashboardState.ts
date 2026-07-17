import { useState, useEffect } from 'react';
import { ActiveFile, FilterState, UploadHistoryItem, SheetData } from '../types/dashboard';
import { parseExcelFile, generateMockFile } from '../services/excelService';

const LOCAL_STORAGE_HISTORY_KEY = 'finsight_upload_history';

export function useDashboardState() {
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({
    sheet: '',
    year: 'All',
    month: 'All',
    xAxis: 'period',
    yAxis: [],
    chartType: 'bar',
    overlayRatio: false,
  });

  // Load initial mock file & history on mount
  useEffect(() => {
    const mockFile = generateMockFile();
    setActiveFile(mockFile);

    // Set default filter state based on mock file
    const firstSheetName = mockFile.sheetNames[0];
    const sheetData = mockFile.sheets[firstSheetName];

    setFilterState({
      sheet: firstSheetName,
      year: 'All',
      month: 'All',
      xAxis: 'period',
      yAxis: sheetData.indicators,
      chartType: 'bar',
      overlayRatio: false,
    });

    // Populate history with the default mock file
    const initialHistoryItem: UploadHistoryItem = {
      id: 'default-mock',
      name: mockFile.name,
      size: mockFile.size,
      sheetCount: mockFile.sheetNames.length,
      rowCount: mockFile.rowCount,
      uploadDate: mockFile.uploadDate,
      status: 'success',
      fileData: mockFile,
    };

    const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory) as UploadHistoryItem[];
        const cleanedHistory = parsedHistory.filter(h => h.id !== 'default-mock');
        setHistory([initialHistoryItem, ...cleanedHistory]);
      } catch (e) {
        setHistory([initialHistoryItem]);
      }
    } else {
      setHistory([initialHistoryItem]);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify([initialHistoryItem]));
    }
  }, []);

  // Handle Excel Upload
  const handleUpload = async (file: File) => {
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

      setTimeout(() => {
        setActiveFile(parsedFile);

        // Reset filters for new file
        const firstSheet = parsedFile.sheetNames[0];
        const sheetData = parsedFile.sheets[firstSheet];

        setFilterState({
          sheet: firstSheet,
          year: 'All',
          month: 'All',
          xAxis: 'period',
          yAxis: sheetData.indicators,
          chartType: 'bar',
          overlayRatio: false,
        });

        // Add to history
        const newItem: UploadHistoryItem = {
          id: `${Date.now()}-${file.name}`,
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
        };

        const updatedHistory = [newItem, ...history.filter(h => h.name !== file.name)];
        setHistory(updatedHistory);
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

        setLoading(false);
        setActiveTab('dashboard'); // Redirect to dashboard to show upload results
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setLoading(false);
      const errMsg = error instanceof Error ? error.message : 'Format template tidak sesuai';
      setUploadError(errMsg);

      // Save failed upload attempt in history for visibility
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
        errorMessage: error instanceof Error ? error.message : 'Format template tidak sesuai',
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
          validationError: error instanceof Error ? error.message : 'Format template tidak sesuai'
        }
      };

      const updatedHistory = [failedItem, ...history.filter(h => h.name !== file.name)];
      setHistory(updatedHistory);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

      alert('Gagal memproses file Excel:\n' + (error instanceof Error ? error.message : 'Format tidak didukung'));
    }
  };

  // Delete History Item
  const deleteHistoryItem = (id: string) => {
    if (id === 'default-mock') {
      alert('File sampel default tidak dapat dihapus');
      return;
    }
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

    // If deleting currently active file, fall back to default mock
    if (activeFile && history.find(h => h.id === id)?.name === activeFile.name) {
      const mock = history.find(h => h.id === 'default-mock')?.fileData || generateMockFile();
      setActiveFile(mock);
      const sheet = mock.sheetNames[0];
      setFilterState({
        sheet,
        year: 'All',
        month: 'All',
        xAxis: 'period',
        yAxis: mock.sheets[sheet].indicators,
        chartType: 'bar',
        overlayRatio: false,
      });
    }
  };

  // Load File from History
  const loadHistoryItem = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item && item.status === 'success') {
      const file = item.fileData;
      setActiveFile(file);
      const sheet = file.sheetNames[0];
      setFilterState({
        sheet,
        year: 'All',
        month: 'All',
        xAxis: 'period',
        yAxis: file.sheets[sheet].indicators,
        chartType: 'bar',
        overlayRatio: false,
      });
      setActiveTab('dashboard');
    } else if (item && item.status === 'failed') {
      alert(`File ini gagal diproses sebelumnya dengan error:\n${item.errorMessage}\n\nSilakan unggah kembali (upload ulang) file tersebut agar diproses oleh parser baru yang lebih fleksibel.`);
    }
  };

  // Triggered when user changes the active sheet inside Filter
  const handleSheetChange = (sheetName: string) => {
    if (!activeFile) return;
    const sheetData = activeFile.sheets[sheetName];
    if (!sheetData) return;

    setFilterState(prev => ({
      ...prev,
      sheet: sheetName,
      xAxis: 'period',
      yAxis: sheetData.indicators,
    }));
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
