import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  Download, 
  EyeOff, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { SheetData, DataPoint } from '../types/dashboard';

interface DataTableProps {
  sheetData: SheetData;
}

export default function DataTable({ sheetData }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [colDropdownOpen, setColDropdownOpen] = useState(false);

  // Initialize columns visibility when sheetData changes
  React.useEffect(() => {
    if (sheetData) {
      setVisibleColumns(sheetData.columns);
    }
    setSearchQuery('');
    setCurrentPage(1);
    setSortColumn(null);
    setSortDirection(null);
  }, [sheetData]);

  // Handle Header Sorting click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 1. Filter data based on global search
  const searchedData = useMemo(() => {
    if (!sheetData) return [];
    
    if (!searchQuery.trim()) return sheetData.data;

    const lowerQuery = searchQuery.toLowerCase();
    return sheetData.data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lowerQuery);
      });
    });
  }, [sheetData, searchQuery]);

  // 2. Sort the data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return searchedData;

    const sorted = [...searchedData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aNum = Number(aVal);
      const bNum = Number(bVal);

      // Numeric sorting if both are numbers
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // String sorting fallback
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return sorted;
  }, [searchedData, sortColumn, sortDirection]);

  // 3. Paginate the data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  // Toggle column visibility
  const toggleColumnVisibility = (col: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(col)) {
        // Prevent hiding ALL columns
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== col);
      } else {
        return [...prev, col];
      }
    });
  };

  // Download CSV Format
  const downloadCSV = () => {
    if (sortedData.length === 0) return;
    
    const headers = visibleColumns.join(',');
    const rows = sortedData.map((row) => {
      return visibleColumns.map((col) => {
        let val = row[col];
        if (val === null || val === undefined) return '';
        // Escape quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Export_${sheetData.name}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Excel Format
  const downloadExcel = () => {
    if (sortedData.length === 0) return;

    // Filter properties to keep only visible columns
    const exportData = sortedData.map(row => {
      const filteredRow: DataPoint = {};
      visibleColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetData.name.slice(0, 30)); // Max 31 chars
    XLSX.writeFile(wb, `Export_${sheetData.name}_${Date.now()}.xlsx`);
  };

  const visibleHeaders = sheetData.columns.filter((c) => visibleColumns.includes(c));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden w-full flex flex-col space-y-4 p-6">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Preview Data Table</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Menampilkan {searchedData.length} dari {sheetData.data.length} baris sheet '{sheetData.name}'
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Cari data..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-64 bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
            />
          </div>

          {/* Column Visibility dropdown */}
          <div className="relative">
            <button
              onClick={() => setColDropdownOpen(!colDropdownOpen)}
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <EyeOff size={14} />
              <span className="hidden sm:inline">Kolom</span>
            </button>

            {colDropdownOpen && (
              <div className="absolute right-0 top-[105%] bg-white border border-slate-100 rounded-xl shadow-premium z-30 p-2 min-w-[150px] max-h-56 overflow-y-auto">
                <p className="text-[9px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider border-b border-slate-50 mb-1">
                  Visibilitas Kolom
                </p>
                {sheetData.columns.map((col) => {
                  const isVisible = visibleColumns.includes(col);
                  return (
                    <label
                      key={col}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumnVisibility(col)}
                        className="rounded border-slate-300 text-[#C61E1E] focus:ring-[#C61E1E]"
                      />
                      <span className="truncate">{col}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export CSV button */}
          <button
            onClick={downloadCSV}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Download CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Export Excel button */}
          <button
            onClick={downloadExcel}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Download Excel"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Table Box */}
      <div className="w-full overflow-x-auto border border-slate-100 rounded-xl max-h-[450px]">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
            <tr>
              <th className="px-4 py-3.5 font-bold text-slate-400 uppercase tracking-wider text-[10px] w-12 text-center">No</th>
              {visibleHeaders.map((col) => {
                const isSorted = sortColumn === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-5 py-3.5 font-bold text-slate-600 uppercase tracking-wider text-[10px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#C61E1E]" /> : <ArrowDown size={12} className="text-[#C61E1E]" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleHeaders.length + 1} className="px-5 py-10 text-center text-slate-400 font-semibold">
                  Tidak ada data yang cocok dengan kriteria pencarian
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const rowNumber = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-semibold border-r border-slate-50/50">
                      {rowNumber}
                    </td>
                    {visibleHeaders.map((col) => {
                      const val = row[col];
                      const isNumeric = sheetData.numericColumns.includes(col);
                      const cellCoord = row._cellCoordinates?.[col] || '';

                      return (
                        <td 
                          key={col} 
                          className={`px-5 py-3 font-medium text-slate-700 ${
                            isNumeric ? 'font-mono text-right' : ''
                          }`}
                        >
                          <div className={`flex items-center gap-1.5 ${isNumeric ? 'justify-end' : ''}`}>
                            {cellCoord && (
                              <span 
                                className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100/80 px-1 py-0.5 rounded font-mono select-none shrink-0"
                                title={`Sel Excel: ${cellCoord}`}
                              >
                                {cellCoord}
                              </span>
                            )}
                            <span className="truncate">
                              {val === null || val === undefined 
                                ? '-' 
                                : isNumeric && typeof val === 'number' 
                                  ? val.toLocaleString('id-ID') 
                                  : String(val)
                              }
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
        {/* Rows per page */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#C61E1E] cursor-pointer"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size} data</option>
            ))}
          </select>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5">
          {/* First page */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white text-slate-600 shrink-0 transition-colors"
          >
            <ChevronsLeft size={14} />
          </button>
          
          {/* Prev page */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white text-slate-600 shrink-0 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page Indicator */}
          <span className="text-xs font-semibold text-slate-600 px-3">
            Halaman {currentPage} dari {totalPages}
          </span>

          {/* Next page */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white text-slate-600 shrink-0 transition-colors"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last page */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white text-slate-600 shrink-0 transition-colors"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
