import * as XLSX from 'xlsx';
import { ActiveFile, SheetData, DataPoint } from '../types/dashboard';

const MONTH_TERMS = [
  'jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'januari', 'februari', 'maret', 'juni', 'agustus', 'oktober', 'desember'
];

// Helper to format file size
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Convert column index to Excel letter (0 -> A, 1 -> B, 26 -> AA, etc.)
export function getExcelColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Clean and parse numeric values (handles currency, percents, spaces, and commas)
export function cleanAndParseNumeric(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  
  let str = String(val).trim();
  str = str.replace(/[RpIDR\s\t]/gi, '');
  
  let isPercent = false;
  if (str.endsWith('%')) {
    isPercent = true;
    str = str.slice(0, -1);
  }
  
  if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } else if (str.includes(',') && str.includes('.')) {
    str = str.replace(/,/g, '');
  }
  
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return null;
  
  return isPercent ? parsed / 100 : parsed;
}

// Auto-detect if headers are Format 1 (Tahunan) or Format 2 (Tahunan + Bulanan/Bertingkat)
export function detectHeaderFormat(rawRows: any[][]): 'Format1' | 'Format2' {
  if (rawRows.length < 2) {
    return 'Format1';
  }
  
  const row2 = rawRows[1];
  
  // Rule A: Check if any cell in Row 2 Columns B+ contains a month term string
  let hasMonthTerm = false;
  for (let c = 1; c < row2.length; c++) {
    const val = row2[c];
    if (val !== undefined && val !== null) {
      const strVal = String(val).trim().toLowerCase();
      if (strVal && MONTH_TERMS.some(m => strVal.includes(m))) {
        hasMonthTerm = true;
        break;
      }
    }
  }
  if (hasMonthTerm) {
    return 'Format2';
  }
  
  // Rule B: Count numeric vs non-numeric values in Row 2 Columns B+
  let numericCount = 0;
  let nonNumericCount = 0;
  for (let c = 1; c < row2.length; c++) {
    const val = row2[c];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const parsed = cleanAndParseNumeric(val);
      if (parsed !== null) {
        numericCount++;
      } else {
        nonNumericCount++;
      }
    }
  }
  
  if (nonNumericCount >= numericCount && nonNumericCount > 0) {
    return 'Format2';
  }
  
  return 'Format1';
}

// Validate OJK Excel Template Format
export function validateOjkTemplate(rawRows: any[][], sheetName: string, format: 'Format1' | 'Format2'): string | null {
  const minRows = format === 'Format2' ? 3 : 2;
  if (rawRows.length < minRows) {
    return `Sheet "${sheetName}" tidak sesuai template: Minimal harus memiliki ${minRows} baris untuk header ${format === 'Format2' ? 'Bertingkat' : 'Tahunan'}.`;
  }
  
  const row1 = rawRows[0];
  if (row1.length < 2) {
    return `Sheet "${sheetName}" tidak sesuai template: Harus memiliki setidaknya kolom Indikator (Kolom A) dan satu kolom data periode.`;
  }
  
  // Identify valid columns first (fill forward years, check months if Format 2)
  const validColIndices: number[] = [];
  let currentYear: string | null = null;

  for (let c = 1; c < row1.length; c++) {
    const yVal = row1[c];
    if (yVal !== undefined && yVal !== null && String(yVal).trim() !== '') {
      const trimmed = String(yVal).trim();
      if (/^\d{4}$/.test(trimmed)) {
        currentYear = trimmed;
      } else {
        currentYear = null; // Skip non-year headers like "Pertumbuhan yoy"
      }
    }
    
    // Check if the year is valid (4 digits)
    if (currentYear !== null) {
      validColIndices.push(c);
    }
  }

  if (validColIndices.length === 0) {
    return `Tidak ditemukan kolom periode yang valid pada Sheet "${sheetName}". Untuk format ${format === 'Format2' ? 'Bertingkat' : 'Tahunan'}, pastikan Baris 1 berisi Tahun (4 digit) ${format === 'Format2' ? 'dan Baris 2 berisi Bulan/Periode' : ''}.`;
  }
  
  // Validate Indicator Data Rows
  const dataStartRowIdx = format === 'Format2' ? 2 : 1;
  for (let r = dataStartRowIdx; r < rawRows.length; r++) {
    const row = rawRows[r];
    const indicatorName = row[0];
    if (indicatorName === undefined || indicatorName === null || String(indicatorName).trim() === '') {
      return `Nama Indikator kosong pada Sheet "${sheetName}", Baris ${r + 1} Kolom A. Setiap baris data harus memiliki nama indikator.`;
    }
    
    // Only validate cells in valid period columns
    for (const c of validColIndices) {
      if (c < row.length) {
        const cellVal = row[c];
        if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '' && String(cellVal).trim() !== '-') {
          const valStr = String(cellVal).trim();
          const parsed = cleanAndParseNumeric(valStr);
          if (parsed === null) {
            return `Nilai bukan angka pada Sheet "${sheetName}", Baris ${r + 1} Kolom ${getExcelColumnLetter(c)}: "${valStr}". Harap gunakan angka yang valid.`;
          }
        }
      }
    }
  }
  
  return null;
}

