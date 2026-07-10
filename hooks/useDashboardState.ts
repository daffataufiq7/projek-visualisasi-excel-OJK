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
  const [filterState, setFilterState] = useState<FilterState>({
    sheet: '',
    year: 'All',
    month: 'All',
    xAxis: '',
    yAxis: [],
    chartType: 'bar',
  });

  // Load initial mock file & history on mount
  useEffect(() => {
    const mockFile = generateMockFile();
    setActiveFile(mockFile);
    
    // Set default filter state based on mock file
    const firstSheetName = mockFile.sheetNames[0];
    const sheetData = mockFile.sheets[firstSheetName];
    const defaultX = detectDefaultXAxis(sheetData);
    
    setFilterState({
      sheet: firstSheetName,
      year: 'All',
      month: 'All',
      xAxis: defaultX,
      yAxis: detectDefaultYAxis(sheetData, defaultX),
      chartType: 'bar',
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
        // Filter out any older mock entries to avoid duplicates, and prepend the active one
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

  // Helper to detect default X-axis
  function detectDefaultXAxis(sheetData: SheetData): string {
    const cols = sheetData.columns;
    // Prefer "Periode", "Bulan", "Tahun", "Tanggal"
    const priority = ['periode', 'tanggal', 'date', 'bulan', 'month', 'tahun', 'year'];
    for (const term of priority) {
      const match = cols.find(c => c.toLowerCase() === term || c.toLowerCase().includes(term));
      if (match) return match;
    }
    // Fallback to first categorical column
    if (sheetData.categoricalColumns.length > 0) {
      return sheetData.categoricalColumns[0];
    }
    // Universal fallback
    return cols[0] || '';
  }

  // Helper to detect default Y-axis (ensures it is never empty)
  function detectDefaultYAxis(sheetData: SheetData, defaultX: string): string[] {
    if (sheetData.numericColumns.length > 0) {
      return sheetData.numericColumns.slice(0, 3);
    }
    const fallback = sheetData.columns.filter(c => c !== defaultX);
    return fallback.slice(0, 3);
  }

  // Handle Excel Upload
  const handleUpload = async (file: File) => {
    setLoading(true);
    setUploadProgress(10);
    
    // Simulate upload progress
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
      
      // Delay slightly for visual effect
      setTimeout(() => {
        setActiveFile(parsedFile);
        
        // Reset filters for new file
        const firstSheet = parsedFile.sheetNames[0];
        const sheetData = parsedFile.sheets[firstSheet];
        const defaultX = detectDefaultXAxis(sheetData);
        const defaultY = detectDefaultYAxis(sheetData, defaultX);

        setFilterState({
          sheet: firstSheet,
          year: 'All',
          month: 'All',
          xAxis: defaultX,
          yAxis: defaultY,
          chartType: 'bar',
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
      alert('Gagal memproses file Excel: ' + (error instanceof Error ? error.message : 'Format tidak didukung'));
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
      const defaultX = detectDefaultXAxis(mock.sheets[sheet]);
      setFilterState({
        sheet,
        year: 'All',
        month: 'All',
        xAxis: defaultX,
        yAxis: detectDefaultYAxis(mock.sheets[sheet], defaultX),
        chartType: 'bar',
      });
    }
  };

  // Load File from History
  const loadHistoryItem = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      const file = item.fileData;
      setActiveFile(file);
      const sheet = file.sheetNames[0];
      const defaultX = detectDefaultXAxis(file.sheets[sheet]);
      setFilterState({
        sheet,
        year: 'All',
        month: 'All',
        xAxis: defaultX,
        yAxis: detectDefaultYAxis(file.sheets[sheet], defaultX),
        chartType: 'bar',
      });
      setActiveTab('dashboard');
    }
  };

  // Triggered when user changes the active sheet inside Filter
  const handleSheetChange = (sheetName: string) => {
    if (!activeFile) return;
    const sheetData = activeFile.sheets[sheetName];
    if (!sheetData) return;

    const defaultX = detectDefaultXAxis(sheetData);
    setFilterState(prev => ({
      ...prev,
      sheet: sheetName,
      xAxis: defaultX,
      yAxis: detectDefaultYAxis(sheetData, defaultX),
    }));
  };

  return {
    activeFile,
    history,
    activeTab,
    sidebarCollapsed,
    loading,
    uploadProgress,
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
