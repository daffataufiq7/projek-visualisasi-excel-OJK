import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Use /tmp directory on Vercel / serverless environment for writable persistence
const DATA_FILE_PATH = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? path.join('/tmp', '.data_cache.json')
  : path.join(process.cwd(), '.data_cache.json');

// In-memory & Persistent Server State for Local & Ngrok Synchronization
let serverState: {
  activeFileIds: { [category: string]: string };
  history: any[];
} = {
  activeFileIds: {
    bank_umum: 'default-mock-bank',
    kredit_jenis: 'default-mock-kredit',
    dpk_portofolio: 'default-mock-dpk',
    undisbursed_loan: 'default-mock-undisbursed',
  },
  history: []
};

// Load initial state from file cache if present
function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        serverState = {
          activeFileIds: parsed.activeFileIds || serverState.activeFileIds,
          history: Array.isArray(parsed.history) ? parsed.history : []
        };
      }
    }
  } catch (err) {
    console.error('Failed to read server data cache:', err);
  }
}

// Save state to file cache
function saveToFile() {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(serverState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write server data cache:', err);
  }
}

// Execute initial load
loadFromFile();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const userId = req.query.userId as string | undefined;
    if (userId) {
      const userHistory = serverState.history.filter(h => !h.userId || h.userId === userId);
      return res.status(200).json({
        activeFileIds: serverState.activeFileIds,
        history: userHistory
      });
    }
    return res.status(200).json(serverState);
  }

  if (req.method === 'POST') {
    const { historyItem, activeFileIds, userId } = req.body || {};
    
    if (historyItem) {
      const itemWithUser = {
        ...historyItem,
        userId: historyItem.userId || userId
      };
      serverState.history = [
        itemWithUser,
        ...serverState.history.filter(h => h.id !== itemWithUser.id && h.name !== itemWithUser.name)
      ];
    }

    if (activeFileIds) {
      serverState.activeFileIds = {
        ...serverState.activeFileIds,
        ...activeFileIds
      };
    }

    saveToFile();
    return res.status(200).json(serverState);
  }

  if (req.method === 'DELETE') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e){}
    }
    const { id, clearAll, category, userId } = body || {};

    if (clearAll) {
      if (category) {
        serverState.history = serverState.history.filter((h: any) => h.category !== category || (userId && h.userId && h.userId !== userId));
        const defaultId = category === 'kredit_jenis' ? 'default-mock-kredit'
          : category === 'dpk_portofolio' ? 'default-mock-dpk'
          : category === 'undisbursed_loan' ? 'default-mock-undisbursed'
          : 'default-mock-bank';
        serverState.activeFileIds[category] = defaultId;
      } else {
        if (userId) {
          serverState.history = serverState.history.filter((h: any) => h.userId && h.userId !== userId);
        } else {
          serverState.history = [];
        }
        serverState.activeFileIds = {
          bank_umum: 'default-mock-bank',
          kredit_jenis: 'default-mock-kredit',
          dpk_portofolio: 'default-mock-dpk',
          undisbursed_loan: 'default-mock-undisbursed',
        };
      }
      saveToFile();
      return res.status(200).json(serverState);
    }

    if (id) {
      serverState.history = serverState.history.filter((h: any) => h.id !== id);
      Object.keys(serverState.activeFileIds).forEach(cat => {
        if (serverState.activeFileIds[cat] === id) {
          serverState.activeFileIds[cat] = cat === 'kredit_jenis' ? 'default-mock-kredit'
            : cat === 'dpk_portofolio' ? 'default-mock-dpk'
            : cat === 'undisbursed_loan' ? 'default-mock-undisbursed'
            : 'default-mock-bank';
        }
      });
      saveToFile();
    }
    return res.status(200).json(serverState);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
