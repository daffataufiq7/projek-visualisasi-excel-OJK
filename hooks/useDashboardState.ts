import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ActiveFile, FilterState, UploadHistoryItem, UserProfile } from '../types/dashboard';
import { parseExcelFile, generateMockFile } from '../services/excelService';
import { 
  saveHistoryToDB, 
  loadHistoryFromDB, 
  saveActiveIdsToDB, 
  loadActiveIdsFromDB 
} from '../utils/dbStorage';

const LOCAL_STORAGE_HISTORY_KEY = 'finsight_upload_history';
const LOCAL_STORAGE_ACTIVE_IDS_KEY = 'finsight_active_file_ids';
const LOCAL_STORAGE_DELETED_IDS_KEY = 'finsight_deleted_file_ids';

// Per-user key helpers — isolate each user's data in localStorage
const historyKey = (userId?: string) => userId ? `${LOCAL_STORAGE_HISTORY_KEY}_${userId}` : LOCAL_STORAGE_HISTORY_KEY;
const activeIdsKey = (userId?: string) => userId ? `${LOCAL_STORAGE_ACTIVE_IDS_KEY}_${userId}` : LOCAL_STORAGE_ACTIVE_IDS_KEY;
const deletedIdsKey = (userId?: string) => userId ? `${LOCAL_STORAGE_DELETED_IDS_KEY}_${userId}` : LOCAL_STORAGE_DELETED_IDS_KEY;
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes auto logout on idle

