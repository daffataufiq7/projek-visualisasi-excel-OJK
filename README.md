# 🏛️ FINSIGHT - Visualisasi Data Perbankan OJK Jawa Barat

<div align="center">

![FINSIGHT Header](public/screenshot.png)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-OJK_Internal-C61E1E?style=for-the-badge)](#)

**Platform Visualisasi & Analisis Data Laporan Keuangan Perbankan Terintegrasi**  
*Dirancang Khusus untuk Otoritas Jasa Keuangan (OJK) Kantor Regional Jawa Barat*

</div>

---

## 🌟 Tentang FINSIGHT

**FINSIGHT** (Financial Data Visualization & Analytics Insight) adalah platform web cerdas dan modern yang dikembangkan untuk memfasilitasi analisis kinerja keuangan perbankan regional di Jawa Barat. Aplikasi ini secara intuitif memproses dokumen Excel (.xlsx) bertingkat (multi-header & multi-sheet) secara instan (*client-side*), menyajikan grafik interaktif, analisis pertumbuhan Year-over-Year (YoY), pangsa pasar (*market share*), serta tabel pratinjau data riil secara akurat.

---

## ✨ Fitur Unggulan

### 📊 1. Analisis Multi-Sektor Perbankan
- **Perbankan Jawa Barat**: Visualisasi komprehensif tren Aset, Dana Pihak Ketiga (DPK), Kredit, NPL (Non-Performing Loan), dan LDR (Loan to Deposit Ratio).
- **Kredit per Jenis Penggunaan**: Analisis mendalam penyaluran kredit untuk Modal Kerja, Investasi, dan Konsumsi.
- **DPK per Portofolio**: Visualisasi komposisi pangsa pasar Giro, Tabungan, dan Deposito.

### 🔄 2. Analisis Year-over-Year (YoY) Cerdas & Presisi
- **Auto-Matching Irisan Bulan**: Menyaring dan membandingkan hanya bulan-bulan yang tersedia pada kedua tahun pembanding secara otomatis.
- **Preservasi State**: Pilihan bulan dan indikator pengguna tidak akan ter-reset saat melakukan navigasi, *scroll*, atau *re-render*.
- **Metrik Ganda**: Menghitung persen pertumbuhan nominal (`%`) serta perubahan absolut rasio perbankan dalam poin persentase (`ppt`).

### 🖼️ 3. Ekspor Grafik Vektor (SVG & PNG)
- Ekspor visualisasi grafik langsung ke format gambar **PNG HD** atau vektor **SVG** dengan satu klik.
- Otomatis menyertakan legenda warna dan label angka yang rapi pada hasil ekspor.

### 📑 4. Preview Data Table Interaktif
- **Format Nominal Riil**: Menampilkan persentase rasio perbankan (seperti LDR 130%, NPL 2,15%) secara tepat tanpa kesalahan skala desimal.
- **Fitur Lengkap**: Pencarian global cepat, pencarian kolom (*column visibility toggle*), pengurutan (*sorting*), serta ekspor data ke **Excel (.xlsx)** atau **CSV**.

### ⚡ 5. Sync Real-Time Multi-User (Ngrok & Localhost)
- Dilengkapi dengan **API Endpoints Server-side** (`/api/data`) & auto-polling sync.
- Pengunggahan file di localhost otomatis disinkronkan secara real-time ke pengguna yang mengakses melalui tunnel Ngrok.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework Utama** | Next.js 14 (Pages Router) | SSR/SSG & API Routes bawaan |
| **Bahasa Pemrograman** | TypeScript | Type safety ketat untuk data finansial |
| **Tampilan UI/UX** | Tailwind CSS & Framer Motion | Desain elegan khas OJK dengan animasi halus |
| **Visualisasi Grafis** | Recharts & HTML5 Canvas | Grafik batang, garis, tumpuk, dan donut interaktif |
| **Parser Excel** | SheetJS (XLSX) | Parsing client-side cepat tanpa dependensi server berat |
| **Icon Set** | Lucide React | Ikon finansial & navigasi modern |

---

## 🚀 Panduan Memulai (Quick Start)

### 📋 Prasyarat
- Node.js versi 18.x atau yang lebih baru
- npm / yarn / pnpm

### 1. Clone Repositori
```bash
git clone https://github.com/daffataufiq7/projek-visualisasi-excel-OJK.git
cd projek-visualisasi-excel-OJK
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Jalankan Mode Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 4. Build untuk Produksi
```bash
npm run build
npm run start
```

---

## 📁 Struktur Berkas Proyek

```text
projek-visualisasi-excel-OJK/
├── components/            # Komponen UI Modular
│   ├── OverviewDashboard.tsx  # Dashboard Utama Ringkasan Sektor
│   ├── VisualizationArea.tsx  # Area Grafik Perbankan Jawa Barat & Ekspor SVG/PNG
│   ├── KreditJenisView.tsx    # Panel Analisis Kredit per Jenis Penggunaan
│   ├── DpkView.tsx            # Panel Analisis DPK per Portofolio
│   ├── YoyAnalysis.tsx        # Panel Kalkulasi & Grafik YoY
│   ├── DataTable.tsx          # Preview Table Interaktif & Ekspor Data
│   ├── FilterArea.tsx         # Toolbar Filter Rentang Tahun & Bulan
│   └── Layout.tsx             # Sidebar Navigasi & Header Template
├── hooks/                 # Custom React Hooks (State Management Dashboard)
├── pages/                 # Halaman Router Next.js & API Endpoints (/api/data)
├── services/              # Parser Template Excel OJK & Kalkulasi Finansial
├── styles/                # Global Stylesheet & Custom Tailwind Theme
└── types/                 # Type Definitions TypeScript
```

---

## 📝 Format Template Excel

Aplikasi mendukung 3 template Excel standar OJK:
1. **Perbankan Jawa Barat**: Multi-header 2 tingkat untuk Aset, DPK, Kredit, NPL, dan LDR.
2. **Kredit per Jenis Penggunaan**: Penyaluran Kredit Modal Kerja, Investasi, dan Konsumsi.
3. **DPK per Portofolio**: Penghimpunan Dana Giro, Tabungan, dan Deposito.

> [!TIP]
> Anda dapat langsung mengunduh template resmi (.xlsx) melalui menu **Download Template** pada sidebar aplikasi.

---

<div align="center">

© 2026 **Otoritas Jasa Keuangan (OJK)** — Kantor Regional 2 Jawa Barat.  
*FINSIGHT Financial Analytics Platform*

</div>
