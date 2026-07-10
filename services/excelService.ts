import * as XLSX from 'xlsx';
import { ActiveFile, SheetData, DataPoint } from '../types/dashboard';

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

// Parse Excel File
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
        let totalRows = 0;

        sheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Get all rows as a 2D array of raw values
          const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
          
          if (rawRows.length === 0) {
            return;
          }

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

          const maxCols = Math.max(...rawRows.map(r => r.length));

          // GENERATE ALL VALID CELL CANDIDATES IN FIRST 15 ROWS AS HEADERS
          // Any cell in the first 15 rows containing text/numbers with data below it is a column option.
          const columnsWithCoords: string[] = [];
          const colCandidatesMap: { 
            [colKey: string]: { colIdx: number, headerRowIdx: number } 
          } = {};

          const scanLimit = Math.min(rawRows.length, 15);

          for (let c = 0; c < maxCols; c++) {
            const letter = getExcelColumnLetter(c);
            
            for (let r = 0; r < scanLimit; r++) {
              const cellVal = rawRows[r][c];
              if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
                // Check if there is at least one non-empty data value below this row in the same column
                let hasDataBelow = false;
                for (let nextR = r + 1; nextR < rawRows.length; nextR++) {
                  const nextVal = rawRows[nextR][c];
                  if (nextVal !== undefined && nextVal !== null && String(nextVal).trim() !== '') {
                    hasDataBelow = true;
                    break;
                  }
                }

                if (hasDataBelow) {
                  const cleanVal = String(cellVal).trim();
                  // Clean up SheetJS internal placeholders
                  const isDefaultEmptyName = /__empty/i.test(cleanVal);
                  const label = isDefaultEmptyName ? '(Kolom Tanpa Nama)' : cleanVal;
                  
                  const colKey = `${letter}${r + 1} - ${label}`;
                  
                  if (!columnsWithCoords.includes(colKey)) {
                    columnsWithCoords.push(colKey);
                    colCandidatesMap[colKey] = { colIdx: c, headerRowIdx: r };
                  }
                }
              }
            }
          }

          if (columnsWithCoords.length === 0) {
            return;
          }

          // Build row data points based on candidates
          const mappedDataRows: DataPoint[] = [];

          for (let r = 0; r < rawRows.length; r++) {
            let hasActiveData = false;
            const dataPoint: DataPoint = {};
            const cellCoords: { [col: string]: string } = {};

            columnsWithCoords.forEach((colKey) => {
              const { colIdx, headerRowIdx } = colCandidatesMap[colKey];
              // Data for this column header starts in rows below it
              if (r > headerRowIdx) {
                const cellVal = rawRows[r][colIdx];
                const isCellValEmpty = cellVal === undefined || cellVal === null || String(cellVal).trim() === '';
                
                dataPoint[colKey] = !isCellValEmpty ? cellVal : null;
                if (!isCellValEmpty) {
                  hasActiveData = true;
                }
                
                const letter = getExcelColumnLetter(colIdx);
                cellCoords[colKey] = `${letter}${r + 1}`;
              } else {
                dataPoint[colKey] = null;
              }
            });

            if (hasActiveData) {
              dataPoint['_excelRowNumber'] = r + 1;
              dataPoint['_cellCoordinates'] = cellCoords;
              mappedDataRows.push(dataPoint);
            }
          }

          if (mappedDataRows.length === 0) return;
          totalRows += mappedDataRows.length;

          // Classify columns into numeric vs categorical
          const numericColumns: string[] = [];
          const categoricalColumns: string[] = [];

          columnsWithCoords.forEach((colKey) => {
            let numericCount = 0;
            let nonEmptyCount = 0;

            mappedDataRows.forEach((row) => {
              const val = row[colKey];
              if (val !== null && val !== undefined && val !== '') {
                nonEmptyCount++;
                const parsedVal = cleanAndParseNumeric(val);
                if (parsedVal !== null) {
                  numericCount++;
                }
              }
            });

            // If more than 50% are numeric, treat as numeric column
            if (nonEmptyCount > 0 && numericCount / nonEmptyCount >= 0.5) {
              numericColumns.push(colKey);
              // Normalize values to number types
              mappedDataRows.forEach((row) => {
                const val = row[colKey];
                const parsedVal = cleanAndParseNumeric(val);
                if (parsedVal !== null) {
                  row[colKey] = parsedVal;
                }
              });
            } else {
              categoricalColumns.push(colKey);
            }
          });

          // Fallback: If no numeric columns detected, treat all columns (except the first one) as numeric
          if (numericColumns.length === 0) {
            columnsWithCoords.forEach((colKey, idx) => {
              if (idx > 0) {
                numericColumns.push(colKey);
                mappedDataRows.forEach((row) => {
                  const val = row[colKey];
                  const parsedVal = cleanAndParseNumeric(val);
                  if (parsedVal !== null) {
                    row[colKey] = parsedVal;
                  }
                });
              }
            });
          }

          // Extract years and months
          const yearsSet = new Set<string>();
          const monthsSet = new Set<string>();

          const dateCol = columnsWithCoords.find(col => 
            /periode|tanggal|date|tahun|bulan|month|year/i.test(col)
          );

          if (dateCol) {
            mappedDataRows.forEach((row) => {
              const val = row[dateCol];
              if (val) {
                const strVal = String(val);
                const yearMatch = strVal.match(/\b(20\d{2}|\d{2})\b/);
                if (yearMatch) {
                  const y = yearMatch[0].length === 2 ? '20' + yearMatch[0] : yearMatch[0];
                  yearsSet.add(y);
                }

                const months = [
                  'jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des',
                  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
                  'januari', 'februari', 'maret', 'mei', 'juni', 'juli', 'agustus', 'oktober', 'desember'
                ];
                
                const lowerVal = strVal.toLowerCase();
                for (const m of months) {
                  if (lowerVal.includes(m)) {
                    const displayMonth = m.charAt(0).toUpperCase() + m.slice(1, 3);
                    monthsSet.add(displayMonth);
                    break;
                  }
                }
              }
            });
          }

          if (yearsSet.size === 0) {
            const tahunCol = columnsWithCoords.find(col => /tahun|year/i.test(col));
            if (tahunCol) {
              mappedDataRows.forEach(row => {
                if (row[tahunCol]) yearsSet.add(String(row[tahunCol]));
              });
            } else {
              yearsSet.add('2026');
            }
          }

          sheets[sheetName] = {
            name: sheetName,
            data: mappedDataRows,
            columns: columnsWithCoords,
            numericColumns,
            categoricalColumns,
            years: Array.from(yearsSet).sort(),
            months: Array.from(monthsSet),
          };
        });

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
          rowCount: totalRows
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

