// Lightweight IndexedDB storage helper for persisting large Excel files & active state in browser without 5MB localStorage limits

const DB_NAME = 'finsight_db';
const DB_VERSION = 1;
const STORE_NAME = 'history_store';
const SETTINGS_STORE = 'settings_store';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHistoryToDB(history: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing history entries in IndexedDB
    await new Promise((res, rej) => {
      const req = store.clear();
      req.onsuccess = res;
      req.onerror = rej;
    });

    // Save each user-uploaded history item into IndexedDB
    for (const item of history) {
      if (item && item.id && !item.isSample) {
        store.put(item);
      }
    }
  } catch (err) {
    console.warn('IndexedDB saveHistory error:', err);
  }
}

export async function loadHistoryFromDB(): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB loadHistory error:', err);
    return [];
  }
}

export async function saveActiveIdsToDB(activeIds: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    store.put(activeIds, 'activeFileIds');
  } catch (err) {
    console.warn('IndexedDB saveActiveIds error:', err);
  }
}

export async function loadActiveIdsFromDB(): Promise<any | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const store = tx.objectStore(SETTINGS_STORE);
    return new Promise((resolve) => {
      const req = store.get('activeFileIds');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}
