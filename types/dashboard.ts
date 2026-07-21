export interface DataPoint {
  indikator: string;
  periode: string; // e.g. '2025-Jan' or '2023'
  tahun: number;   // e.g. 2025
  bulan: string | null;  // e.g. 'Jan' or null
  nilai: number;
}

export interface SheetData {
  name: string;
  indicators: string[]; // List of unique indicators: ['Aset', 'Dana Pihak Ketiga', 'Kredit', 'NPL', 'LDR']
  years: string[];      // ['2024', '2025', '2026']
  months: string[];     // ['Jan', 'Mei', 'Des']
  periods: string[];    // ['2024-Jan', '2024-Mei', ...]
  rawPoints: DataPoint[]; // Flattened data list
  indicatorsData: {     // Pivot representation: { 'Aset': { '2024-Jan': 120 } }
    [indicatorName: string]: {
      [period: string]: number;
    }
  };
  // Grid format for backward compatibility in tables
  data: { [key: string]: any }[]; // Each row: { indicator: 'Aset', '2024-Jan': 120, '2024-Mei': 125 }
  columns: string[]; // ['indicator', '2024-Jan', '2024-Mei', ...]
  numericColumns: string[]; // ['2024-Jan', '2024-Mei', ...]
  categoricalColumns: string[]; // ['indicator']
}

export interface ActiveFile {
  name: string;
  size: number; // in bytes
  sheetNames: string[];
  sheets: { [sheetName: string]: SheetData };
  activeSheetName: string;
  uploadDate: string;
  rowCount: number; // total raw data points across sheets
  totalIndicators: number;
  totalPeriods: number;
  validationError?: string; // If validation failed, store details here
  isSample?: boolean;
}

export interface FilterState {
  sheet: string;
  year: string; // 'All' or specific year
  month: string; // 'All' or specific month
  xAxis: string; // Will always be 'period'
  yAxis: string[]; // Will hold selected indicators: ['Aset', 'Kredit']
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'horizontal_bar';
  overlayRatio?: boolean;
  selectedYears?: string[];
  selectedMonths?: string[];
}

export interface UploadHistoryItem {
  id: string;
  name: string;
  size: number;
  sheetCount: number;
  rowCount: number;
  uploadDate: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  fileData?: ActiveFile;
  category?: string; // 'bank_umum' | 'kredit_jenis' | 'dpk_portofolio'
  isSample?: boolean;
}
