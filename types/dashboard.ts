export interface DataPoint {
  [key: string]: any;
}

export interface SheetData {
  name: string;
  data: DataPoint[];
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  years: string[];
  months: string[];
}

export interface ActiveFile {
  name: string;
  size: number; // in bytes
  sheetNames: string[];
  sheets: { [sheetName: string]: SheetData };
  activeSheetName: string;
  uploadDate: string;
  rowCount: number; // sum of rows of all sheets
}

export interface FilterState {
  sheet: string;
  year: string; // 'All' or specific year
  month: string; // 'All' or specific month
  xAxis: string;
  yAxis: string[];
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'horizontal_bar';
}

export interface UploadHistoryItem {
  id: string;
  name: string;
  size: number;
  sheetCount: number;
  rowCount: number;
  uploadDate: string;
  status: 'success' | 'failed';
  fileData: ActiveFile;
}
