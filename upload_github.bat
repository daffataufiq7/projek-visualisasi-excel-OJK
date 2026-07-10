@echo off
echo ===================================================
echo   MENGUPLOAD PROJEK KE GITHUB
echo   Repo: https://github.com/daffataufiq7/projek-visualisasi-excel-OJK.git
echo ===================================================
echo.

:: 1. Inisialisasi Git jika belum
if not exist .git (
    echo [1/4] Menginisialisasi Git repository...
    git init
) else (
    echo [1/4] Git repository sudah terinisialisasi.
)

:: 2. Tambahkan file ke staging area
echo [2/4] Menambahkan file ke staging area...
git add .

:: 3. Commit
echo [3/4] Melakukan commit...
git commit -m "Initial commit: projek visualisasi excel OJK"

:: 4. Rename branch ke main
echo [4/4] Mengubah nama branch utama menjadi 'main'...
git branch -M main

:: 5. Hubungkan remote dan push
echo.
echo [5/5] Menghubungkan remote dan push ke GitHub...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/daffataufiq7/projek-visualisasi-excel-OJK.git
git push -u origin main

echo.
echo ===================================================
echo   PROSES SELESAI
echo   Silakan periksa repository Anda di:
echo   https://github.com/daffataufiq7/projek-visualisasi-excel-OJK
echo ===================================================
echo.
pause