// Generate Mock Data for OJK Jawa Barat
export function generateMockFile(): ActiveFile {
  const years = ['2024', '2025', '2026'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const sheets: { [sheetName: string]: SheetData } = {};
  let totalRows = 0;

  const addMockRow = (index: number) => index + 4; // Mock start header on row 3, data on row 4

  // 1. Sheet Aset
  const asetData: DataPoint[] = [];
  let rowCount = 0;
  years.forEach((yr) => {
    months.forEach((mo, idx) => {
      const baseValue = 120 + (Number(yr) - 2024) * 25 + idx * 2.5;
      const bpd = parseFloat((baseValue * 0.45 + Math.random() * 3).toFixed(2));
      const bpr = parseFloat((baseValue * 0.15 + Math.random() * 1).toFixed(2));
      const swasta = parseFloat((baseValue * 0.40 + Math.random() * 2).toFixed(2));
      const total = parseFloat((bpd + bpr + swasta).toFixed(2));
      
      const rNum = addMockRow(rowCount++);
      asetData.push({
        'A3 - Periode': `${mo}-${yr.slice(2)}`,
        'B3 - Tahun': yr,
        'C3 - Bulan': mo,
        'D3 - Aset BPD (Rp Triliun)': bpd,
        'E3 - Aset BPR (Rp Triliun)': bpr,
        'F3 - Aset Bank Swasta (Rp Triliun)': swasta,
        'G3 - Total Aset (Rp Triliun)': total,
        '_excelRowNumber': rNum,
        '_cellCoordinates': {
          'A3 - Periode': `A${rNum}`,
          'B3 - Tahun': `B${rNum}`,
          'C3 - Bulan': `C${rNum}`,
          'D3 - Aset BPD (Rp Triliun)': `D${rNum}`,
          'E3 - Aset BPR (Rp Triliun)': `E${rNum}`,
          'F3 - Aset Bank Swasta (Rp Triliun)': `F${rNum}`,
          'G3 - Total Aset (Rp Triliun)': `G${rNum}`
        }
      });
    });
  });
  totalRows += asetData.length;
  sheets['Aset'] = {
    name: 'Aset',
    data: asetData,
    columns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan', 'D3 - Aset BPD (Rp Triliun)', 'E3 - Aset BPR (Rp Triliun)', 'F3 - Aset Bank Swasta (Rp Triliun)', 'G3 - Total Aset (Rp Triliun)'],
    numericColumns: ['D3 - Aset BPD (Rp Triliun)', 'E3 - Aset BPR (Rp Triliun)', 'F3 - Aset Bank Swasta (Rp Triliun)', 'G3 - Total Aset (Rp Triliun)'],
    categoricalColumns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan'],
    years,
    months,
  };

  // 2. Sheet DPK
  const dpkData: DataPoint[] = [];
  rowCount = 0;
  years.forEach((yr) => {
    months.forEach((mo, idx) => {
      const baseValue = 90 + (Number(yr) - 2024) * 20 + idx * 2;
      const giro = parseFloat((baseValue * 0.30 + Math.random() * 2).toFixed(2));
      const tabungan = parseFloat((baseValue * 0.40 + Math.random() * 3).toFixed(2));
      const deposito = parseFloat((baseValue * 0.30 + Math.random() * 2).toFixed(2));
      const total = parseFloat((giro + tabungan + deposito).toFixed(2));

      const rNum = addMockRow(rowCount++);
      dpkData.push({
        'A3 - Periode': `${mo}-${yr.slice(2)}`,
        'B3 - Tahun': yr,
        'C3 - Bulan': mo,
        'D3 - Giro (Rp Triliun)': giro,
        'E3 - Tabungan (Rp Triliun)': tabungan,
        'F3 - Deposito (Rp Triliun)': deposito,
        'G3 - Total DPK (Rp Triliun)': total,
        '_excelRowNumber': rNum,
        '_cellCoordinates': {
          'A3 - Periode': `A${rNum}`,
          'B3 - Tahun': `B${rNum}`,
          'C3 - Bulan': `C${rNum}`,
          'D3 - Giro (Rp Triliun)': `D${rNum}`,
          'E3 - Tabungan (Rp Triliun)': `E${rNum}`,
          'F3 - Deposito (Rp Triliun)': `F${rNum}`,
          'G3 - Total DPK (Rp Triliun)': `G${rNum}`
        }
      });
    });
  });
  totalRows += dpkData.length;
  sheets['DPK'] = {
    name: 'DPK',
    data: dpkData,
    columns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan', 'D3 - Giro (Rp Triliun)', 'E3 - Tabungan (Rp Triliun)', 'F3 - Deposito (Rp Triliun)', 'G3 - Total DPK (Rp Triliun)'],
    numericColumns: ['D3 - Giro (Rp Triliun)', 'E3 - Tabungan (Rp Triliun)', 'F3 - Deposito (Rp Triliun)', 'G3 - Total DPK (Rp Triliun)'],
    categoricalColumns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan'],
    years,
    months,
  };

  // 3. Sheet Kredit
  const kreditData: DataPoint[] = [];
  rowCount = 0;
  years.forEach((yr) => {
    months.forEach((mo, idx) => {
      const baseValue = 80 + (Number(yr) - 2024) * 18 + idx * 1.8;
      const umkm = parseFloat((baseValue * 0.35 + Math.random() * 2).toFixed(2));
      const korporasi = parseFloat((baseValue * 0.45 + Math.random() * 3).toFixed(2));
      const konsumsi = parseFloat((baseValue * 0.20 + Math.random() * 1).toFixed(2));
      const total = parseFloat((umkm + korporasi + konsumsi).toFixed(2));

      const rNum = addMockRow(rowCount++);
      kreditData.push({
        'A3 - Periode': `${mo}-${yr.slice(2)}`,
        'B3 - Tahun': yr,
        'C3 - Bulan': mo,
        'D3 - Kredit UMKM (Rp Triliun)': umkm,
        'E3 - Kredit Korporasi (Rp Triliun)': korporasi,
        'F3 - Kredit Konsumsi (Rp Triliun)': konsumsi,
        'G3 - Total Kredit (Rp Triliun)': total,
        '_excelRowNumber': rNum,
        '_cellCoordinates': {
          'A3 - Periode': `A${rNum}`,
          'B3 - Tahun': `B${rNum}`,
          'C3 - Bulan': `C${rNum}`,
          'D3 - Kredit UMKM (Rp Triliun)': `D${rNum}`,
          'E3 - Kredit Korporasi (Rp Triliun)': `E${rNum}`,
          'F3 - Kredit Konsumsi (Rp Triliun)': `F${rNum}`,
          'G3 - Total Kredit (Rp Triliun)': `G${rNum}`
        }
      });
    });
  });
  totalRows += kreditData.length;
  sheets['Kredit'] = {
    name: 'Kredit',
    data: kreditData,
    columns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan', 'D3 - Kredit UMKM (Rp Triliun)', 'E3 - Kredit Korporasi (Rp Triliun)', 'F3 - Kredit Konsumsi (Rp Triliun)', 'G3 - Total Kredit (Rp Triliun)'],
    numericColumns: ['D3 - Kredit UMKM (Rp Triliun)', 'E3 - Kredit Korporasi (Rp Triliun)', 'F3 - Kredit Konsumsi (Rp Triliun)', 'G3 - Total Kredit (Rp Triliun)'],
    categoricalColumns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan'],
    years,
    months,
  };

  // 4. Sheet Laba
  const labaData: DataPoint[] = [];
  rowCount = 0;
  years.forEach((yr) => {
    months.forEach((mo, idx) => {
      const baseValue = 5 + (Number(yr) - 2024) * 2 + idx * 0.3;
      const pendapatan = parseFloat((baseValue * 2.2 + Math.random() * 0.5).toFixed(2));
      const beban = parseFloat((baseValue * 1.0 + Math.random() * 0.2).toFixed(2));
      const operasional = parseFloat((pendapatan - beban).toFixed(2));
      const bersih = parseFloat((operasional * 0.78).toFixed(2));

      const rNum = addMockRow(rowCount++);
      labaData.push({
        'A3 - Periode': `${mo}-${yr.slice(2)}`,
        'B3 - Tahun': yr,
        'C3 - Bulan': mo,
        'D3 - Pendapatan Bunga (Rp Triliun)': pendapatan,
        'E3 - Beban Bunga (Rp Triliun)': beban,
        'F3 - Laba Operasional (Rp Triliun)': operasional,
        'G3 - Laba Bersih (Rp Triliun)': bersih,
        '_excelRowNumber': rNum,
        '_cellCoordinates': {
          'A3 - Periode': `A${rNum}`,
          'B3 - Tahun': `B${rNum}`,
          'C3 - Bulan': `C${rNum}`,
          'D3 - Pendapatan Bunga (Rp Triliun)': `D${rNum}`,
          'E3 - Beban Bunga (Rp Triliun)': `E${rNum}`,
          'F3 - Laba Operasional (Rp Triliun)': `F${rNum}`,
          'G3 - Laba Bersih (Rp Triliun)': `G${rNum}`
        }
      });
    });
  });
  totalRows += labaData.length;
  sheets['Laba'] = {
    name: 'Laba',
    data: labaData,
    columns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan', 'D3 - Pendapatan Bunga (Rp Triliun)', 'E3 - Beban Bunga (Rp Triliun)', 'F3 - Laba Operasional (Rp Triliun)', 'G3 - Laba Bersih (Rp Triliun)'],
    numericColumns: ['D3 - Pendapatan Bunga (Rp Triliun)', 'E3 - Beban Bunga (Rp Triliun)', 'F3 - Laba Operasional (Rp Triliun)', 'G3 - Laba Bersih (Rp Triliun)'],
    categoricalColumns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan'],
    years,
    months,
  };

  // 5. Sheet NPL
  const nplData: DataPoint[] = [];
  rowCount = 0;
  years.forEach((yr) => {
    months.forEach((mo, idx) => {
      const gross = parseFloat((2.8 - (Number(yr) - 2024) * 0.25 - idx * 0.02 + Math.random() * 0.15).toFixed(2));
      const net = parseFloat((gross * 0.45 + Math.random() * 0.05).toFixed(2));

      const rNum = addMockRow(rowCount++);
      nplData.push({
        'A3 - Periode': `${mo}-${yr.slice(2)}`,
        'B3 - Tahun': yr,
        'C3 - Bulan': mo,
        'D3 - NPL Gross (%)': gross,
        'E3 - NPL Net (%)': net,
        '_excelRowNumber': rNum,
        '_cellCoordinates': {
          'A3 - Periode': `A${rNum}`,
          'B3 - Tahun': `B${rNum}`,
          'C3 - Bulan': `C${rNum}`,
          'D3 - NPL Gross (%)': `D${rNum}`,
          'E3 - NPL Net (%)': `E${rNum}`
        }
      });
    });
  });
  totalRows += nplData.length;
  sheets['NPL'] = {
    name: 'NPL',
    data: nplData,
    columns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan', 'D3 - NPL Gross (%)', 'E3 - NPL Net (%)'],
    numericColumns: ['D3 - NPL Gross (%)', 'E3 - NPL Net (%)'],
    categoricalColumns: ['A3 - Periode', 'B3 - Tahun', 'C3 - Bulan'],
    years,
    months,
  };

  return {
    name: 'Data_Perbankan_Jabar.xlsx',
    size: 28430,
    sheetNames: ['Aset', 'DPK', 'Kredit', 'Laba', 'NPL'],
    sheets,
    activeSheetName: 'Aset',
    uploadDate: new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    rowCount: totalRows
  };
}