// Parse Excel File following OJK template rules (Tahunan / Tahunan + Bulanan)
export async function parseExcelFile(file: File): Promise<ActiveFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('File data is empty');
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        const sheets: { [sheetName: string]: SheetData } = {};
        
        let totalDataPoints = 0;
        const globalUniqueIndicators = new Set<string>();
        const globalUniquePeriods = new Set<string>();

        if (sheetNames.length === 0) {
          throw new Error('File Excel tidak memiliki sheet.');
        }

        for (const sheetName of sheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

          // Clean empty rows from the end
          while (rawRows.length > 0) {
            const lastRow = rawRows[rawRows.length - 1];
            const isEmpty = lastRow.every(val => val === null || val === undefined || String(val).trim() === '');
            if (isEmpty) {
              rawRows.pop();
            } else {
              break;
            }
          }

          if (rawRows.length === 0) {
            continue;
          }

          // Auto detect format (Format1: Tahunan, Format2: Bertingkat)
          const format = detectHeaderFormat(rawRows);

          // Validate OJK template
          const validationError = validateOjkTemplate(rawRows, sheetName, format);
          if (validationError) {
            throw new Error(validationError);
          }

          const row1 = rawRows[0];
          
          // Form periods by filling forward years, keeping track of valid column indices
          const periods: string[] = [];
          const yearsSet = new Set<string>();
          const monthsSet = new Set<string>();
          const validColIndices: number[] = [];
          
          let currentYear = '';
          
          if (format === 'Format2') {
            const row2 = rawRows[1];
            for (let c = 1; c < row1.length; c++) {
              const yVal = String(row1[c]).trim();
              if (yVal !== '') {
                if (/^\d{4}$/.test(yVal)) {
                  currentYear = yVal;
                } else {
                  currentYear = ''; // Reset on non-year header (e.g. Pertumbuhan yoy)
                }
              }
              
              if (currentYear !== '') {
                // If row2 is shorter or cell is empty, default to empty string
                const mVal = c < row2.length && row2[c] !== undefined && row2[c] !== null ? String(row2[c]).trim() : '';
                
                // If month is empty, key is just year. Otherwise, year-month.
                const periodKey = mVal !== '' ? `${currentYear}-${mVal}` : currentYear;
                
                periods.push(periodKey);
                yearsSet.add(currentYear);
                if (mVal !== '') {
                  monthsSet.add(mVal);
                }
                globalUniquePeriods.add(periodKey);
                validColIndices.push(c);
              }
            }
          } else {
            // Format 1: Tahunan only
            for (let c = 1; c < row1.length; c++) {
              const yVal = String(row1[c]).trim();
              if (yVal !== '') {
                if (/^\d{4}$/.test(yVal)) {
                  currentYear = yVal;
                } else {
                  currentYear = '';
                }
              }
              if (currentYear !== '') {
                periods.push(currentYear);
                yearsSet.add(currentYear);
                globalUniquePeriods.add(currentYear);
                validColIndices.push(c);
              }
            }
          }

          const indicators: string[] = [];
          const rawPoints: DataPoint[] = [];
          const indicatorsData: { [ind: string]: { [per: string]: number } } = {};
          const gridData: { [key: string]: any }[] = [];

          const dataStartRowIdx = format === 'Format2' ? 2 : 1;

          // Process Data Rows
          for (let r = dataStartRowIdx; r < rawRows.length; r++) {
            const row = rawRows[r];
            const indicatorName = String(row[0]).trim();
            indicators.push(indicatorName);
            globalUniqueIndicators.add(indicatorName);
            indicatorsData[indicatorName] = {};

            const gridRow: { [key: string]: any } = {
              indicator: indicatorName,
              _excelRowNumber: r + 1
            };

            for (let i = 0; i < validColIndices.length; i++) {
              const c = validColIndices[i];
              const periodKey = periods[i];
              let parsedVal = 0;
              
              if (c < row.length) {
                const cellVal = row[c];
                if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '' && String(cellVal).trim() !== '-') {
                  parsedVal = cleanAndParseNumeric(cellVal) ?? 0;
                }
              }

              indicatorsData[indicatorName][periodKey] = parsedVal;
              gridRow[periodKey] = parsedVal;

              const yrNumber = parseInt(periodKey.split('-')[0]) || 0;
              const moName = periodKey.includes('-') ? periodKey.split('-')[1] : null;

              rawPoints.push({
                indikator: indicatorName,
                periode: periodKey,
                tahun: yrNumber,
                bulan: moName,
                nilai: parsedVal
              });
              totalDataPoints++;
            }
            gridData.push(gridRow);
          }

          sheets[sheetName] = {
            name: sheetName,
            indicators,
            years: Array.from(yearsSet).sort(),
            months: Array.from(monthsSet),
            periods,
            rawPoints,
            indicatorsData,
            data: gridData,
            columns: ['indicator', ...periods],
            numericColumns: periods,
            categoricalColumns: ['indicator']
          };
        }

        const activeFile: ActiveFile = {
          name: file.name,
          size: file.size,
          sheetNames: Object.keys(sheets),
          sheets,
          activeSheetName: Object.keys(sheets)[0] || '',
          uploadDate: new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          rowCount: totalDataPoints,
          totalIndicators: globalUniqueIndicators.size,
          totalPeriods: globalUniquePeriods.size
        };

        resolve(activeFile);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('FileReader encountered an error'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Generate Mock Data for OJK Jawa Barat with two different sheet formats (Bertingkat & Tahunan)
export function generateMockFile(): ActiveFile {
  const sheetNames = ['Bank Umum', 'BPR', 'Kinerja Tahunan'];
  const sheets: { [sheetName: string]: SheetData } = {};
  let totalDataPoints = 0;
  
  sheetNames.forEach((sheetName) => {
    const rawPoints: DataPoint[] = [];
    const indicatorsData: { [ind: string]: { [per: string]: number } } = {};
    const gridData: { [key: string]: any }[] = [];
    
    // Auto-detect format type for mock sheet
    const isTahunan = sheetName === 'Kinerja Tahunan';
    
    const indicators = ['Aset', 'Dana Pihak Ketiga', 'Kredit', 'NPL', 'LDR'];
    const years = isTahunan ? ['2020', '2021', '2022', '2023', '2024', '2025', '2026'] : ['2025', '2026'];
    const months = isTahunan ? [] : ['Jan', 'Mei', 'Des'];
    
    const periods: string[] = [];
    years.forEach(y => {
      if (isTahunan) {
        periods.push(y);
      } else {
        months.forEach(m => {
          periods.push(`${y}-${m}`);
        });
      }
    });

    const mult = sheetName === 'Bank Umum' ? 1.0 : sheetName === 'BPR' ? 0.3 : 0.8;

    indicators.forEach((indicator) => {
      indicatorsData[indicator] = {};
      const gridRow: { [key: string]: any } = {
        indicator,
        _excelRowNumber: indicators.indexOf(indicator) + 3
      };

      periods.forEach((period, pIdx) => {
        const yr = period.split('-')[0];
        const yrOffset = Number(yr) - 2020;
        
        let baseVal = 100;
        if (indicator === 'Aset') baseVal = 120 + yrOffset * 25 + pIdx * 2;
        else if (indicator === 'Dana Pihak Ketiga') baseVal = 100 + yrOffset * 20 + pIdx * 1.5;
        else if (indicator === 'Kredit') baseVal = 90 + yrOffset * 18 + pIdx * 1.2;
        else if (indicator === 'NPL') baseVal = 2.8 - yrOffset * 0.2 - pIdx * 0.05;
        else if (indicator === 'LDR') baseVal = 85 - yrOffset * 1.0 - pIdx * 0.2;
        
        const randomFactor = 0.95 + Math.random() * 0.1;
        let value = parseFloat((baseVal * mult * randomFactor).toFixed(2));
        
        if (indicator === 'NPL') value = Math.max(0.5, parseFloat((baseVal * randomFactor).toFixed(2)));
        if (indicator === 'LDR') value = Math.max(50, parseFloat((baseVal * randomFactor).toFixed(2)));
        
        indicatorsData[indicator][period] = value;
        gridRow[period] = value;
        
        rawPoints.push({
          indikator: indicator,
          periode: period,
          tahun: Number(yr),
          bulan: isTahunan ? null : period.split('-')[1],
          nilai: value
        });
        totalDataPoints++;
      });
      gridData.push(gridRow);
    });

    sheets[sheetName] = {
      name: sheetName,
      indicators,
      years,
      months,
      periods,
      rawPoints,
      indicatorsData,
      data: gridData,
      columns: ['indicator', ...periods],
      numericColumns: periods,
      categoricalColumns: ['indicator']
    };
  });

  return {
    name: 'Data_Visualisasi_OJK_Jabar_MultiFormat.xlsx',
    size: 38400,
    sheetNames,
    sheets,
    activeSheetName: 'Bank Umum',
    uploadDate: new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    rowCount: totalDataPoints,
    totalIndicators: 5,
    totalPeriods: 13
  };
}

// Generate and trigger download of official OJK Excel Template (supports both Tahunan & Bertingkat sheets)
export function downloadOjkTemplate(): void {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Format 2 (Tahun + Bulan)
  const headersRow1 = ['Indikator', 2025, '', '', 2026, '', ''];
  const headersRow2 = ['Periode', 'Jan', 'Mei', 'Des', 'Jan', 'Mei', 'Des'];
  const dataRow1 = ['Aset', 1020177729, 1084920400, 1120400192, 1150490100, 1205930000, 1250100900];
  const dataRow2 = ['Dana Pihak Ketiga', 950180900, 990480200, 1020180900, 1040300900, 1090280400, 1120590800];
  const dataRow3 = ['Kredit', 880190200, 910280400, 930490100, 950920400, 995400200, 1030190000];
  const dataRow4 = ['NPL', 2.35, 2.21, 2.15, 2.08, 1.95, 1.82];
  const dataRow5 = ['LDR', 84.50, 83.20, 82.10, 81.50, 80.20, 79.10];
  
  const ws1 = XLSX.utils.aoa_to_sheet([
    headersRow1,
    headersRow2,
    dataRow1,
    dataRow2,
    dataRow3,
    dataRow4,
    dataRow5
  ]);
  
  ws1['!merges'] = [
    { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }, // 2025
    { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } }  // 2026
  ];
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Format Bulanan (Bertingkat)');

  // Sheet 2: Format 1 (Tahunan)
  const tahHeaders = ['Indikator', 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const tahAset = ['Aset', 820100900, 890400100, 930190200, 961561751, 1020177729, 1084920400, 1150490100];
  const tahDpk = ['Dana Pihak Ketiga', 750100900, 820290400, 860180900, 890280100, 950180900, 990480200, 1040300900];
  const tahKredit = ['Kredit', 680190200, 730480200, 780190100, 810280400, 880190200, 910280400, 950920400];
  const tahNpl = ['NPL', 2.92, 2.75, 2.51, 2.45, 2.35, 2.21, 2.08];
  const tahLdr = ['LDR', 89.20, 87.50, 85.20, 84.50, 83.20, 82.10, 81.50];

  const ws2 = XLSX.utils.aoa_to_sheet([
    tahHeaders,
    tahAset,
    tahDpk,
    tahKredit,
    tahNpl,
    tahLdr
  ]);

  XLSX.utils.book_append_sheet(wb, ws2, 'Format Tahunan');
  
  XLSX.writeFile(wb, 'Template_Excel_OJK_Jabar.xlsx');
}
