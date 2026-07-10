import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  LineChart, 
  FileSpreadsheet, 
  Settings, 
  Info, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  FileCheck,
  User,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import Logo from './Logo';
import { ActiveFile } from '../types/dashboard';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeFile: ActiveFile | null;
}

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  activeFile
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'yoy', name: 'Analisis YoY', icon: TrendingUp },
    { id: 'upload', name: 'Upload Excel', icon: UploadCloud },
    { id: 'template', name: 'Download Template', icon: FileSpreadsheet },
    { id: 'history', name: 'Riwayat Upload', icon: History },
    { id: 'visualisasi', name: 'Visualisasi', icon: LineChart },
    { id: 'laporan', name: 'Laporan', icon: FileCheck },
    { id: 'pengaturan', name: 'Pengaturan', icon: Settings },
    { id: 'tentang', name: 'Tentang', icon: Info },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 antialiased font-sans">
      {/* SIDEBAR FOR DESKTOP */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-slate-100 transition-all duration-300 relative z-20 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand logo area */}
        <div className={`p-6 border-b border-slate-50 flex items-center justify-between ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <Logo collapsed={sidebarCollapsed} />
        </div>

        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-100 rounded-full p-1 hover:bg-slate-50 hover:text-[#C61E1E] shadow-soft z-30 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#C61E1E] text-white shadow-md shadow-red-900/10 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#C61E1E]'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={20} className={isActive ? 'text-white' : ''} />
                {!sidebarCollapsed && <span className="text-sm">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[#C61E1E]/10 flex items-center justify-center text-[#C61E1E]">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-slate-800">Admin OJK Jabar</p>
                <p className="text-[10px] text-slate-400 truncate">Internal Staff</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-full bg-[#C61E1E]/10 flex items-center justify-center text-[#C61E1E]" title="Admin OJK Jabar">
                <User size={16} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER & NAVIGATION */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-40">
        <Logo collapsed={true} />
        <span className="font-extrabold text-sm text-[#C61E1E] tracking-wider uppercase">FINSIGHT</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-[#C61E1E]"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity">
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white flex flex-col p-6 z-50">
            <div className="flex items-center justify-between mb-8">
              <Logo />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-slate-50 text-slate-600 rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-[#C61E1E] text-white font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{item.name}</span>
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C61E1E]/10 flex items-center justify-center text-[#C61E1E]">
                <User size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Admin OJK Jabar</p>
                <p className="text-[10px] text-slate-400">Staff Internal</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16">
        {/* HEADER */}
        <header className="glass-header sticky top-0 z-10 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Financial Visualization Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Visualisasi otomatis data keuangan dari file Excel
            </p>
          </div>

          {/* Active file metadata block */}
          {activeFile && (
            <div className="flex items-center gap-3 bg-white/70 border border-slate-100 hover:border-slate-200/80 p-2.5 rounded-xl transition-all self-start sm:self-center shadow-soft">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                <FileCheck size={18} />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold truncate max-w-[150px] md:max-w-[200px] text-slate-800">
                    {activeFile.name}
                  </p>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-600">
                    {activeFile.activeSheetName} ({activeFile.sheetNames.length} Sheet)
                  </span>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-1 bg-emerald-50/50 border border-emerald-100/80 px-2 py-0.5 rounded-md">
                <CheckCircle size={10} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Processed</span>
              </div>
            </div>
          )}
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
