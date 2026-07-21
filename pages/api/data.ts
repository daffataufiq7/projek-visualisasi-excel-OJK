import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), '.data_cache.json');

// In-memory & Persistent Server State for Local & Ngrok Synchronization
let serverState: {
  activeFileIds: { [category: string]: string };
  history: any[];
} = {
  activeFileIds: {
    bank_umum: 'default-mock-bank',
    kredit_jenis: 'default-mock-kredit',
    dpk_portofolio: 'default-mock-dpk',
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
    return res.status(200).json(serverState);
  }

  if (req.method === 'POST') {
    const { historyItem, activeFileIds } = req.body || {};
    
    if (historyItem) {
      serverState.history = [
        historyItem,
        ...serverState.history.filter(h => h.id !== historyItem.id && h.name !== historyItem.name)
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
    const { id } = req.body || {};
    if (id) {
      serverState.history = serverState.history.filter(h => h.id !== id);
      saveToFile();
    }
    return res.status(200).json(serverState);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