const getDeletedIds = (userId?: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(deletedIdsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const recordDeletedId = (id: string, userId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedIds(userId);
    if (!current.includes(id)) {
      localStorage.setItem(deletedIdsKey(userId), JSON.stringify([...current, id]));
    }
  } catch (e) {}
};

export const PRESET_USERS: UserProfile[] = [
  {
    id: 'daffataufiq@ojk.go.id',
    name: 'Daffa Taufiq',
    email: 'daffataufiq@ojk.go.id',
    role: 'Admin OJK Jabar',
    avatarInitials: 'DT',
    agency: 'UNY'
  },
  {
    id: 'ratukhansa@ojk.go.id',
    name: 'Ratukhansa Salsabila',
    email: 'ratukhansa@ojk.go.id',
    role: 'Analis Perbankan OJK',
    avatarInitials: 'RS',
    agency: 'ITB'
  },
  {
    id: 'naufalhanif@ojk.go.id',
    name: 'Naufal Hanif R.',
    email: 'naufalhanif@ojk.go.id',
    role: 'Analis Perbankan OJK',
    avatarInitials: 'NH',
    agency: 'UNY'
  },
  {
    id: 'anggabaihaki@ojk.go.id',
    name: 'Angga Baihaki Y.',
    email: 'anggabaihaki@ojk.go.id',
    role: 'Analis Perbankan OJK',
    avatarInitials: 'AB',
    agency: 'UNY'
  },
  {
    id: 'banganazwa@ojk.go.id',
    name: 'Bunga Nazwa S.',
    email: 'banganazwa@ojk.go.id',
    role: 'Analis Perbankan OJK',
    avatarInitials: 'BN',
    agency: 'Telkom'
  }
];

export function useDashboardState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [customUsers, setCustomUsers] = useState<UserProfile[]>([]);

  // Load custom users from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('finsight_custom_users');
        if (raw) {
          setCustomUsers(JSON.parse(raw));
        }
      } catch (e) {}
    }
  }, []);

  const usersList = useMemo(() => {
    const combined = [...PRESET_USERS];
    customUsers.forEach(u => {
      if (!combined.some(p => p.id.toLowerCase() === u.id.toLowerCase() || p.email.toLowerCase() === u.email.toLowerCase())) {
        combined.push(u);
      }
    });
    return combined;
  }, [customUsers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('finsight_auth_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.email) {
            const foundUser = usersList.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());
            setIsAuthenticated(true);
            setCurrentUser(foundUser || {
              id: parsed.id || parsed.email,
              name: parsed.name || parsed.email,
              email: parsed.email,
              role: parsed.role || 'Staf Analis OJK',
              avatarInitials: (parsed.name || parsed.email).slice(0, 2).toUpperCase(),
              agency: parsed.agency || 'OJK'
            });
            // After restoring session, fetch per-user state from API + localStorage
            const uid = parsed.id || parsed.email;
            fetchServerState(uid);
          }
        } catch (e) {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersList]);

  const login = (nipOrEmail: string, password: string, name?: string, role?: string) => {
    const cleanInput = nipOrEmail.trim().toLowerCase();
    const foundUser = usersList.find(u => u.email.toLowerCase() === cleanInput || u.id.toLowerCase() === cleanInput);
    
    let userObj: UserProfile;
    if (foundUser) {
      userObj = foundUser;
    } else {
      userObj = {
        id: cleanInput,
        name: name || (cleanInput.includes('daffa') ? 'Daffa Taufiq' : nipOrEmail),
        email: nipOrEmail,
        role: role || 'Staf Analis OJK',
        avatarInitials: nipOrEmail.slice(0, 2).toUpperCase(),
        agency: 'OJK'
      };
    }
    
    const uid = userObj.id || userObj.email;

    // Immediately restore this user's saved activeFileIds from their own localStorage partition
    const savedActiveIds = localStorage.getItem(activeIdsKey(uid));
    if (savedActiveIds) {
      try {
        const parsed = JSON.parse(savedActiveIds);
        setActiveFileIds(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    } else {
      // Reset to defaults so no leftover IDs from previous user bleed through
      setActiveFileIds({
        bank_umum: 'default-mock-bank',
        kredit_jenis: 'default-mock-kredit',
        dpk_portofolio: 'default-mock-dpk',
        undisbursed_loan: 'default-mock-undisbursed',
      });
    }

    setIsAuthenticated(true);
    setCurrentUser(userObj);
    localStorage.setItem('finsight_auth_user', JSON.stringify(userObj));
  };

  const addUser = async (newUser: UserProfile) => {
    const updatedCustom = [...customUsers.filter(u => u.id !== newUser.id && u.email !== newUser.email), newUser];
    setCustomUsers(updatedCustom);
    if (typeof window !== 'undefined') {
      localStorage.setItem('finsight_custom_users', JSON.stringify(updatedCustom));
    }
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customUsers: updatedCustom })
      });
    } catch (e) {
      console.warn('Failed to sync custom users to server:', e);
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId.toLowerCase() === 'daffataufiq@ojk.go.id') {
      alert('Akun Utama Admin Daffa Taufiq tidak dapat dihapus');
      return;
    }

    const updatedCustom = customUsers.filter(u => u.id !== userId && u.email !== userId);
    setCustomUsers(updatedCustom);
    if (typeof window !== 'undefined') {
      localStorage.setItem('finsight_custom_users', JSON.stringify(updatedCustom));
    }
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customUsers: updatedCustom })
      });
    } catch (e) {
      console.warn('Failed to sync custom users to server:', e);
    }
  };

  const logout = (reason?: string) => {
    // Reset in-memory state so the next user starts clean
    setHistory([...defaultMockItems]);
    setActiveFileIds({
      bank_umum: 'default-mock-bank',
      kredit_jenis: 'default-mock-kredit',
      dpk_portofolio: 'default-mock-dpk',
      undisbursed_loan: 'default-mock-undisbursed',
    });
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('finsight_auth_user');
    if (reason && typeof window !== 'undefined') {
      localStorage.setItem('finsight_logout_reason', reason);
    }
  };

  // Auto Logout on 15 minutes Inactivity (Mouse, Keyboard, Scroll, Touch)
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity));

    const checkInterval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(checkInterval);
        logout('inactivity');
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(checkInterval);
    };
  }, [isAuthenticated]);

  const [activeFileIds, setActiveFileIds] = useState<{ [category: string]: string }>({
    bank_umum: 'default-mock-bank',
    kredit_jenis: 'default-mock-kredit',
    dpk_portofolio: 'default-mock-dpk',
    undisbursed_loan: 'default-mock-undisbursed',
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
    undisbursed_loan: {
      sheet: '', year: 'All', month: 'All', xAxis: 'period', yAxis: [], chartType: 'bar',
      selectedYears: [], selectedMonths: []
    },
  });

  const getActiveCategory = (tab: string) => {
    if (tab.startsWith('kredit_jenis')) return 'kredit_jenis';
    if (tab.startsWith('dpk_portofolio')) return 'dpk_portofolio';
    if (tab.startsWith('undisbursed_loan')) return 'undisbursed_loan';
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

  const userHistory = useMemo(() => {
    if (!currentUser) return history;
    const currentUserId = currentUser.id || currentUser.email;
    return history.filter(h => h.isSample || h.id.startsWith('default-mock') || h.userId === currentUserId || !h.userId);
  }, [history, currentUser]);

  const activeFile = useMemo(() => {
    const activeId = activeFileIds[activeCategory];
    const item = userHistory.find(h => h.id === activeId);
    return item?.fileData || null;
  }, [activeCategory, activeFileIds, userHistory]);

  const activeFiles = useMemo(() => {
    const result: { [category: string]: ActiveFile | null } = {};
    const categories = ['bank_umum', 'kredit_jenis', 'dpk_portofolio', 'undisbursed_loan'];
    categories.forEach(cat => {
      const activeId = activeFileIds[cat];
      const item = userHistory.find(h => h.id === activeId);
      result[cat] = item?.fileData || null;
    });
    return result;
  }, [activeFileIds, userHistory]);

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

    const mockUndisbursedFile = { ...mockFile, name: 'Data Sampel Undisbursed Loan.xlsx', isSample: true };
    const initialHistoryUndisbursed: UploadHistoryItem = {
      id: 'default-mock-undisbursed',
      name: mockUndisbursedFile.name,
      size: mockUndisbursedFile.size,
      sheetCount: mockUndisbursedFile.sheetNames.length,
      rowCount: mockUndisbursedFile.rowCount,
      uploadDate: mockUndisbursedFile.uploadDate,
      status: 'success',
      fileData: mockUndisbursedFile,
      category: 'undisbursed_loan',
      isSample: true,
    };

    return [initialHistoryBankUmum, initialHistoryKredit, initialHistoryDpk, initialHistoryUndisbursed];
  }, []);

  // Sync with Server API (/api/data) to align Localhost & Ngrok users in real-time,
  // while preserving local user uploads on Vercel/production!
  // Data is now fully partitioned per-user via userId-scoped localStorage keys.
  const fetchServerState = useCallback(async (forUserId?: string) => {
    try {
      const uid = forUserId;
      const res = await fetch(uid ? `/api/data?userId=${encodeURIComponent(uid)}` : '/api/data');
      if (res.ok) {
        const data = await res.json();
        const serverHistory: UploadHistoryItem[] = data.history || [];

        const deletedIds = getDeletedIds(uid);
        const isNotDeleted = (h: any) => h && h.id && !deletedIds.includes(h.id);
        const isMock = (id: string) => ['default-mock-bank','default-mock-kredit','default-mock-dpk','default-mock-undisbursed','default-mock'].includes(id);

        // Read per-user uploads from IndexedDB & user-scoped localStorage
        const dbItems = await loadHistoryFromDB();
        const storedLocalHistoryRaw = uid ? localStorage.getItem(historyKey(uid)) : null;

        // Only keep items that belong to this user (or have no userId — legacy)
        let localUserUploads: UploadHistoryItem[] = dbItems.filter((h: any) =>
          !h.isSample && isNotDeleted(h) && (!h.userId || !uid || h.userId === uid)
        );

        if (storedLocalHistoryRaw) {
          try {
            const parsed = JSON.parse(storedLocalHistoryRaw) as UploadHistoryItem[];
            const lsUploads = parsed.filter(h => !isMock(h.id) && isNotDeleted(h));
            lsUploads.forEach(item => {
              if (!localUserUploads.some(d => d.id === item.id)) {
                localUserUploads.push(item);
              }
            });
          } catch (e) {}
        }

        // Only include server history items belonging to this user
        const cleanedServerHistory = serverHistory.filter(
          (h: any) => !isMock(h.id) && isNotDeleted(h) && (!h.userId || !uid || h.userId === uid)
        );

        // Map existing fileData from memory & IndexedDB to prevent losing parsed Excel files
        const fileDataMap = new Map<string, ActiveFile>();
        dbItems.forEach((h: any) => { if (h?.id && h?.fileData) fileDataMap.set(h.id, h.fileData); });
        history.forEach(h => { if (h?.id && h?.fileData) fileDataMap.set(h.id, h.fileData); });

        // Merge: local uploads take precedence over server history
        const mergedMap = new Map<string, UploadHistoryItem>();
        [...cleanedServerHistory, ...localUserUploads].forEach(item => {
          if (item && item.id && isNotDeleted(item)) {
            if (!item.fileData && fileDataMap.has(item.id)) {
              item.fileData = fileDataMap.get(item.id)!;
            }
            mergedMap.set(item.id, item);
          }
        });
        const mergedUserUploads = Array.from(mergedMap.values());
        const combinedHistory = [...defaultMockItems, ...mergedUserUploads];
        setHistory(combinedHistory);

        // Restore per-user activeFileIds from their own localStorage partition
        const dbActiveIds = uid ? await loadActiveIdsFromDB(uid) : await loadActiveIdsFromDB();
        const storedActiveIdsRaw = uid ? localStorage.getItem(activeIdsKey(uid)) : localStorage.getItem(LOCAL_STORAGE_ACTIVE_IDS_KEY);
        let localActiveIds = dbActiveIds || {};
        if (storedActiveIdsRaw) {
          try { localActiveIds = { ...localActiveIds, ...JSON.parse(storedActiveIdsRaw) }; } catch(e){}
        }

        if (Object.keys(localActiveIds).length > 0) {
          setActiveFileIds(prev => ({ ...prev, ...localActiveIds }));
        }

        // Persist merged history back into the user-scoped partition
        saveHistoryToDB(combinedHistory);
        if (uid) {
          try {
            localStorage.setItem(historyKey(uid), JSON.stringify(combinedHistory));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('API sync failed, falling back to local DB:', err);
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
      undisbursed_loan: {
        sheet: 'Undisbursed Loan', year: 'All', month: 'All', xAxis: 'period',
        yAxis: [], chartType: 'bar',
        selectedYears: [], selectedMonths: []
      },
    });

    // Load active file IDs from IndexedDB / localStorage
    loadActiveIdsFromDB().then(dbActive => {
      const storedActiveIds = localStorage.getItem(LOCAL_STORAGE_ACTIVE_IDS_KEY);
      let combined = dbActive || {};
      if (storedActiveIds) {
        try { combined = { ...combined, ...JSON.parse(storedActiveIds) }; } catch(e){}
      }
      if (Object.keys(combined).length > 0) {
        setActiveFileIds(prev => ({ ...prev, ...combined }));
      }
    });

    // Load initial data from IndexedDB (no per-user filtering yet, user may not be set at mount time)
    loadHistoryFromDB().then(dbItems => {
      const userItems: UploadHistoryItem[] = dbItems.filter((h: any) => !h.isSample);
      setHistory([...defaultMockItems, ...userItems]);
    });

    // Sync with Server API immediately (no userId yet — will re-sync when user logs in)
    fetchServerState();

    // Set up auto-sync polling every 10 seconds
    const syncInterval = setInterval(() => {
      // Pass currentUser at call time via ref to avoid stale closure
      fetchServerState();
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [defaultMockItems, fetchServerState]);

  // Re-fetch per-user data whenever the logged-in user changes
  // This restores uploaded files & active selections after login
  useEffect(() => {
    if (currentUser) {
      const uid = currentUser.id || currentUser.email;
      fetchServerState(uid);

      // Also restore per-user activeFileIds from their own localStorage partition
      const savedActiveIds = localStorage.getItem(activeIdsKey(uid));
      if (savedActiveIds) {
        try {
          const parsed = JSON.parse(savedActiveIds);
          setActiveFileIds(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }

      // Restore per-user history from their own localStorage partition
      const savedHistory = localStorage.getItem(historyKey(uid));
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory) as UploadHistoryItem[];
          const userUploads = parsed.filter(h => !h.isSample && !h.id.startsWith('default-mock'));
          if (userUploads.length > 0) {
            setHistory(prev => {
              const mockItems = prev.filter(h => h.isSample || h.id.startsWith('default-mock'));
              const merged = new Map<string, UploadHistoryItem>();
              mockItems.forEach(h => merged.set(h.id, h));
              userUploads.forEach(h => merged.set(h.id, h));
              return Array.from(merged.values());
            });
          }
        } catch (e) {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Auto-populate filterState.yAxis (select all indicators) whenever the active file changes
  // This handles: server sync switching activeFileIds, loadHistoryItem, and initial load
  useEffect(() => {
    const categories = ['bank_umum', 'kredit_jenis', 'dpk_portofolio', 'undisbursed_loan'] as const;
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
          userId: currentUser?.id || currentUser?.email,
        };

        const updatedHistory = [newItem, ...history.filter(h => h.name !== file.name)];
        setHistory(updatedHistory);
        saveHistoryToDB(updatedHistory);
        const uid = currentUser?.id || currentUser?.email;
        try {
          // Save to per-user partition so it survives logout/login
          localStorage.setItem(historyKey(uid), JSON.stringify(updatedHistory));
        } catch (e) {}

        const updatedActiveIds = {
          ...activeFileIds,
          [redirectTab]: newId,
        };
        setActiveFileIds(updatedActiveIds);
        saveActiveIdsToDB(updatedActiveIds, uid);
        try {
          localStorage.setItem(activeIdsKey(uid), JSON.stringify(updatedActiveIds));
        } catch (e) {}

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
    const targetItem = history.find(h => h.id === id);
    if (id.startsWith('default-mock') || targetItem?.isSample) {
      alert('File sampel default tidak dapat dihapus');
      return;
    }

    const uid = currentUser?.id || currentUser?.email;
    recordDeletedId(id, uid);

    const category = targetItem?.category || 'bank_umum';
    const updatedHistory = history.filter(item => item.id !== id);

    setHistory(updatedHistory);
    saveHistoryToDB(updatedHistory);
    try {
      localStorage.setItem(historyKey(uid), JSON.stringify(updatedHistory));
    } catch (e) {}

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
      const defaultId = category === 'kredit_jenis' ? 'default-mock-kredit' : category === 'dpk_portofolio' ? 'default-mock-dpk' : category === 'undisbursed_loan' ? 'default-mock-undisbursed' : 'default-mock-bank';
      const newActive = {
        ...activeFileIds,
        [category]: defaultId
      };
      const uid = currentUser?.id || currentUser?.email;
      setActiveFileIds(newActive);
      saveActiveIdsToDB(newActive, uid);
      try {
        localStorage.setItem(activeIdsKey(uid), JSON.stringify(newActive));
      } catch (e) {}

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
    let item = history.find(h => h.id === id);
    if (item && !item.fileData) {
      const dbItems = await loadHistoryFromDB();
      const dbFound = dbItems.find((h: any) => h.id === id);
      if (dbFound && dbFound.fileData) {
        item = dbFound;
      }
    }

    if (item && item.status === 'success' && item.fileData) {
      const file = item.fileData;
      const sheet = file.sheetNames[0];
      const category = item.category || redirectTab;

      const newActive = {
        ...activeFileIds,
        [category]: id,
        [redirectTab]: id
      };
      const uid = currentUser?.id || currentUser?.email;
      setActiveFileIds(newActive);
      saveActiveIdsToDB(newActive, uid);
      try {
        localStorage.setItem(activeIdsKey(uid), JSON.stringify(newActive));
      } catch (e) {}

      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activeFileIds: { [category]: id, [redirectTab]: id }
          })
        });
      } catch (err) {
        console.warn('Failed to sync active file to server API:', err);
      }

      setFilterStates(prev => ({
        ...prev,
        [category]: {
          sheet,
          year: 'All',
          month: 'All',
          xAxis: 'period',
          yAxis: file.sheets[sheet]?.indicators || [],
          chartType: 'bar',
          overlayRatio: false,
          selectedYears: [],
          selectedMonths: [],
        },
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

  // Triggered when user changes the active sheet inside Filter or View components
  const handleSheetChange = (sheetName: string, category?: string) => {
    const targetCat = category || activeCategory;
    const targetActiveId = activeFileIds[targetCat];
    const item = history.find(h => h.id === targetActiveId);

    if (item && item.fileData && item.fileData.sheets[sheetName]) {
      const updatedFileData: ActiveFile = {
        ...item.fileData,
        activeSheetName: sheetName
      };
      const updatedHistory = history.map(h => h.id === item.id ? { ...h, fileData: updatedFileData } : h);
      const uid = currentUser?.id || currentUser?.email;
      setHistory(updatedHistory);
      saveHistoryToDB(updatedHistory);
      try {
        localStorage.setItem(historyKey(uid), JSON.stringify(updatedHistory));
      } catch (e) {}
    }

    setFilterStates(prev => {
      const current = prev[targetCat];
      const sheetData = item?.fileData?.sheets[sheetName];
      return {
        ...prev,
        [targetCat]: {
          ...current,
          sheet: sheetName,
          ...(sheetData ? { yAxis: sheetData.indicators } : {})
        }
      };
    });
  };

  // Clear All User History
  const clearAllHistory = async (category?: string) => {
    // Record all non-sample IDs as deleted
    history.forEach(h => {
      if (!h.isSample && !h.id.startsWith('default-mock') && (!category || h.category === category)) {
        recordDeletedId(h.id);
      }
    });

    let updatedHistory: UploadHistoryItem[];
    if (category) {
      updatedHistory = history.filter(h => h.isSample || h.id.startsWith('default-mock') || h.category !== category);
    } else {
      updatedHistory = history.filter(h => h.isSample || h.id.startsWith('default-mock'));
    }

    const uid = currentUser?.id || currentUser?.email;
    setHistory(updatedHistory);
    await saveHistoryToDB(updatedHistory);
    try {
      localStorage.setItem(historyKey(uid), JSON.stringify(updatedHistory));
    } catch (e) {}

    const categoriesToReset = category ? [category] : ['bank_umum', 'kredit_jenis', 'dpk_portofolio', 'undisbursed_loan'];
    const newActive = { ...activeFileIds };
    categoriesToReset.forEach(cat => {
      const defaultId = cat === 'kredit_jenis' ? 'default-mock-kredit'
        : cat === 'dpk_portofolio' ? 'default-mock-dpk'
        : cat === 'undisbursed_loan' ? 'default-mock-undisbursed'
        : 'default-mock-bank';
      newActive[cat] = defaultId;
    });

    setActiveFileIds(newActive);
    await saveActiveIdsToDB(newActive, uid);
    try {
      localStorage.setItem(activeIdsKey(uid), JSON.stringify(newActive));
    } catch (e) {}

    try {
      await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true, category })
      });
    } catch (err) {
      console.warn('Failed to sync clearAll to server API:', err);
    }
  };

  return {
    isAuthenticated,
    currentUser,
    login,
    logout,
    activeFile,
    activeFiles,
    history: userHistory,
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
    clearAllHistory,
    loadHistoryItem,
    setFilterState,
    usersList,
    addUser,
    deleteUser,
    handleSheetChange,
  };
}
